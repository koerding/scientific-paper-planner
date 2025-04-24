// FILE: src/store/appStore.js
// Key changes:
// 1. Enhanced setLoading method with console logging for debugging
// 2. Enhanced isAnyLoading method with console logging

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import sectionContent from '../data/sectionContent.json';
import { calculateUnlockedSections, isSectionVisible } from '../logic/progressionLogic';
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';

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
  modals: {
    confirmDialog: false, examplesDialog: false, reviewModal: false,
    privacyPolicy: false, saveDialog: false
  },
  loading: {
    project: false, import: false, export: false, review: false,
    improvement: false, chat: false
  },
  reviewData: null,
  onboarding: { step: 0, showHelpSplash: false }
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
        const isAnyLoadingActive = loadingValues.some(Boolean);
        // Debug logging (uncomment for debugging)
        // console.log("isAnyLoading check:", get().loading, "Result:", isAnyLoadingActive);
        return isAnyLoadingActive;
      },

      // --- Actions for Core State ---
      updateSectionContent: (sectionId, content) => set((state) => {
          if (!state.sections[sectionId]) return state;
            return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], content: content, lastEditTimestamp: Date.now(), editedSinceFeedback: state.sections[sectionId]?.feedbackRating !== null, }, }, };
      }),
      toggleMinimize: (sectionId) => set((state) => {
          if (!state.sections[sectionId]) return state;
          return { sections: { ...state.sections, [sectionId]: { ...state.sections[sectionId], isMinimized: !state.sections[sectionId].isMinimized, }, }, };
      }),
      setActiveToggle: (groupKey, sectionId) => set((state) => {
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
      setProMode: (enabled) => set((state) => {
          const updatedSections = { ...state.sections };
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
      resetState: () => set({
        sections: getInitialSectionStates(),
        activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
        scores: {},
        proMode: false,
        ...initialUiState,
        ...initialChatState,
        // Reset onboarding state, but keep showHelpSplash potentially true if it was set by user action
        onboarding: { ...initialUiState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),
      loadProjectData: (data) => set((state) => {
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
            const loadedChatMessages = data.chatMessages || {};
            return {
                sections: mergedSections, activeToggles: newActiveToggles, scores: newScores, proMode: true,
                modals: initialUiState.modals, loading: initialUiState.loading, reviewData: null,
                chatMessages: loadedChatMessages,
                currentChatMessage: '',
                currentChatSectionId: 'question',
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
       
       // --- Enhanced setLoading method with debug logging ---
       setLoading: (loadingType, status = true) => {
         // Debug logging
         console.log(`Setting loading state: ${loadingType} = ${status}`);
         
         set((state) => {
           const newLoadingState = { 
             ...state.loading, 
             [loadingType]: status 
           };
           
           // Debug: log the new state
           console.log(`New loading state:`, newLoadingState);
           
           return { 
             loading: newLoadingState 
           };
         });
       },
       
       clearLoading: (loadingType) => set((state) => ({ loading: { ...state.loading, [loadingType]: false } })),
       setReviewData: (data) => set({ reviewData: data }),
       clearReviewData: () => set({ reviewData: null }),
       setOnboardingStep: (step) => set((state) => ({ onboarding: { ...state.onboarding, step: step } })),

       // --- MODIFICATION: Keep _initializeOnboarding logic but don't call from onRehydrateStorage ---
       _initializeOnboarding: () => {
          console.log("Attempting to initialize onboarding state..."); // Add log
          try {
             const shouldHide = localStorage.getItem('hideWelcomeSplash') === 'true';
             set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: !shouldHide } }));
             console.log("Onboarding state initialized. showHelpSplash:", !shouldHide);
          } catch (error) {
             console.error("Error during _initializeOnboarding:", error);
          }
       },
       // --- END MODIFICATION ---

       showHelpSplash: () => {
           localStorage.removeItem('hideWelcomeSplash');
           // Update state - the UI (SplashScreenManager) should react to this change
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
       resetChat: () => set({
           chatMessages: {},
           currentChatMessage: '',
           currentChatSectionId: get().currentChatSectionId,
           loading: { ...get().loading, chat: false }
       }),
       sendMessage: async (content = null) => {
            const messageContent = content || get().currentChatMessage;
            const currentSectionId = get().currentChatSectionId;
            if (!messageContent.trim() || !currentSectionId) return;
            get().addChatMessage(currentSectionId, { role: 'user', content: messageContent });
            set({ currentChatMessage: '' });
            get().setLoading('chat', true);
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
                    currentSectionId,
                    userInputs,
                    sectionContent.sections || [],
                    { temperature: 0.9 },
                    historyForApi,
                    systemPrompt,
                    false
                );
                get().addChatMessage(currentSectionId, { role: 'assistant', content: response });
            } catch (error) {
                console.error('Error sending chat message via Zustand:', error);
                get().addChatMessage(currentSectionId, {
                    role: 'assistant',
                    content: "I'm sorry, I encountered an error processing your message. Please try again."
                });
            } finally {
                get().setLoading('chat', false);
            }
       },


    }),
    {
      name: 'scientific-project-planner-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
         sections: state.sections,
         activeToggles: state.activeToggles,
         scores: state.scores,
         proMode: state.proMode,
         chatMessages: state.chatMessages,
         // Persist onboarding state without showHelpSplash maybe? Or persist it all.
         // Let's persist it all for now.
         onboarding: state.onboarding
      }),
      version: 3, // Keep version
      // --- MODIFICATION: Simplified onRehydrateStorage ---
      onRehydrateStorage: (state) => {
        console.log("Zustand state hydration starting...");
        // Return only the error handler part
        return (hydratedState, error) => {
          if (error) {
            console.error("Error rehydrating Zustand state:", error);
            // Potentially clear corrupted storage here?
            // localStorage.removeItem('scientific-project-planner-state');
          } else {
            console.log("Zustand state hydration finished successfully.");
            // DO NOT call _initializeOnboarding here anymore.
          }
        }
      }
      // --- END MODIFICATION ---
    }
  )
);

export default useAppStore;

// --- Add action to be called from App component ---
export const initializeOnboardingFromLocalStorage = () => {
    useAppStore.getState()._initializeOnboarding();
};
// --- End Add ---
