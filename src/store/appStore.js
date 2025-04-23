// FILE: src/store/appStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import sectionContent from '../data/sectionContent.json'; // Adjust path as needed
import { calculateUnlockedSections, isSectionVisible } from '../logic/progressionLogic'; // Adjust path as needed

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

// --- Initial State for UI elements previously in UIContext ---
const initialUiState = {
  modals: {
    confirmDialog: false,
    examplesDialog: false,
    reviewModal: false,
    privacyPolicy: false,
    saveDialog: false
  },
  loading: {
    project: false,
    chat: false, // Keep chat loading separate if ChatContext remains
    import: false,
    export: false,
    review: false,
    improvement: false
  },
  reviewData: null,
  onboarding: {
    step: 0,
    showHelpSplash: false // Managed by effect below
  }
};
// --- End Initial UI State ---


// Central Zustand store
const useAppStore = create(
  persist( // Persist state to localStorage
    (set, get) => ({
      // --- Core State ---
      sections: getInitialSectionStates(),
      activeToggles: {
        approach: 'hypothesis',
        dataMethod: 'experiment',
      },
      scores: {},
      proMode: false,

      // --- UI State (Migrated from UIContext) ---
      ...initialUiState,

      // --- Combined Loading Getter (Example) ---
      // You can create selectors outside or use computed properties if needed often
      isAnyLoading: () => Object.values(get().loading).some(Boolean),

      // --- Actions for Core State ---
      updateSectionContent: (sectionId, content) => set((state) => {
        if (!state.sections[sectionId]) return state;
        return {
            sections: {
                ...state.sections,
                [sectionId]: {
                ...state.sections[sectionId],
                content: content,
                lastEditTimestamp: Date.now(),
                editedSinceFeedback: state.sections[sectionId]?.feedbackRating !== null,
                },
            },
        };
      }),

      toggleMinimize: (sectionId) => set((state) => {
        if (!state.sections[sectionId]) return state;
        return {
            sections: {
                ...state.sections,
                [sectionId]: {
                ...state.sections[sectionId],
                isMinimized: !state.sections[sectionId].isMinimized,
                },
            },
        };
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
            updatedSections[sId] = {
              ...updatedSections[sId],
              isVisible: isVisible,
              aiInstructions: isCurrentSection ? feedbackData : updatedSections[sId].aiInstructions,
              feedbackRating: isCurrentSection ? rating : updatedSections[sId].feedbackRating,
              editedSinceFeedback: isCurrentSection ? false : updatedSections[sId].editedSinceFeedback,
            };
          });
          return { sections: updatedSections, scores: newScores };
      }),

      resetState: () => set({
        sections: getInitialSectionStates(),
        activeToggles: { approach: 'hypothesis', dataMethod: 'experiment' },
        scores: {},
        proMode: false,
        // Reset UI state as well
        ...initialUiState,
        // Explicitly handle onboarding persistence if needed differently on reset
        onboarding: { ...initialUiState.onboarding, showHelpSplash: get().onboarding.showHelpSplash } // Preserve splash visibility? Or reset too?
      }),

      loadProjectData: (data) => set((state) => {
          const initialSections = getInitialSectionStates();
          const loadedUserInputs = data.userInputs || {};
          const mergedSections = { ...initialSections };
          const approach = data.detectedToggles?.approach || 'hypothesis';
          const dataMethod = data.detectedToggles?.dataMethod || 'experiment';
          const newActiveToggles = { approach, dataMethod };
          const newScores = {}; // Reset scores
          Object.keys(mergedSections).forEach(id => { /* ... merge content ... */
            mergedSections[id] = {
              ...initialSections[id],
              content: loadedUserInputs[id] !== undefined ? loadedUserInputs[id] : initialSections[id].content,
              aiInstructions: null, feedbackRating: null, editedSinceFeedback: false,
              isMinimized: false, isVisible: true, // Expand/show all
            };
          });
           // Apply initial toggle visibility
           const { unlockedSections } = calculateUnlockedSections(newScores, newActiveToggles);
           Object.keys(mergedSections).forEach(sId => { /* ... set visibility based on toggles ... */
                const sectionDef = sectionContent.sections.find(s => s.id === sId);
                let isVisible = true; // Assume pro mode on load
                if (sectionDef?.category === 'approach' && sId !== approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== dataMethod) isVisible = false;
                 if(sId === 'question') isVisible = true; // Ensure question is visible
                 mergedSections[sId].isVisible = isVisible;
           });
          return {
            sections: mergedSections,
            activeToggles: newActiveToggles,
            scores: newScores,
            proMode: true, // Default to Pro Mode on load
             // Reset UI state on load, except maybe onboarding?
            modals: initialUiState.modals,
            loading: initialUiState.loading,
            reviewData: null, // Clear review data on project load
            // onboarding: state.onboarding // Keep existing onboarding state?
          };
      }),

       expandAllSections: () => set((state) => {
         const updatedSections = { ...state.sections };
         Object.keys(updatedSections).forEach(sId => { if (updatedSections[sId]) updatedSections[sId].isMinimized = false; });
         return { sections: updatedSections };
       }),

       // --- Actions for UI State (Migrated from UIContext) ---
       openModal: (modalName) => set((state) => {
           console.log(`[Zustand] Opening modal: ${modalName}`);
           return { modals: { ...state.modals, [modalName]: true } };
       }),

       closeModal: (modalName) => set((state) => {
           console.log(`[Zustand] Closing modal: ${modalName}`);
           // Decide if closing review modal should clear data
           // const newReviewData = modalName === 'reviewModal' ? null : state.reviewData;
           return {
               modals: { ...state.modals, [modalName]: false },
               // reviewData: newReviewData // Optional: clear review data on close
            };
       }),

       setLoading: (loadingType, status = true) => set((state) => {
           console.log(`[Zustand] Setting loading ${loadingType}: ${status}`);
           return { loading: { ...state.loading, [loadingType]: status } };
       }),

       // setLoading combines set and clear, but keep clear for symmetry if desired
       clearLoading: (loadingType) => set((state) => ({
           loading: { ...state.loading, [loadingType]: false }
       })),

       setReviewData: (data) => set((state) => {
           console.log("[Zustand] Setting review data:", data ? "Data provided" : "Data is null");
           return { reviewData: data };
       }),

       clearReviewData: () => set({ reviewData: null }),

       setOnboardingStep: (step) => set((state) => ({
           onboarding: { ...state.onboarding, step: step }
       })),

       _initializeOnboarding: () => { // Internal action called by effect setup
            const shouldHide = localStorage.getItem('hideWelcomeSplash') === 'true';
            set({ onboarding: { ...get().onboarding, showHelpSplash: !shouldHide } });
       },

       showHelpSplash: () => {
            localStorage.removeItem('hideWelcomeSplash');
            set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: true } }));
       },

       hideHelpSplash: () => {
            localStorage.setItem('hideWelcomeSplash', 'true');
            set((state) => ({ onboarding: { ...state.onboarding, showHelpSplash: false } }));
       },

    }),
    {
      name: 'scientific-project-planner-state',
      storage: createJSONStorage(() => localStorage),
      // Persist everything now, including UI state
      // partialize: (state) => ({ ... }) // Remove partialize if persisting all state
      version: 2, // Increment version if needed due to state shape change
      // migrate: (persistedState, version) => { ... }
      onRehydrateStorage: (state) => {
          console.log("Zustand state hydration finished");
          // Return a function to run after hydration is complete
          return (hydratedState, error) => {
            if (error) {
              console.error("Error rehydrating Zustand state:", error);
            } else {
              // Trigger onboarding visibility check *after* hydration
              useAppStore.getState()._initializeOnboarding();

              // Add global event listener for privacy policy here *after* store is ready
              // Note: This might be better placed in a top-level component effect
              // window.addEventListener('openPrivacyPolicy', () => {
              //     useAppStore.getState().openModal('privacyPolicy');
              // });
            }
          }
      }
    }
  )
);

// --- Initialize Onboarding Visibility After Hydration ---
// This ensures we read localStorage *after* the persisted state is loaded
// Moved the call to onRehydrateStorage above

// --- Add Global Event Listener (Consider moving to App.js useEffect) ---
// Moved the idea to onRehydrateStorage, but App.js is likely better place

export default useAppStore;
