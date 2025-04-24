// FILE: src/store/appStore.js
// Modified to add a separate global loading indicator
// REVERTED: loadProjectData handles original save format (content + chat)
// REVERTED: Removed merge function and simplified initial state
// FIXED: Removed setProMode call from onRehydrateStorage to prevent initialization errors

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
        const isQuestion = section.id === 'question';
        acc[section.id] = {
            id: section.id,
            title: section.title || 'Untitled Section',
            content: section.placeholder || '',
            originalInstructions: section.subsections || [], // Keep original instructions
            aiInstructions: null, // AI feedback starts as null
            isMinimized: !isQuestion, // Start with only question expanded
            isVisible: isQuestion, // Start with only question visible (progression logic handles others)
            feedbackRating: null, // Feedback rating starts as null
            editedSinceFeedback: false, // Not edited initially
            lastEditTimestamp: 0, // Timestamp for edit tracking
        };
        return acc;
    }, {});
};

// Define the complete initial state structure (original version)
const initialState = {
    sections: getInitialSectionStates(),
    activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
    scores: {},
    proMode: false, // Start with proMode false
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
       // setProMode correctly calculates visibility when toggled
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
        ...initialState, // Reset to the original initial state
        // Reset onboarding state, but keep showHelpSplash potentially true if it was set by user action
        onboarding: { ...initialState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),

      // REVERTED: Load Project Data (handles original format)
      loadProjectData: (data) => set((state) => {
        console.log("Attempting to load project data (original format):", data);

        // Basic validation for the old format (expects userInputs or sections directly)
        let loadedUserInputs = {};
        let loadedChatMessages = {};
        let detectedApproach = 'hypothesis'; // Default approach
        let detectedDataMethod = 'experiment'; // Default data method

        if (data && typeof data === 'object') {
            if (data.userInputs && typeof data.userInputs === 'object') {
                // Standard format with userInputs property
                loadedUserInputs = data.userInputs;
                loadedChatMessages = data.chatMessages || {};
            } else if (data.sections && typeof data.sections === 'object') {
                // Handle format where sections object contains the content directly (from older saves or imports)
                loadedUserInputs = Object.entries(data.sections).reduce((acc, [id, sectionData]) => {
                    acc[id] = typeof sectionData === 'string' ? sectionData : (sectionData?.content || '');
                    return acc;
                }, {});
                loadedChatMessages = data.chatMessages || {};
                 // Try to detect toggles from imported data if available
                 if(data.detectedToggles) {
                    detectedApproach = data.detectedToggles.approach || detectedApproach;
                    detectedDataMethod = data.detectedToggles.dataMethod || detectedDataMethod;
                 }
            } else if (data.question || data.abstract || data.audience) {
                // Handle format where the data object itself IS the userInputs (e.g., from direct API response)
                loadedUserInputs = data;
                // Chat messages might not be present in this format
                loadedChatMessages = {};
            } else {
                 console.error("Invalid project data format for loading (original). Aborting load.");
                 alert("Failed to load project: Invalid file format.");
                 return state; // Return current state if validation fails
            }
        } else {
             console.error("Invalid project data format for loading (original). Aborting load.");
             alert("Failed to load project: Invalid file format.");
             return state; // Return current state if validation fails
        }

        const initialSections = getInitialSectionStates(); // Get fresh initial structure
        const mergedSections = {};
        const newActiveToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        const newScores = {}; // Reset scores on load

        // Merge loaded content into the initial section structure
        Object.keys(initialSections).forEach(id => {
            mergedSections[id] = {
                ...initialSections[id], // Start with default structure (includes isMinimized: false, isVisible: false except for question)
                content: loadedUserInputs[id] !== undefined ? loadedUserInputs[id] : initialSections[id].content,
                // Reset feedback-related fields on load for the original format
                aiInstructions: null,
                feedbackRating: null,
                editedSinceFeedback: false,
                isMinimized: false, // Ensure all are expanded on load
                // isVisible will be recalculated below based on loaded state
            };
        });

        // Recalculate visibility based on loaded toggles and reset scores (proMode defaults to true on load)
        const loadedProMode = true; // Assume proMode on load for simplicity with old format
        const { unlockedSections } = calculateUnlockedSections(newScores, newActiveToggles);
        Object.keys(mergedSections).forEach(sId => {
            const sectionDef = sectionContent.sections.find(s => s.id === sId);
            let isVisible = loadedProMode || unlockedSections.includes(sId);
            if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== newActiveToggles.approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== newActiveToggles.dataMethod) isVisible = false;
            }
             // Ensure 'question' section is always visible after load calculation
             if (sId === 'question') isVisible = true;
            mergedSections[sId].isVisible = isVisible;
        });

        console.log("Project data loaded successfully (original format).");

        // Return the fully loaded and merged state
        return {
            sections: mergedSections,
            activeToggles: newActiveToggles,
            scores: newScores,
            proMode: loadedProMode, // Set proMode on load
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
         // Define which parts of the state to persist (original version)
         sections: Object.entries(state.sections || {}).reduce((acc, [id, data]) => {
             acc[id] = data.content; // Only persist content
             return acc;
         }, {}),
         chatMessages: state.chatMessages, // Persist chat
         onboarding: state.onboarding // Persist onboarding state
         // Don't persist toggles, scores, proMode, UI state in old format
      }),
      version: 3, // Keep version or increment if schema changes significantly again
      onRehydrateStorage: (state) => {
        console.log("Zustand state hydration starting...");
        return (hydratedState, error) => {
          if (error) {
            console.error("Error rehydrating Zustand state:", error); // Log the actual error
          } else {
            console.log("Zustand state hydration finished successfully.");
            // --- REMOVED setProMode call ---
          }
        }
      },
      // Removed the custom merge function to revert to default behavior
    }
  )
);

export default useAppStore;

// --- Add action to be called from App component ---
export const initializeOnboardingFromLocalStorage = () => {
    useAppStore.getState()._initializeOnboarding();
};
