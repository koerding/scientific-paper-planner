// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore';
import { useDocumentImport } from '../../hooks/useDocumentImport';
import { reviewScientificPaper } from '../../services/paperReviewService';
import { improveBatchInstructions } from '../../services/instructionImprovementService';
import { exportProject, saveProjectAsJson } from '../../utils/export';
import { trackSectionChange, trackApproachToggle, trackDataMethodToggle, trackExport, trackSave } from '../../utils/analyticsUtils';
import MainLayout from '../layout/MainLayout';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import '../../styles/PaperPlanner.css';
import { getNextVisibleSectionId } from '../../utils/sectionOrderUtils';
import sectionContentData from '../../data/sectionContent.json';


const VerticalPaperPlannerApp = () => {
  // --- Get State and Actions from Zustand Store ---
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const proMode = useAppStore((state) => state.proMode);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const setActiveToggle = useAppStore((state) => state.setActiveToggle);
  const updateSectionFeedback = useAppStore((state) => state.updateSectionFeedback);
  const resetState = useAppStore((state) => state.resetState);
  const loadStoreProjectData = useAppStore((state) => state.loadProjectData);
  const expandAllSections = useAppStore((state) => state.expandAllSections);
  const modals = useAppStore((state) => state.modals);
  const loadingFlags = useAppStore((state) => state.loading); // Still needed for specific flags
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
  // --- Get the getter function directly ---
  const isAnyLoading = useAppStore((state) => state.isAnyLoading);


  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question');
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- Document Import Hook ---
  // No longer need to get importLoading back from the hook
  const { handleDocumentImport } = useDocumentImport(
      loadStoreProjectData,
      sectionContentData,
      resetState
  );

  // REMOVED --- Combined loading state ---
  // const isAnyAiLoading = Object.values(loadingFlags).some(Boolean) || docImportSpecificLoading;


  // --- Effects ---
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
  }, []);

  useEffect(() => {
     setCurrentChatSectionId(activeSectionId);
     if (ReactGA.isInitialized) {
         ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
     }
  }, [activeSectionId, setCurrentChatSectionId]);

  // Other effects remain the same...

  // --- Core Functions ---
  // Most functions remain the same...
  const handleSectionFocus = (sectionId) => setActiveSectionId(sectionId);
  const handleContentChange = (sectionId, value) => updateSectionContent(sectionId, value);
  const handleApproachToggle = (approachId) => { trackApproachToggle(approachId); setActiveToggle('approach', approachId); };
  const handleDataMethodToggle = (methodId) => { trackDataMethodToggle(methodId); setActiveToggle('dataMethod', methodId); };
  const handleResetRequest = () => openModal('confirmDialog');
  const handleConfirmReset = () => { resetState(); setActiveSectionId('question'); closeModal('confirmDialog'); };
  const handleLoadProject = (data) => { loadStoreProjectData(data); setActiveSectionId(data?.detectedToggles?.approach || 'question'); expandAllSections(); };
  const handleSaveRequest = () => openModal('saveDialog');
  const handleSaveWithFilename = (fileName) => {
    // Call the actual save function
    saveProjectAsJson(
      // Pass the entire sections object from the store
      useAppStore.getState().sections,
      useAppStore.getState().chatMessages,
      fileName // Pass the specific filename
    );
    closeModal('saveDialog'); // Close the dialog after saving
  };
  const handleExportRequest = () => {
    // Call the actual export function
    exportProject(
      // Select necessary data from Zustand store
      Object.entries(useAppStore.getState().sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {}),
      useAppStore.getState().chatMessages,
      sectionContentData // Pass section definitions
    );
  };
  const handleOpenExamples = () => openModal('examplesDialog');
  const handleShowHelpSplash = () => {
    if (splashManagerRef.current && typeof splashManagerRef.current.showSplash === 'function') {
      splashManagerRef.current.showSplash();
    } else {
      console.error("Help Splash Manager ref not found or showSplash not available!");
      // As a fallback, maybe try the Zustand action if the ref fails?
      // zustandShowHelpSplash();
    }
  };
  const handleOpenReviewModal = () => openModal('reviewModal');
  const handleReviewPaperRequest = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading('review', true);
    clearReviewData(); // Clear previous review data

    try {
      const result = await reviewScientificPaper(file);
      setReviewData(result); // Update store with new review data
      if (!result.success) {
        alert(`Failed to review paper: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error handling paper review request:", error);
      alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
      setReviewData({ success: false, error: error.message, paperName: file.name });
    } finally {
      setLoading('review', false);
    }
  };
  const handleImprovementRequest = async (sectionId = null) => {
    // Note: This function might ideally live within the hook or be called differently,
    // but for fixing the flow, we integrate it here.
    setLoading('improvement', true);
    try {
        // Call the service function - it reads state from the store directly now
        const result = await improveBatchInstructions(
          null, // sections (deprecated)
          null, // userInputs (deprecated)
          sectionContentData, // Pass definitions
          false // forceImprovement (deprecated)
        );

        if (result.success && Array.isArray(result.improvedData)) {
            // Update feedback for each improved section
            result.improvedData.forEach(feedbackItem => {
                if (feedbackItem && feedbackItem.id) {
                    updateSectionFeedback(feedbackItem.id, feedbackItem);
                }
            });
             // Auto-advance logic (optional)
             if (sectionId && result.improvedData.some(item => item.id === sectionId && item.rating >= 6)) {
                 const nextSectionId = getNextVisibleSectionId(sectionId, useAppStore.getState().activeToggles.approach, useAppStore.getState().activeToggles.dataMethod);
                 if (nextSectionId) {
                     setActiveSectionId(nextSectionId);
                     // Optional: scroll to the next section
                     // sectionRefs.current[nextSectionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
             }
        } else {
            console.error("Instruction improvement failed:", result.errorMessage || result.message || "Unknown error");
            alert(`Instruction improvement failed: ${result.errorMessage || result.message || 'Please try again.'}`);
        }
    } catch (error) {
      console.error("Error in handleImprovementRequest:", error);
      alert(`Error getting feedback: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading('improvement', false);
    }
  };
  const handleCloseReviewModal = () => closeModal('reviewModal');

  // --- Props for Child Components ---
  const contentAreaProps = {
        activeSection: activeSectionId, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus, handleApproachToggle, handleDataMethodToggle,
        proMode, handleMagic: handleImprovementRequest,
        // REMOVED: isAnyAiLoading: isAnyAiLoading, // Pass the combined loading state
    };

  const interactionProps = {
      currentSection: currentChatSectionId,
      currentSectionTitle: sections?.[currentChatSectionId]?.title || '',
      chatMessages: chatMessages,
      currentMessage: currentChatMessage,
      setCurrentMessage: setCurrentChatMessage,
      handleSendMessage: zustandSendMessage,
      loading: loadingFlags.chat, // Pass specific chat loading flag
      // REMOVED: isAiBusy: isAnyAiLoading, // isAiBusy prop removed
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
      saveProject={handleSaveRequest}
      loadProject={handleLoadProject}
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
        closeReviewModal: handleCloseReviewModal, // Use the existing handler
        closePrivacyPolicy: () => closeModal('privacyPolicy'),
        closeSaveDialog: () => closeModal('saveDialog'),
        onConfirmReset: handleConfirmReset // Pass reset confirmation handler
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      // REMOVED: isAnyAiLoading={isAnyAiLoading} // Prop removed
    />
  );
};

export default VerticalPaperPlannerApp;
