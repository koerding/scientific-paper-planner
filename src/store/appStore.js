// FILE: src/store/appStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import sectionContent from '../data/sectionContent.json'; // Adjust path as needed
import { calculateUnlockedSections, isSectionVisible } from '../logic/progressionLogic'; // Adjust path as needed
// --- Import services needed for chat action ---
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';

// Helper to generate initial state for all sections
const getInitialSectionStates = () => { /* ... (no changes needed here) ... */
    if (!sectionContent || !Array.isArray(sectionContent.sections)) {
        console.error("sectionContent is missing or invalid!");
        return {}; // Return empty object to avoid crashing
    }
    return sectionContent.sections.reduce((acc, section) => {
        if (!section || !section.id) return acc; // Skip invalid sections
        acc[section.id] = {
        id: section.id,
        title: section.title || 'Untitled Section', // Default title
        content: section.placeholder || '',
        originalInstructions: section.subsections || [],
        aiInstructions: null,
        isMinimized: section.id !== 'question',
        isVisible: section.id === 'question',
        feedbackRating: null,
        editedSinceFeedback: false,
        lastEditTimestamp: 0,
        };
        return acc;
    }, {});
};

// Initial State for UI elements
const initialUiState = {
  modals: { /* ... (modal flags) ... */
    confirmDialog: false, examplesDialog: false, reviewModal: false,
    privacyPolicy: false, saveDialog: false
  },
  loading: { /* ... (loading flags) ... */
    project: false, import: false, export: false, review: false,
    improvement: false, chat: false // Added chat loading flag
  },
  reviewData: null,
  onboarding: { step: 0, showHelpSplash: false }
};

// --- Initial State for Chat ---
const initialChatState = {
    chatMessages: {}, // Structure: { sectionId: [messages] }
    currentChatMessage: '',
    currentChatSectionId: 'question', // Default chat section
};
// --- End Initial Chat State ---


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

      // --- Combined Loading Getter ---
      isAnyLoading: () => Object.values(get().loading).some(Boolean),

      // --- Actions for Core State ---
      updateSectionContent: (sectionId, content) => set((state) => { /* ... */
          if (!state.sections[sectionId]) return state;
            return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], content: content, lastEditTimestamp: Date.now(), editedSinceFeedback: state.sections[sectionId]?.feedbackRating !== null, }, }, };
      }),
      toggleMinimize: (sectionId) => set((state) => { /* ... */
          if (!state.sections[sectionId]) return state;
          return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], isMinimized: !state.sections[sectionId].isMinimized, }, }, };
      }),
      setActiveToggle: (groupKey, sectionId) => set((state) => { /* ... */
          const newActiveToggles = { ...state.activeToggles, [groupKey]: sectionId };
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
      setProMode: (enabled) => set((state) => { /* ... */
          const updatedSections = { ...state.sections };
            Object.keys(updatedSections).forEach(sId => {
                if (!updatedSections[sId]) return;
                updatedSections[sId].isVisible = isSectionVisible(sId, { ...state, proMode: enabled });
            });
            return { proMode: enabled, sections: updatedSections };
       }),
      updateSectionFeedback: (sectionId, feedbackData) => set((state) => { /* ... */
            if (!state.sections[sectionId]) return state;
            const rating = feedbackData?.rating;
            const newScores = { ...state.scores, [sectionId]: rating };
            const { unlockedSections } = calculateUnlockedSections(newScores, state.activeToggles);
            const updatedSections = { ...state.sections };
            Object.keys(updatedSections).forEach(sId => {
                if (!updatedSections[sId]) return;
                const isCurrentSection = sId === sectionId;
                const sectionDef = sectionContent.sections.find(s => s.id === sId);
                let isVisible = state.proMode || unlockedSections.includes(sId);
                 if (isVisible) {
                    if (sectionDef?.category === 'approach' && sId !== state.activeToggles.approach) isVisible = false;
                    else if (sectionDef?.category === 'dataMethod' && sId !== state.activeToggles.dataMethod) isVisible = false;
                 }
                updatedSections[sId] = { ...updatedSections[sId], isVisible: isVisible, aiInstructions: isCurrentSection ? feedbackData : updatedSections[sId].aiInstructions, feedbackRating: isCurrentSection ? rating : updatedSections[sId].feedbackRating, editedSinceFeedback: isCurrentSection ? false : updatedSections[sId].editedSinceFeedback, };
            });
            return { sections: updatedSections, scores: newScores };
       }),
      resetState: () => set({ // Also resets chat state now
        sections: getInitialSectionStates(),
        activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
        scores: {},
        proMode: false,
        ...initialUiState,
        ...initialChatState, // Reset chat state
        onboarding: { ...initialUiState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),
      loadProjectData: (data) => set((state) => { /* ... (merge content, reset scores, etc.) ... */
            const initialSections = getInitialSectionStates();
            const loadedUserInputs = data.userInputs || {};
            const mergedSections = { ...initialSections };
            const approach = data.detectedToggles?.approach || 'hypothesis';
            const dataMethod = data.detectedToggles?.dataMethod || 'experiment';
            const newActiveToggles = { approach, dataMethod };
            const newScores = {};
            Object.keys(mergedSections).forEach(id => {
                mergedSections[id] = { ...initialSections[id], content: loadedUserInputs[id] !== undefined ? loadedUserInputs[id] : initialSections[id].content, aiInstructions: null, feedbackRating: null, editedSinceFeedback: false, isMinimized: false, isVisible: true, };
            });
             const { unlockedSections } = calculateUnlockedSections(newScores, newActiveToggles);
             Object.keys(mergedSections).forEach(sId => {
                  const sectionDef = sectionContent.sections.find(s => s.id === sId);
                  let isVisible = true;
                  if (sectionDef?.category === 'approach' && sId !== approach) isVisible = false;
                  else if (sectionDef?.category === 'dataMethod' && sId !== dataMethod) isVisible = false;
                   if(sId === 'question') isVisible = true;
                   mergedSections[sId].isVisible = isVisible;
             });
            // Also load chat messages if present in the file
            const loadedChatMessages = data.chatMessages || {};
            return {
                sections: mergedSections, activeToggles: newActiveToggles, scores: newScores, proMode: true,
                modals: initialUiState.modals, loading: initialUiState.loading, reviewData: null,
                // Load chat state from file
                chatMessages: loadedChatMessages,
                currentChatMessage: '', // Reset input
                currentChatSectionId: 'question', // Reset section
            };
       }),
       expandAllSections: () => set((state) => { /* ... */
            const updatedSections = { ...state.sections };
            Object.keys(updatedSections).forEach(sId => { if (updatedSections[sId]) updatedSections[sId].isMinimized = false; });
            return { sections: updatedSections };
        }),

       // --- Actions for UI State ---
       openModal: (modalName) => set((state) => ({ modals: { ...state.modals, [modalName]: true } })),
       closeModal: (modalName) => set((state) => ({ modals: { ...state.modals, [modalName]: false } })),
       setLoading: (loadingType, status = true) => set((state) => ({ loading: { ...state.loading, [loadingType]: status } })),
       clearLoading: (loadingType) => set((state) => ({ loading: { ...state.loading, [loadingType]: false } })),
       setReviewData: (data) => set({ reviewData: data }),
       clearReviewData: () => set({ reviewData: null }),
       setOnboardingStep: (step) => set((state) => ({ onboarding: { ...state.onboarding, step: step } })),
       _initializeOnboarding: () => { /* ... */ const shouldHide = localStorage.getItem('hideWelcomeSplash') === 'true'; set({ onboarding: { ...get().onboarding, showHelpSplash: !shouldHide } }); },
       showHelpSplash: () => { /* ... */ localStorage.removeItem('hideWelcomeSplash'); set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: true } })); },
       hideHelpSplash: () => { /* ... */ localStorage.setItem('hideWelcomeSplash', 'true'); set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: false } })); },

       // --- Actions for Chat State ---
       setCurrentChatMessage: (message) => set({ currentChatMessage: message }),

       setCurrentChatSectionId: (sectionId) => set({ currentChatSectionId: sectionId || 'question' }),

       addChatMessage: (sectionId, message) => set((state) => {
           const currentMessages = state.chatMessages[sectionId] || [];
           return {
               chatMessages: {
                   ...state.chatMessages,
                   [sectionId]: [...currentMessages, { ...message, timestamp: Date.now() }]
               }
           };
       }),

       clearChatMessagesForSection: (sectionId) => set((state) => {
           if (!sectionId) return state;
           return {
               chatMessages: {
                   ...state.chatMessages,
                   [sectionId]: []
               }
           };
       }),

       resetChat: () => set({ // Resets all chat state
           chatMessages: {},
           currentChatMessage: '',
           currentChatSectionId: get().currentChatSectionId, // Keep current section focus? Or reset to 'question'?
           loading: { ...get().loading, chat: false } // Reset chat loading specifically
       }),

       // Async action to send message
       sendMessage: async (content = null) => {
           const messageContent = content || get().currentChatMessage;
           const currentSectionId = get().currentChatSectionId;
           if (!messageContent.trim() || !currentSectionId) return;

           // Add user message via existing action
           get().addChatMessage(currentSectionId, { role: 'user', content: messageContent });
           set({ currentChatMessage: '' }); // Clear input

           // Set loading state via existing action
           get().setLoading('chat', true);

           try {
               const state = get(); // Get current state for context
               const userInputs = Object.entries(state.sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {});
               const sectionDef = sectionContent.sections.find(s => s.id === currentSectionId) || {};
               const historyForApi = state.chatMessages[currentSectionId] || [];

               const systemPrompt = buildSystemPrompt('chat', {
                   sectionTitle: sectionDef.title || 'section',
                   instructionsText: sectionDef.originalInstructions?.map(s => `${s.title}: ${s.instruction}`).join('\n') || '',
                   // Consider if feedbackText is relevant here or just instructions
                   // feedbackText: sectionDef.aiInstructions?.overallFeedback || '',
                   userContent: userInputs[currentSectionId] || "They haven't written anything substantial yet."
               });

               const response = await callOpenAI(
                   messageContent,
                   currentSectionId,
                   userInputs,
                   sectionContent.sections || [],
                   { temperature: 0.9 },
                   historyForApi,
                   systemPrompt,
                   false // JSON mode false for chat
               );

               // Add AI response via existing action
               get().addChatMessage(currentSectionId, { role: 'assistant', content: response });

           } catch (error) {
               console.error('Error sending chat message via Zustand:', error);
               get().addChatMessage(currentSectionId, {
                   role: 'assistant',
                   content: "I'm sorry, I encountered an error processing your message. Please try again."
               });
           } finally {
               // Clear loading state via existing action
               get().setLoading('chat', false);
           }
       },


    }),
    {
      name: 'scientific-project-planner-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ // Choose what to persist
         sections: state.sections,
         activeToggles: state.activeToggles,
         scores: state.scores,
         proMode: state.proMode,
         // Persist chat messages
         chatMessages: state.chatMessages,
         // Persist onboarding state? Optional.
         // onboarding: state.onboarding,
         // Do NOT persist modals, loading, reviewData, currentChatMessage, currentChatSectionId
      }),
      version: 3, // Increment version
      onRehydrateStorage: (state) => { /* ... (same as before) ... */
          console.log("Zustand state hydration finished");
          return (hydratedState, error) => {
            if (error) console.error("Error rehydrating Zustand state:", error);
            else useAppStore.getState()._initializeOnboarding();
          }
      }
    }
  )
);

export default useAppStore;
