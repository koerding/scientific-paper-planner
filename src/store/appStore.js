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
      // Store original instructions structure directly
      originalInstructions: section.subsections || [],
      aiInstructions: null, // For feedback/improved instructions
      isMinimized: section.id !== 'question', // Question expanded by default
      isVisible: section.id === 'question', // Only question visible initially
      feedbackRating: null,
      editedSinceFeedback: false,
      lastEditTimestamp: 0,
    };
    return acc;
  }, {});
};

// Central Zustand store
const useAppStore = create(
  persist( // Persist state to localStorage
    (set, get) => ({
      // --- State ---
      sections: getInitialSectionStates(),
      activeToggles: { // Track active selection within toggle groups
        approach: 'hypothesis', // Default active section ID for this group
        dataMethod: 'experiment', // Default active section ID for this group
      },
      scores: {}, // Track feedback scores for progression
      proMode: false,
      // Could add UI state like loading flags or active modal here if desired
      // isLoading: false,
      // activeModal: null,

      // --- Actions ---
      updateSectionContent: (sectionId, content) => set((state) => {
        if (!state.sections[sectionId]) return state; // Safety check
        return {
            sections: {
                ...state.sections,
                [sectionId]: {
                ...state.sections[sectionId],
                content: content,
                lastEditTimestamp: Date.now(),
                // Mark as edited if it already had feedback
                editedSinceFeedback: state.sections[sectionId]?.feedbackRating !== null,
                },
            },
        };
      }),

      toggleMinimize: (sectionId) => set((state) => {
        if (!state.sections[sectionId]) return state; // Safety check
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

      // Sets the active section within a toggle group (e.g., 'approach', 'dataMethod')
      setActiveToggle: (groupKey, sectionId) => set((state) => {
        const newActiveToggles = { ...state.activeToggles, [groupKey]: sectionId };
        const updatedSections = { ...state.sections };

        // Recalculate visibility for all sections based on ALL active toggles and progression
        const { unlockedSections } = calculateUnlockedSections(state.scores, newActiveToggles);

        Object.keys(updatedSections).forEach(sId => {
          if (!updatedSections[sId]) return; // Safety check
          const sectionDef = sectionContent.sections.find(s => s.id === sId);
          let isVisible = state.proMode || unlockedSections.includes(sId); // Base visibility on progression or proMode

          // Apply toggle logic only if unlocked
          if (isVisible) {
            if (sectionDef?.category === 'approach' && sId !== newActiveToggles.approach) {
              isVisible = false;
            } else if (sectionDef?.category === 'dataMethod' && sId !== newActiveToggles.dataMethod) {
              isVisible = false;
            }
          }
          updatedSections[sId] = { ...updatedSections[sId], isVisible: isVisible };
        });

        return { activeToggles: newActiveToggles, sections: updatedSections };
      }),

      setProMode: (enabled) => set((state) => {
        const updatedSections = { ...state.sections };
        const { unlockedSections } = calculateUnlockedSections(state.scores, state.activeToggles);
        // Update visibility based on new proMode state
        Object.keys(updatedSections).forEach(sId => {
            if (!updatedSections[sId]) return; // Safety check
            updatedSections[sId].isVisible = isSectionVisible(sId, { ...state, proMode: enabled });
        });
        return { proMode: enabled, sections: updatedSections };
      }),

      // Handles feedback updates and progression
      updateSectionFeedback: (sectionId, feedbackData) => set((state) => {
          if (!state.sections[sectionId]) return state; // Safety check

          const rating = feedbackData?.rating; // Expect rating in feedback
          const newScores = { ...state.scores, [sectionId]: rating };
          const { unlockedSections } = calculateUnlockedSections(newScores, state.activeToggles);
          const updatedSections = { ...state.sections };

          Object.keys(updatedSections).forEach(sId => {
            if (!updatedSections[sId]) return; // Safety check
            const isCurrentSection = sId === sectionId;
            const sectionDef = sectionContent.sections.find(s => s.id === sId);
            let isVisible = state.proMode || unlockedSections.includes(sId);

            // Apply toggle logic
             if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== state.activeToggles.approach) {
                  isVisible = false;
                } else if (sectionDef?.category === 'dataMethod' && sId !== state.activeToggles.dataMethod) {
                  isVisible = false;
                }
             }

            updatedSections[sId] = {
              ...updatedSections[sId],
              isVisible: isVisible,
              // Store feedback under aiInstructions
              aiInstructions: isCurrentSection ? feedbackData : updatedSections[sId].aiInstructions,
              feedbackRating: isCurrentSection ? rating : updatedSections[sId].feedbackRating,
              // Reset edited flag when new feedback is received
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
      }),

      loadProjectData: (data) => set((state) => {
          const initialSections = getInitialSectionStates();
          const loadedUserInputs = data.userInputs || {};
          const mergedSections = { ...initialSections };
          const approach = data.detectedToggles?.approach || 'hypothesis';
          const dataMethod = data.detectedToggles?.dataMethod || 'experiment';
          const newActiveToggles = { approach, dataMethod };

          // Reset scores for the loaded project
          const newScores = {};

          // Populate content and reset feedback/edit status
          Object.keys(mergedSections).forEach(id => {
            mergedSections[id] = {
              ...initialSections[id], // Start with template defaults
              content: loadedUserInputs[id] !== undefined ? loadedUserInputs[id] : initialSections[id].content,
              aiInstructions: null,
              feedbackRating: null,
              editedSinceFeedback: false,
              isMinimized: false, // Expand all on load
              isVisible: true, // Make all visible initially
            };
          });

           // Apply initial toggle visibility *after* making all visible
           const { unlockedSections } = calculateUnlockedSections(newScores, newActiveToggles); // Initially, only 'question' is unlocked
           Object.keys(mergedSections).forEach(sId => {
                const sectionDef = sectionContent.sections.find(s => s.id === sId);
                let isVisible = true; // Assume visible in pro mode (set below)

                if (sectionDef?.category === 'approach' && sId !== approach) {
                   isVisible = false;
                } else if (sectionDef?.category === 'dataMethod' && sId !== dataMethod) {
                   isVisible = false;
                }
                 // Ensure question is always visible
                 if(sId === 'question') isVisible = true;
                 mergedSections[sId].isVisible = isVisible;
           });


          return {
            sections: mergedSections,
            activeToggles: newActiveToggles,
            scores: newScores, // Scores are reset on load
            proMode: true, // Default to Pro Mode on load/import
          };
      }),

       // Action to expand all sections (sets isMinimized to false for all)
       expandAllSections: () => set((state) => {
         const updatedSections = { ...state.sections };
         Object.keys(updatedSections).forEach(sId => {
           if (updatedSections[sId]) {
             updatedSections[sId].isMinimized = false;
           }
         });
         return { sections: updatedSections };
       }),

    }),
    {
      name: 'scientific-project-planner-state', // localStorage key name
      storage: createJSONStorage(() => localStorage), // Define localStorage as storage
      // Only persist these parts of the state
      partialize: (state) => ({
         sections: state.sections, // Persist section content, visibility, etc.
         activeToggles: state.activeToggles,
         scores: state.scores,
         proMode: state.proMode
      }),
      // Optional: Add versioning for migrations if state shape changes later
      version: 1,
      // migrate: (persistedState, version) => { ... migration logic ... }
    }
  )
);

export default useAppStore;
