// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
// Key changes:
// 1. Remove duplicate loading state tracking
// 2. Let child components access loading states directly from the store
// 3. Updated handleSaveWithFilename to pass full relevant state

import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { useDocumentImport } from '../../hooks/useDocumentImport';
import { reviewScientificPaper } from '../../services/paperReviewService';
import { improveBatchInstructions } from '../../services/instructionImprovementService';
import { exportProject, saveProjectAsJson } from '../../utils/export';
import { trackSectionChange, trackApproachToggle, trackDataMethodToggle, trackExport, trackSave } from '../../utils/analyticsUtils';
import MainLayout from '../layout/MainLayout';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import '../../styles/PaperPlanner.css';
import { getNextVisibleSectionId } from '../../utils/sectionOrderUtils';
import sectionContentData from '../../data/sectionContent.json'; // Import section definitions


const VerticalPaperPlannerApp = () => {
  // --- Get State and Actions from Zustand Store ---
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const proMode = useAppStore((state) => state.proMode);
  const scores = useAppStore((state) => state.scores); // Get scores
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const setActiveToggle = useAppStore((state) => state.setActiveToggle);
  const updateSectionFeedback = useAppStore((state) => state.updateSectionFeedback);
  const resetState = useAppStore((state) => state.resetState);
  const loadStoreProjectData = useAppStore((state) => state.loadProjectData);
  const expandAllSections = useAppStore((state) => state.expandAllSections);
  const modals = useAppStore((state) => state.modals);
  const loadingFlags = useAppStore((state) => state.loading); // Get the loading object
  const reviewData = useAppStore((state) => state.reviewData);
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const setLoading = useAppStore((state) => state.setLoading);
  const setReviewData = useAppStore((state) => state.setReviewData);
  const clearReviewData = useAppStore((state) => state.clearReviewData);
  const zustandShowHelpSplash = useAppStore((state) => state.showHelpSplash);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const currentChatMessage = useAppStore((state) => state.currentChatMessage);
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  const setCurrentChatMessage = useAppStore((state) => state.setCurrentChatMessage);
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  const zustandSendMessage = useAppStore((state) => state.sendMessage);
  const getFullStateForSave = useAppStore((state) => ({ // Helper to get relevant state parts
      sections: state.sections,
      activeToggles: state.activeToggles,
      scores: state.scores,
      proMode: state.proMode,
      chatMessages: state.chatMessages,
      // Add other state parts if needed for save/load
  }));


  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question');
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- Get Current Section Data ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Document Import Hook ---
  const { importLoading: docImportSpecificLoading, handleDocumentImport } = useDocumentImport(
      loadStoreProjectData,
      sectionContentData,
      resetState
  );

  // --- Effects ---
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
  }, []);

  useEffect(() => {
     setCurrentChatSectionId(activeSectionId);
     // Track page view only if GA is initialized
     if (ReactGA.isInitialized) {
         ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
     }
  }, [activeSectionId, setCurrentChatSectionId]);

  useEffect(() => {
    if (sections) { Object.keys(sections).forEach(sectionId => { sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef(); }); }
   }, [sections]);

  useEffect(() => {
    const handleOpenPrivacyPolicy = () => openModal('privacyPolicy');
    window.addEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
    return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
   }, [openModal]);


  // --- Core Functions ---
  const handleSectionFocus = (sectionId) => setActiveSectionId(sectionId);
  const handleContentChange = (sectionId, value) => updateSectionContent(sectionId, value);
  const handleApproachToggle = (approachId) => { trackApproachToggle(approachId); setActiveToggle('approach', approachId); };
  const handleDataMethodToggle = (methodId) => { trackDataMethodToggle(methodId); setActiveToggle('dataMethod', methodId); };
  const handleResetRequest = () => openModal('confirmDialog');
  const handleConfirmReset = () => { resetState(); setActiveSectionId('question'); closeModal('confirmDialog'); };
  const handleLoadProject = (data) => {
    // loadStoreProjectData handles merging the loaded state now
    loadStoreProjectData(data);
    // Set active section based on loaded data, defaulting to 'question'
    const loadedState = useAppStore.getState(); // Get state *after* loading
    setActiveSectionId(loadedState.activeToggles?.approach || 'question');
    expandAllSections(); // Optionally expand all sections after load
  };
  const handleSaveRequest = () => openModal('saveDialog');

  // --- MODIFIED: Pass the full relevant state to saveProjectAsJson ---
  const handleSaveWithFilename = (fileName) => {
    trackSave();
    // Get the relevant parts of the state needed for saving
    const stateToSave = getFullStateForSave();
    // Pass the state object to the save function
    saveProjectAsJson(stateToSave, fileName);
    closeModal('saveDialog');
  };
  // --- END MODIFICATION ---

  const handleExportRequest = () => {
    trackExport('any');
    // Export still uses only user inputs for simplicity in exported formats (PDF, DOCX, MD)
    const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => {
      acc[id] = data?.content; // Export only the content for these formats
      return acc;
    }, {});
    exportProject(sectionsToExport, chatMessages); // Pass chat messages if needed for export format
  };

  const handleOpenExamples = () => openModal('examplesDialog');
  const handleShowHelpSplash = () => {
    zustandShowHelpSplash();
    if (splashManagerRef.current && typeof splashManagerRef.current.showSplash === 'function') {
      splashManagerRef.current.showSplash();
    } else {
      console.warn("Could not call showSplash on splashManagerRef");
    }
  };
  const handleOpenReviewModal = () => openModal('reviewModal');
  const handleReviewPaperRequest = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading('review', true);
        try {
            const result = await reviewScientificPaper(file);
            if (result.success) setReviewData(result);
            else { clearReviewData(); alert(`Error reviewing paper: ${result.error || 'Unknown error'}`); }
        } catch (error) { clearReviewData(); alert(`Error reviewing paper: ${error.message || 'Unknown error'}`); }
        finally { setLoading('review', false); }
    };
  const handleImprovementRequest = async (sectionId = null) => {
        const targetSectionId = sectionId || activeSectionId;
        const sectionToImprove = sections?.[targetSectionId];
        if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') {
           alert("Please add content to the section before requesting feedback.");
           return;
        }
        setLoading('improvement', true);
        try {
            // Pass null for currentSections and userInputs as the service now gets state from the store
            const result = await improveBatchInstructions( null, null, sectionContentData );
            if (result.success && result.improvedData) {
                result.improvedData.forEach(feedbackItem => {
                    if (feedbackItem && feedbackItem.id) {
                        // Update the store with the feedback data
                        updateSectionFeedback(feedbackItem.id, feedbackItem);
                    }
                });
                // Logic to potentially advance section after feedback
                const improvedSectionId = result.improvedData[0]?.id;
                if (improvedSectionId === targetSectionId) {
                    const nextSectionId = getNextVisibleSectionId(targetSectionId, activeToggles.approach, activeToggles.dataMethod);
                    if (nextSectionId && sections?.[nextSectionId]?.isMinimized) {
                        useAppStore.getState().toggleMinimize(nextSectionId);
                    }
                    // Optionally, focus the next section
                    // if (nextSectionId) {
                    //   setActiveSectionId(nextSectionId);
                    // }
                }
            } else {
                console.error("Improvement failed", result);
                alert(`Failed to get feedback: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error improving:", error);
            alert(`Error getting feedback: ${error.message}`);
        } finally {
            setLoading('improvement', false);
        }
     };
  const handleCloseReviewModal = () => closeModal('reviewModal');

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
        activeSection: activeSectionId,
        activeApproach: activeToggles.approach,
        activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus,
        handleApproachToggle,
        handleDataMethodToggle,
        proMode,
        handleMagic: handleImprovementRequest,
        // Loading state is accessed by components directly from store when needed
    };
  const interactionProps = {
      currentSection: currentChatSectionId,
      currentSectionTitle: sections?.[currentChatSectionId]?.title || '',
      chatMessages: chatMessages,
      currentMessage: currentChatMessage,
      setCurrentMessage: setCurrentChatMessage,
      handleSendMessage: zustandSendMessage,
      loading: loadingFlags.chat,
      // isAiBusy is accessed by components directly from store when needed
      currentSectionData: sections?.[currentChatSectionId] || null,
  };

  // --- Render ---
  if (!sections || Object.keys(sections).length === 0) {
      return <div className="p-4 text-center text-gray-500">Loading application state...</div>;
  }

  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={handleResetRequest}
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest} // Pass the function that opens the save dialog
      loadProject={handleLoadProject} // Pass the function that handles loading data into the store
      importDocumentContent={handleDocumentImport}
      onOpenReviewModal={handleOpenReviewModal}
      openExamplesDialog={handleOpenExamples}
      showHelpSplash={handleShowHelpSplash}
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps}
      modalState={modals}
      currentReviewData={reviewData}
      modalActions={{
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: handleCloseReviewModal,
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename} // Pass the function that performs the actual save
      // No need to pass isAnyAiLoading as a prop anymore - components access store directly
    />
  );
};

export default VerticalPaperPlannerApp;
