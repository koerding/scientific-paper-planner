// FILE: src/store/appStore.js
// Modified to add a separate global loading indicator
// Modified loadProjectData to handle new save format
// ADDED: Custom merge function for persist middleware
// MODIFIED: Simplified initial state for visibility/proMode

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import sectionContent from '../data/sectionContent.json';
import { calculateUnlockedSections, isSectionVisible } from '../logic/progressionLogic';
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';
import { validateProjectData } from '../utils/export'; // Import validation function

// Helper to generate initial state for all sections
const getInitialSectionStates = () => {
    if (!sectionContent || !Array.isArray(sectionContent.sections)) {
        console.error("sectionContent is missing or invalid!");
        return {}; // Return empty object to avoid crashing
    }
    return sectionContent.sections.reduce((acc, section) => {
        if (!section || !section.id) return acc; // Skip invalid sections
        acc[section.id] = {
            id: section.id,
            title: section.title || 'Untitled Section',
            content: section.placeholder || '',
            originalInstructions: section.subsections || [], // Keep original instructions
            aiInstructions: null, // AI feedback starts as null
            // --- SIMPLIFIED INITIAL STATE ---
            isMinimized: section.id !== 'question', // Start with only question expanded
            isVisible: true, // Make ALL sections initially visible
            // --- END SIMPLIFICATION ---
            feedbackRating: null, // Feedback rating starts as null
            editedSinceFeedback: false, // Not edited initially
            lastEditTimestamp: 0, // Timestamp for edit tracking
        };
        return acc;
    }, {});
};

// Define the complete initial state structure
const initialState = {
    sections: getInitialSectionStates(),
    activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
    scores: {},
    // --- SIMPLIFIED INITIAL STATE ---
    proMode: true, // Start with proMode true to match initial visibility
    // --- END SIMPLIFICATION ---
    modals: {
        confirmDialog: false, examplesDialog: false, reviewModal: false,
        privacyPolicy: false, saveDialog: false
    },
    loading: {
        project: false, import: false, export: false, review: false,
        improvement: false, chat: false
    },
    globalAiLoading: false,
    reviewData: null,
    onboarding: { step: 0, showHelpSplash: false },
    _importConfirmOperation: { active: false, message: null },
    chatMessages: {},
    currentChatMessage: '',
    currentChatSectionId: 'question',
};


// Central Zustand store
const useAppStore = create(
  persist(
    (set, get) => ({
      ...initialState, // Spread the initial state

      // --- Enhanced Combined Loading Getter ---
      isAnyLoading: () => {
        const loadingValues = Object.values(get().loading);
        const isRegularLoading = loadingValues.some(Boolean);
        const isGlobalLoading = get().globalAiLoading;
        return isRegularLoading || isGlobalLoading;
      },

      // --- New Global AI Loading Setter ---
      setGlobalAiLoading: (status) => {
        console.log(`Setting globalAiLoading to ${status}`);
        set({ globalAiLoading: status });
      },

      // --- Actions for Core State ---
      updateSectionContent: (sectionId, content) => set((state) => {
          if (!state.sections[sectionId]) return state;
            // Update content, set edited flag if feedback exists, update timestamp
            return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], content: content, lastEditTimestamp: Date.now(), editedSinceFeedback: state.sections[sectionId]?.feedbackRating !== null, }, }, };
      }),
      toggleMinimize: (sectionId) => set((state) => {
          if (!state.sections[sectionId]) return state;
          return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], isMinimized: !state.sections[sectionId].isMinimized, }, }, };
      }),
      setActiveToggle: (groupKey, sectionId) => set((state) => {
          const newActiveToggles = { ...state.activeToggles, [groupKey]: sectionId };
            // Recalculate visibility based on new toggles and scores
            const updatedSections = { ...state.sections };
            const { unlockedSections } = calculateUnlockedSections(state.scores, newActiveToggles);
            Object.keys(updatedSections).forEach(sId => {
              if (!updatedSections[sId]) return;
              const sectionDef = sectionContent.sections.find(s => s.id === sId);
              // Visibility depends on proMode OR being unlocked
              let isVisible = state.proMode || unlockedSections.includes(sId);
              // If visible, check if it should be hidden due to inactive toggle
              if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== newActiveToggles.approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== newActiveToggles.dataMethod) isVisible = false;
              }
              updatedSections[sId] = { ...updatedSections[sId], isVisible: isVisible };
            });
            return { activeToggles: newActiveToggles, sections: updatedSections };
       }),
       // Modified setProMode to correctly calculate visibility when toggled
       setProMode: (enabled) => set((state) => {
          const updatedSections = { ...state.sections };
          const currentScores = state.scores;
          const currentToggles = state.activeToggles;
          const { unlockedSections } = calculateUnlockedSections(currentScores, currentToggles);

          Object.keys(updatedSections).forEach(sId => {
              if (!updatedSections[sId]) return;
              const sectionDef = sectionContent.sections.find(s => s.id === sId);
              let isVisible = enabled || unlockedSections.includes(sId); // Use 'enabled' directly
              if (isVisible) {
                  if (sectionDef?.category === 'approach' && sId !== currentToggles.approach) isVisible = false;
                  else if (sectionDef?.category === 'dataMethod' && sId !== currentToggles.dataMethod) isVisible = false;
              }
              updatedSections[sId] = { ...updatedSections[sId], isVisible: isVisible };
          });
          return { proMode: enabled, sections: updatedSections };
      }),
      updateSectionFeedback: (sectionId, feedbackData) => set((state) => {
            if (!state.sections[sectionId]) return state;
            const rating = feedbackData?.rating;
            const newScores = { ...state.scores, [sectionId]: rating };
            // Recalculate unlocked sections based on the new score
            const { unlockedSections } = calculateUnlockedSections(newScores, state.activeToggles);
            const updatedSections = { ...state.sections };
            // Update visibility for all sections based on potentially new unlocks
            Object.keys(updatedSections).forEach(sId => {
                if (!updatedSections[sId]) return;
                const isCurrentSection = sId === sectionId;
                const sectionDef = sectionContent.sections.find(s => s.id === sId);
                let isVisible = state.proMode || unlockedSections.includes(sId);
                 if (isVisible) { // Check toggle visibility if section is unlocked
                    if (sectionDef?.category === 'approach' && sId !== state.activeToggles.approach) isVisible = false;
                    else if (sectionDef?.category === 'dataMethod' && sId !== state.activeToggles.dataMethod) isVisible = false;
                 }
                // Update the specific section with feedback data
                updatedSections[sId] = {
                    ...updatedSections[sId],
                    isVisible: isVisible, // Update visibility
                    aiInstructions: isCurrentSection ? feedbackData : updatedSections[sId].aiInstructions, // Update AI feedback
                    feedbackRating: isCurrentSection ? rating : updatedSections[sId].feedbackRating, // Update rating
                    editedSinceFeedback: isCurrentSection ? false : updatedSections[sId].editedSinceFeedback, // Reset edited flag
                };
            });
            return { sections: updatedSections, scores: newScores };
       }),
      resetState: () => set({
        ...initialState, // Reset to the full initial state (which now has proMode: true)
        // Reset onboarding state, but keep showHelpSplash potentially true if it was set by user action
        onboarding: { ...initialState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),

      // Load Project Data (from file) - Handles merging new data format
      loadProjectData: (data) => set((state) => {
        console.log("Attempting to load project data:", data);
        // Validate the loaded data structure (basic check)
        if (!validateProjectData(data)) {
            console.error("Invalid project data format. Aborting load.");
            alert("Failed to load project: Invalid file format.");
            return state; // Return current state if validation fails
        }

        const initialSections = getInitialSectionStates();
        // Load data based on the new save format (version 2.0+)
        const loadedSectionsData = data.sections || {};
        const loadedActiveToggles = data.activeToggles || { approach: 'hypothesis', dataMethod: 'experiment' };
        const loadedScores = data.scores || {};
        const loadedProMode = data.proMode !== undefined ? data.proMode : true; // Default to proMode true on load for simplicity
        const loadedChatMessages = data.chatMessages || {};

        const mergedSections = {};

        // Merge loaded section data with initial state structure
        Object.keys(initialSections).forEach(id => {
            const initialSection = initialSections[id];
            const loadedSection = loadedSectionsData[id];

            if (loadedSection) {
                // Merge properties, prioritizing loaded data but keeping originalInstructions
                mergedSections[id] = {
                    ...initialSection, // Start with default structure
                    content: loadedSection.content !== undefined ? loadedSection.content : initialSection.content,
                    aiInstructions: loadedSection.aiInstructions !== undefined ? loadedSection.aiInstructions : null,
                    isMinimized: loadedSection.isMinimized !== undefined ? loadedSection.isMinimized : initialSection.isMinimized,
                    feedbackRating: loadedSection.feedbackRating !== undefined ? loadedSection.feedbackRating : null,
                    editedSinceFeedback: loadedSection.editedSinceFeedback !== undefined ? loadedSection.editedSinceFeedback : false,
                    lastEditTimestamp: loadedSection.lastEditTimestamp || 0,
                    // isVisible will be recalculated below
                };
            } else {
                // If a section wasn't in the save file, use the initial state
                mergedSections[id] = initialSection;
            }
        });

        // Recalculate visibility based on loaded scores, toggles, and proMode
        const { unlockedSections } = calculateUnlockedSections(loadedScores, loadedActiveToggles);
        Object.keys(mergedSections).forEach(sId => {
            const sectionDef = sectionContent.sections.find(s => s.id === sId);
            let isVisible = loadedProMode || unlockedSections.includes(sId);
            if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== loadedActiveToggles.approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== loadedActiveToggles.dataMethod) isVisible = false;
            }
            mergedSections[sId].isVisible = isVisible;
        });

        console.log("Project data loaded successfully.");

        // Return the fully loaded and merged state
        return {
            sections: mergedSections,
            activeToggles: loadedActiveToggles,
            scores: loadedScores,
            proMode: loadedProMode,
            chatMessages: loadedChatMessages,
            // Reset UI elements on load
            modals: initialState.modals,
            loading: initialState.loading, // Reset loading flags
            globalAiLoading: false, // Ensure global loading is false
            reviewData: null,
            currentChatMessage: '',
            currentChatSectionId: 'question', // Reset chat focus
        };
      }),

       expandAllSections: () => set((state) => {
            const updatedSections = { ...state.sections };
            Object.keys(updatedSections).forEach(sId => { if (updatedSections[sId]) updatedSections[sId].isMinimized = false; });
            return { sections: updatedSections };
        }),

       // --- Actions for UI State ---
       openModal: (modalName) => set((state) => ({ modals: { ...state.modals, [modalName]: true } })),
       closeModal: (modalName) => set((state) => ({ modals: { ...state.modals, [modalName]: false } })),
       setLoading: (loadingType, status = true) => {
         console.log(`Setting loading state: ${loadingType} = ${status}`);
         set((state) => ({ loading: { ...state.loading, [loadingType]: status } }));
       },
       clearLoading: (loadingType) => set((state) => ({ loading: { ...state.loading, [loadingType]: false } })),
       setReviewData: (data) => set({ reviewData: data }),
       clearReviewData: () => set({ reviewData: null }),
       setOnboardingStep: (step) => set((state) => ({ onboarding: { ...state.onboarding, step: step } })),
       _initializeOnboarding: () => {
          try {
             const shouldHide = localStorage.getItem('hideWelcomeSplash') === 'true';
             set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: !shouldHide } }));
          } catch (error) { console.error("Error during _initializeOnboarding:", error); }
       },
       showHelpSplash: () => {
           localStorage.removeItem('hideWelcomeSplash');
           set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: true } }));
       },
       hideHelpSplash: () => {
           localStorage.setItem('hideWelcomeSplash', 'true');
           set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: false } }));
       },

       // --- Actions for Chat State ---
       setCurrentChatMessage: (message) => set({ currentChatMessage: message }),
       setCurrentChatSectionId: (sectionId) => set({ currentChatSectionId: sectionId || 'question' }),
       addChatMessage: (sectionId, message) => set((state) => {
           const currentMessages = state.chatMessages[sectionId] || [];
           return { chatMessages: { ...state.chatMessages, [sectionId]: [...currentMessages, { ...message, timestamp: Date.now() }] } };
       }),
       clearChatMessagesForSection: (sectionId) => set((state) => {
           if (!sectionId) return state;
           return { chatMessages: { ...state.chatMessages, [sectionId]: [] } };
       }),
       resetChat: () => set({
           chatMessages: {},
           currentChatMessage: '',
           currentChatSectionId: get().currentChatSectionId, // Keep current section focus
           loading: { ...get().loading, chat: false } // Only reset chat loading
       }),
       sendMessage: async (content = null) => {
            const messageContent = content || get().currentChatMessage;
            const currentSectionId = get().currentChatSectionId;
            if (!messageContent.trim() || !currentSectionId) return;
            get().addChatMessage(currentSectionId, { role: 'user', content: messageContent });
            set({ currentChatMessage: '' });
            get().setLoading('chat', true); // Set chat specific loading
            try {
                const state = get();
                const userInputs = Object.entries(state.sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {});
                const sectionDef = sectionContent.sections.find(s => s.id === currentSectionId) || {};
                const historyForApi = state.chatMessages[currentSectionId] || [];
                const systemPrompt = buildSystemPrompt('chat', {
                    sectionTitle: sectionDef.title || 'section',
                    instructionsText: sectionDef.originalInstructions?.map(s => `${s.title}: ${s.instruction}`).join('\n') || '',
                    userContent: userInputs[currentSectionId] || "They haven't written anything substantial yet."
                });
                const response = await callOpenAI(
                    messageContent,
                    currentSectionId, // Context type is the section ID for chat
                    userInputs, // Pass current content of all sections
                    sectionContent.sections || [], // Pass section definitions
                    { temperature: 0.9 }, // Chat options
                    historyForApi, // Pass relevant chat history
                    systemPrompt, // System prompt for chat persona
                    false // Don't use JSON mode for chat
                );
                get().addChatMessage(currentSectionId, { role: 'assistant', content: response });
            } catch (error) {
                console.error('Error sending chat message via Zustand:', error);
                get().addChatMessage(currentSectionId, {
                    role: 'assistant',
                    content: "I'm sorry, I encountered an error processing your message. Please try again."
                });
            } finally {
                get().setLoading('chat', false); // Clear chat specific loading
            }
       },
    }),
    {
      name: 'scientific-project-planner-state', // Keep the same name for persistence
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
         // Define which parts of the state to persist
         sections: state.sections,
         activeToggles: state.activeToggles,
         scores: state.scores,
         proMode: state.proMode,
         chatMessages: state.chatMessages,
         onboarding: state.onboarding // Persist onboarding state
         // Don't persist UI state like modals, loading flags, reviewData
      }),
      version: 3, // Keep version or increment if schema changes significantly again
      onRehydrateStorage: (state) => {
        console.log("Zustand state hydration starting...");
        return (hydratedState, error) => {
          if (error) {
            console.error("Error rehydrating Zustand state:", error);
          } else {
            console.log("Zustand state hydration finished successfully.");
            // After hydration, ensure visibility is correct based on the hydrated state
            // We can trigger a re-calculation by calling setProMode with the current proMode value
            useAppStore.getState().setProMode(useAppStore.getState().proMode);
          }
        }
      },
      // Custom merge function to handle state versioning safely
      merge: (persistedState, currentState) => {
        console.log("Merging persisted state with current state...");
        if (!persistedState || typeof persistedState !== 'object') {
          console.warn("No valid persisted state found, using current initial state.");
          return currentState;
        }

        // Deep merge, ensuring all properties from initial state exist
        const merged = { ...currentState }; // Start with current initial state

        for (const key in persistedState) {
          if (Object.hasOwnProperty.call(persistedState, key)) {
            // Only merge keys that are expected in the initial state
            if (key in currentState) {
              if (key === 'sections' && typeof persistedState.sections === 'object' && typeof currentState.sections === 'object') {
                // Special handling for 'sections': merge each section individually
                merged.sections = { ...currentState.sections }; // Start with initial sections structure
                for (const sectionId in persistedState.sections) {
                  if (Object.hasOwnProperty.call(persistedState.sections, sectionId) && merged.sections[sectionId]) {
                    // Merge the persisted section data onto the initial section structure
                    merged.sections[sectionId] = {
                      ...merged.sections[sectionId], // Ensure all initial fields exist
                      ...persistedState.sections[sectionId] // Overwrite with persisted data
                    };
                    // Ensure originalInstructions always comes from the *current* definition
                    const currentSectionDef = sectionContent.sections.find(s => s.id === sectionId);
                    merged.sections[sectionId].originalInstructions = currentSectionDef?.subsections || [];

                  } else if (Object.hasOwnProperty.call(persistedState.sections, sectionId)) {
                     console.warn(`Persisted section "${sectionId}" not found in initial state. Ignoring.`);
                  }
                }
                // Ensure all initial sections are present even if not in persisted state
                for (const sectionId in currentState.sections) {
                    if (!merged.sections[sectionId]) {
                        merged.sections[sectionId] = currentState.sections[sectionId];
                         // Ensure originalInstructions always comes from the *current* definition
                        const currentSectionDef = sectionContent.sections.find(s => s.id === sectionId);
                        merged.sections[sectionId].originalInstructions = currentSectionDef?.subsections || [];
                    }
                }

              } else if (typeof persistedState[key] === 'object' && persistedState[key] !== null && !Array.isArray(persistedState[key]) &&
                         typeof currentState[key] === 'object' && currentState[key] !== null && !Array.isArray(currentState[key])) {
                // Shallow merge for other top-level objects (like activeToggles, scores, chatMessages, onboarding)
                merged[key] = { ...currentState[key], ...persistedState[key] };
              } else {
                // For primitive types or arrays, overwrite with persisted value
                merged[key] = persistedState[key];
              }
            } else {
                console.warn(`Persisted key "${key}" not found in initial state. Ignoring.`);
            }
          }
        }
        console.log("State merge complete.");
        // Ensure proMode is correctly set based on merged state or default
        merged.proMode = merged.proMode !== undefined ? merged.proMode : initialState.proMode;
        return merged;
      },
    }
  )
);

export default useAppStore;

// --- Add action to be called from App component ---
export const initializeOnboardingFromLocalStorage = () => {
    useAppStore.getState()._initializeOnboarding();
};
