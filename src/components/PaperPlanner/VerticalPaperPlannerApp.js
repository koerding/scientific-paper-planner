// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
// Key changes:
// 1. Remove duplicate loading state tracking
// 2. Let child components access loading states directly from the store

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
     // REMOVED: console.log(`[VPPApp] activeSectionId changed to: ${activeSectionId}, updating chat section`);
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
  const handleLoadProject = (data) => { loadStoreProjectData(data); setActiveSectionId(data?.detectedToggles?.approach || 'question'); expandAllSections(); };
  const handleSaveRequest = () => openModal('saveDialog');
  const handleSaveWithFilename = (fileName) => { trackSave(); const sectionsToSave = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); saveProjectAsJson(sectionsToSave, chatMessages, fileName); closeModal('saveDialog'); };
  const handleExportRequest = () => { trackExport('any'); const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); exportProject(sectionsToExport, chatMessages); };
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
            const result = await improveBatchInstructions( null, null, sectionContentData );
            if (result.success && result.improvedData) {
                result.improvedData.forEach(feedbackItem => {
                    if (feedbackItem && feedbackItem.id) {
                        updateSectionFeedback(feedbackItem.id, feedbackItem);
                    }
                });
                const improvedSectionId = result.improvedData[0]?.id;
                if (improvedSectionId === targetSectionId) {
                    const nextSectionId = getNextVisibleSectionId(targetSectionId, activeToggles.approach, activeToggles.dataMethod);
                    if (nextSectionId && sections?.[nextSectionId]?.isMinimized) {
                        useAppStore.getState().toggleMinimize(nextSectionId);
                    }
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
      // console.log("[VPPApp] Sections not initialized, rendering null"); // Removed
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
          closeReviewModal: handleCloseReviewModal,
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      // No need to pass isAnyAiLoading as a prop anymore - components access store directly
    />
  );
};

export default VerticalPaperPlannerApp;
