// FILE: src/store/appStore.js
// Modified to add a separate global loading indicator
// Modified loadProjectData to handle new save format

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
        isMinimized: section.id !== 'question', // Start with only question expanded
        isVisible: section.id === 'question', // Start with only question visible
        feedbackRating: null, // Feedback rating starts as null
        editedSinceFeedback: false, // Not edited initially
        lastEditTimestamp: 0, // Timestamp for edit tracking
        };
        return acc;
    }, {});
};

// Initial State for UI elements
const initialUiState = {
  modals: {
    confirmDialog: false, examplesDialog: false, reviewModal: false,
    privacyPolicy: false, saveDialog: false
  },
  loading: {
    project: false, import: false, export: false, review: false,
    improvement: false, chat: false
  },
  // Add a new global loading flag that's not tied to browser dialog behavior
  globalAiLoading: false,
  reviewData: null,
  onboarding: { step: 0, showHelpSplash: false },
  _importConfirmOperation: { active: false, message: null } // For import confirmation
};

// Initial State for Chat
const initialChatState = {
    chatMessages: {}, // Structure: { sectionId: [messages] }
    currentChatMessage: '',
    currentChatSectionId: 'question', // Default chat section
};

// Central Zustand store
const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Core State ---
      sections: getInitialSectionStates(),
      activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
      scores: {},
      proMode: false,

      // --- UI State ---
      ...initialUiState,

      // --- Chat State ---
      ...initialChatState,

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
              let isVisible = state.proMode || unlockedSections.includes(sId);
              if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== newActiveToggles.approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== newActiveToggles.dataMethod) isVisible = false;
              }
              updatedSections[sId] = { ...updatedSections[sId], isVisible: isVisible };
            });
            return { activeToggles: newActiveToggles, sections: updatedSections };
       }),
      setProMode: (enabled) => set((state) => {
          const updatedSections = { ...state.sections };
            // Update visibility for all sections based on proMode
            Object.keys(updatedSections).forEach(sId => {
                if (!updatedSections[sId]) return;
                updatedSections[sId].isVisible = isSectionVisible(sId, { ...state, proMode: enabled });
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
        sections: getInitialSectionStates(),
        activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
        scores: {},
        proMode: false,
        ...initialUiState, // Reset UI state
        ...initialChatState, // Reset chat state
        // Reset onboarding state, but keep showHelpSplash potentially true if it was set by user action
        onboarding: { ...initialUiState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),

      // --- MODIFIED: Load Project Data ---
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
            modals: initialUiState.modals,
            loading: initialUiState.loading, // Reset loading flags
            globalAiLoading: false, // Ensure global loading is false
            reviewData: null,
            currentChatMessage: '',
            currentChatSectionId: 'question', // Reset chat focus
        };
      }),
      // --- END MODIFICATION ---

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
            // You could potentially dispatch initialization actions here if needed
            // e.g., recalculate visibility based on hydrated state, but loadProjectData handles it now.
          }
        }
      }
    }
  )
);

export default useAppStore;

// --- Add action to be called from App component ---
export const initializeOnboardingFromLocalStorage = () => {
    useAppStore.getState()._initializeOnboarding();
};
