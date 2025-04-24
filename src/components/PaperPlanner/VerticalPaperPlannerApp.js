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
  const handleSaveWithFilename = (fileName) => { /* ... */ };
  const handleExportRequest = () => { /* ... */ };
  const handleOpenExamples = () => openModal('examplesDialog');
  const handleShowHelpSplash = () => { /* ... */ };
  const handleOpenReviewModal = () => openModal('reviewModal');
  const handleReviewPaperRequest = async (event) => { /* ... */ };
  const handleImprovementRequest = async (sectionId = null) => { /* ... */ };
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
      modalActions={{ /* ...actions... */ }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      // REMOVED: isAnyAiLoading={isAnyAiLoading} // Prop removed
    />
  );
};

export default VerticalPaperPlannerApp;
