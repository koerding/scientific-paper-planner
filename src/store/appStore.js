// FILE: src/store/appStore.js
// MODIFIED: Add uiMode to store for single-panel layout toggle
// MODIFIED: Added setActiveSectionId and enhanced setUiMode functions
// MODIFIED: Enhanced setUiMode with scroll position management
// MODIFIED: Added sectionDefinitions to store state for guide mode display

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import sectionContent from '../data/sectionContent.json';
import { calculateUnlockedSections, isSectionVisible } from '../logic/progressionLogic';
import { callOpenAI } from '../services/openaiService';
import { buildSystemPrompt } from '../utils/promptUtils';
import { validateProjectData } from '../utils/export';

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
            isMinimized: false, // Start with only question expanded
            isVisible: isQuestion, // Start with only question visible (progression logic handles others)
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
    _forceUpdate: 0, // Dummy state for workaround
    
    // --- UI MODE STATE ---
    uiMode: 'write', // 'write' or 'guide'
    
    // --- SECTION DEFINITIONS ---
    sectionDefinitions: sectionContent.sections || [], // Store section definitions for guide mode
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

      // --- ENHANCED UI MODE ACTION ---
      setUiMode: (mode) => set((state) => {
        if (mode !== 'write' && mode !== 'guide') {
          console.error(`Invalid UI mode: ${mode}. Must be 'write' or 'guide'`);
          return state;
        }
        
        // Get section info
        const currentSectionId = state.currentChatSectionId;
        const lastSectionId = localStorage.getItem('lastActiveSectionId');
        const targetSectionId = currentSectionId || lastSectionId || 'question';
        
        // Check if we're switching from write to guide or vice versa
        const prevMode = state.uiMode;
        const isModeSwitching = prevMode !== mode;
        
        // SCROLL MANAGEMENT: Store current scroll position when leaving write mode
        if (isModeSwitching && prevMode === 'write') {
          // Store the current scroll position for write mode
          const contentEl = document.querySelector('.main-content');
          if (contentEl) {
            localStorage.setItem('writeScrollPosition', contentEl.scrollTop);
            console.log(`Stored write scroll position: ${contentEl.scrollTop}px`);
          }
        }
        
        // If we have a valid section ID, ensure that section is in focus
        if (targetSectionId && state.sections && state.sections[targetSectionId]) {
          const updatedSections = { ...state.sections };
          
          // Update section focus flags
          Object.keys(updatedSections).forEach(id => {
            if (updatedSections[id]) {
              updatedSections[id] = {
                ...updatedSections[id],
                isCurrentSection: id === targetSectionId
              };
            }
          });
          
          // Schedule scroll management after state update completes
          setTimeout(() => {
            if (isModeSwitching) {
              if (mode === 'guide') {
                // Entering guide mode: Scroll to top
                const contentEl = document.querySelector('.main-content');
                if (contentEl) {
                  contentEl.scrollTo({ top: 0, behavior: 'smooth' });
                  console.log('Scrolled to top for guide mode');
                }
              } else if (mode === 'write') {
                // Returning to write mode: Restore previous scroll position
                const storedScrollPos = localStorage.getItem('writeScrollPosition');
                if (storedScrollPos) {
                  const contentEl = document.querySelector('.main-content');
                  if (contentEl) {
                    contentEl.scrollTo({ 
                      top: parseInt(storedScrollPos, 10), 
                      behavior: 'smooth' 
                    });
                    console.log(`Restored write scroll position: ${storedScrollPos}px`);
                  }
                }
              }
            }
          }, 50);
          
          // Return updated state with new mode and focused section
          return { 
            uiMode: mode, 
            sections: updatedSections, 
            currentChatSectionId: targetSectionId 
          };
        }
        
        // Simple mode change if no valid section
        return { uiMode: mode };
      }),

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
          const currentScores = state.scores;
          const currentToggles = state.activeToggles;
          const { unlockedSections } = calculateUnlockedSections(currentScores, currentToggles);
          Object.keys(updatedSections).forEach(sId => {
              if (!updatedSections[sId]) return;
              const sectionDef = sectionContent.sections.find(s => s.id === sId);
              let isVisible = enabled || unlockedSections.includes(sId);
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
        ...initialState,
        onboarding: { ...initialState.onboarding, showHelpSplash: get().onboarding.showHelpSplash }
      }),

      // --- New function to set the active section ID ---
      setActiveSectionId: (sectionId) => set((state) => {
        // Make sure we're working with a valid section ID
        if (!sectionId || !state.sections || !state.sections[sectionId]) {
          console.warn(`Invalid section ID: ${sectionId}`);
          return state;
        }
        
        // Update the isCurrentSection flag for all sections
        const updatedSections = { ...state.sections };
        Object.keys(updatedSections).forEach(id => {
          if (updatedSections[id]) {
            updatedSections[id] = {
              ...updatedSections[id],
              isCurrentSection: id === sectionId
            };
          }
        });
        
        return { 
          sections: updatedSections, 
          currentChatSectionId: sectionId  // Also update chat context
        };
      }),

      // Load Project Data Action with WORKAROUND
      loadProjectData: (data) => { // Use set directly, not inside callback for initial part
        console.log("Attempting to load project data (original format):", data);

        // Default values
        let loadedUserInputs = {};
        let loadedChatMessages = {};
        let detectedApproach = 'hypothesis';
        let detectedDataMethod = 'experiment';

        // --- Determine loaded content and detected toggles ---
        if (data && typeof data === 'object') {
            if (data.userInputs && typeof data.userInputs === 'object') {
                loadedUserInputs = data.userInputs;
                loadedChatMessages = data.chatMessages || {};
                // Check for detected toggles if structure provides them
                if (data.detectedToggles) {
                   detectedApproach = data.detectedToggles.approach || detectedApproach;
                   detectedDataMethod = data.detectedToggles.dataMethod || detectedDataMethod;
                }
            } else if (data.sections && typeof data.sections === 'object') {
                // Assume keys are section IDs
                loadedUserInputs = Object.entries(data.sections).reduce((acc, [id, sectionData]) => {
                    acc[id] = typeof sectionData === 'string' ? sectionData : (sectionData?.content || '');
                    return acc;
                }, {});
                loadedChatMessages = data.chatMessages || {};
                // Use passed detected toggles
                 if(data.detectedToggles) {
                    detectedApproach = data.detectedToggles.approach || detectedApproach;
                    detectedDataMethod = data.detectedToggles.dataMethod || detectedDataMethod;
                 }
            } else if (data.question || data.abstract || data.audience) {
                loadedUserInputs = data; // Assume data is the userInputs
                loadedChatMessages = {};
                // Use passed detected toggles if available (might be from import hook)
                 if(data.detectedToggles) {
                    detectedApproach = data.detectedToggles.approach || detectedApproach;
                    detectedDataMethod = data.detectedToggles.dataMethod || detectedDataMethod;
                 }
            } else {
                 console.error("Invalid project data format for loading. Aborting load.");
                 alert("Failed to load project: Invalid file format.");
                 return; // Exit early
            }
        } else {
             console.error("Invalid project data format for loading. Aborting load.");
             alert("Failed to load project: Invalid file format.");
             return; // Exit early
        }

        const initialSections = getInitialSectionStates(); // Get fresh initial structure
        const mergedSections = {};
        const newActiveToggles = { approach: detectedApproach, dataMethod: detectedDataMethod };
        const loadedScores = data.scores || {};
        const loadedProMode = data.proMode !== undefined ? data.proMode : true;

        // Merge logic (simplified explanation, assumes full logic is complex but aims to create mergedSections)
        const sourceSections = data.sections && typeof data.sections === 'object' && typeof Object.values(data.sections)[0] === 'object'
            ? data.sections : initialSections;
        Object.keys(initialSections).forEach(id => {
            const loadedContent = loadedUserInputs[id];
            const sourceSectionData = sourceSections[id] || initialSections[id];
            mergedSections[id] = {
                ...initialSections[id], ...sourceSectionData,
                content: loadedContent !== undefined ? loadedContent : sourceSectionData.content,
                aiInstructions: sourceSectionData.aiInstructions || null,
                feedbackRating: sourceSectionData.feedbackRating || null,
                editedSinceFeedback: sourceSectionData.editedSinceFeedback || false,
                isMinimized: sourceSectionData.isMinimized !== undefined ? sourceSectionData.isMinimized : false,
            };
        });

        // Recalculate visibility based on loaded toggles and scores
        const { unlockedSections } = calculateUnlockedSections(loadedScores, newActiveToggles);
        Object.keys(mergedSections).forEach(sId => {
            const sectionDef = sectionContent.sections.find(s => s.id === sId);
            let isVisible = loadedProMode || unlockedSections.includes(sId);
            if (isVisible) {
                if (sectionDef?.category === 'approach' && sId !== newActiveToggles.approach) isVisible = false;
                else if (sectionDef?.category === 'dataMethod' && sId !== newActiveToggles.dataMethod) isVisible = false;
            }
             if (sId === 'question') isVisible = true;
            mergedSections[sId].isVisible = isVisible;
        });

        // Prepare the final state object for the initial set
        const newState = {
            sections: mergedSections,
            activeToggles: newActiveToggles,
            scores: loadedScores,
            proMode: loadedProMode,
            chatMessages: loadedChatMessages,
            // Reset UI state on load
            modals: initialState.modals,
            loading: initialState.loading,
            globalAiLoading: false,
            reviewData: null,
            currentChatMessage: '',
            currentChatSectionId: 'question',
            // Keep section definitions
            sectionDefinitions: sectionContent.sections || [],
            // onboarding: data.onboarding || initialState.onboarding, // Optionally load onboarding state
        };

        // --- Perform the main state update ---
        set(newState);
        // ---

        console.log("Project data loaded successfully via loadProjectData (initial set). ActiveToggles:", newState.activeToggles);

        // --- WORKAROUND: Force state re-read ---
        // Schedule another small update slightly later to ensure propagation
        setTimeout(() => {
            set(state => ({ ...state, _forceUpdate: Math.random() })); // Change dummy value
            console.log("Forcing state re-read after loadProjectData.");
        }, 100); // Increased delay slightly to 100ms, adjust if needed
        // --- END WORKAROUND ---

      }, // End loadProjectData

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
                    messageContent, currentSectionId, userInputs,
                    sectionContent.sections || [], { temperature: 0.9 },
                    historyForApi, systemPrompt, false
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
    // Persistence Options
    {
      name: 'scientific-project-planner-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
         sections: state.sections,
         activeToggles: state.activeToggles,
         proMode: state.proMode,
         scores: state.scores,
         chatMessages: state.chatMessages,
         onboarding: state.onboarding,
         uiMode: state.uiMode, // Persist UI mode
      }),
      version: 5, // Incremented version since we've added uiMode
      onRehydrateStorage: (state) => {
        console.log("Zustand state hydration starting (v5)...");
        return (hydratedState, error) => {
          if (error) {
            console.error("Error rehydrating Zustand state (v5):", error);
            // Consider resetting state on critical hydration error
            // useAppStore.getState().resetState();
          } else {
            console.log("Zustand state hydration finished successfully (v5).");
            // Optionally add migration logic here if needed based on version
          }
        }
      },
    }
  )
);

export default useAppStore;

// Action to be called from App component
export const initializeOnboardingFromLocalStorage = () => {
    useAppStore.getState()._initializeOnboarding();
};
