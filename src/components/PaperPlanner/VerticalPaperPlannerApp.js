// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
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
  // Pass sectionContentData to the hook
  const { importLoading: docImportSpecificLoading, handleDocumentImport } = useDocumentImport(
      loadStoreProjectData,
      sectionContentData, // Pass the imported section definitions
      resetState
  );

  // --- MODIFICATION: Calculate combined loading state ---
  // This calculation uses the 'loading' object from the store and the specific import hook loading state
  const isAnyAiLoading = Object.values(loadingFlags).some(Boolean) || docImportSpecificLoading;
  // --- END MODIFICATION ---


  // --- Effects ---
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
  }, []);

  useEffect(() => {
     console.log(`[VPPApp] activeSectionId changed to: ${activeSectionId}, updating chat section`);
     setCurrentChatSectionId(activeSectionId);
     ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
  }, [activeSectionId, setCurrentChatSectionId]);

  useEffect(() => {
    if (sections) { Object.keys(sections).forEach(sectionId => { sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef(); }); }
   }, [sections]);

  useEffect(() => {
    const handleOpenPrivacyPolicy = () => openModal('privacyPolicy');
    window.addEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
    return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
   }, [openModal]);


  // --- Core Functions (using store actions where applicable) ---
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

  // --- MODIFICATION: Updated handleShowHelpSplash to trigger ref ---
  const handleShowHelpSplash = () => {
    zustandShowHelpSplash();
    if (splashManagerRef.current && typeof splashManagerRef.current.showSplash === 'function') {
      splashManagerRef.current.showSplash();
    } else {
      console.warn("Could not call showSplash on splashManagerRef");
    }
  };
  // --- END MODIFICATION ---

  const handleOpenReviewModal = () => openModal('reviewModal');

  const handleReviewPaperRequest = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading('review', true); // Use store action
        try {
            const result = await reviewScientificPaper(file);
            if (result.success) setReviewData(result); // Use store action
            else { clearReviewData(); alert(`Error reviewing paper: ${result.error || 'Unknown error'}`); } // Use store action
        } catch (error) { clearReviewData(); alert(`Error reviewing paper: ${error.message || 'Unknown error'}`); } // Use store action
        finally { setLoading('review', false); } // Use store action
    };

  // --- MODIFICATION: Update handleImprovementRequest to pass necessary state ---
  const handleImprovementRequest = async (sectionId = null) => {
        const targetSectionId = sectionId || activeSectionId;
        const sectionToImprove = sections?.[targetSectionId];

        // Check if section exists and has content before setting loading state
        if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') {
           alert("Please add content to the section before requesting feedback.");
           return;
        }

        setLoading('improvement', true); // Set specific loading flag
        try {
            // Call the service - it will get state internally now
            const result = await improveBatchInstructions(
                null, // Pass null or empty array, service gets state internally
                null, // Pass null or empty object, service gets state internally
                sectionContentData // Pass section definitions
                // No need to pass forceImprovement=true, filtering logic handles it
            );

            // Process results if successful
            if (result.success && result.improvedData) {
                // Update feedback for each section that received it
                result.improvedData.forEach(feedbackItem => {
                    if (feedbackItem && feedbackItem.id) {
                        updateSectionFeedback(feedbackItem.id, feedbackItem); // Use store action
                    }
                });

                // Auto-expand next section if current one improved successfully
                const improvedSectionId = result.improvedData[0]?.id; // Assuming single section improvement for now
                if (improvedSectionId === targetSectionId) {
                    const nextSectionId = getNextVisibleSectionId(targetSectionId, activeToggles.approach, activeToggles.dataMethod);
                    if (nextSectionId && sections?.[nextSectionId]?.isMinimized) {
                        useAppStore.getState().toggleMinimize(nextSectionId); // Can call store action directly here
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
            setLoading('improvement', false); // Clear specific loading flag
        }
     };
   // --- END MODIFICATION ---

  const handleCloseReviewModal = () => closeModal('reviewModal');

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
        activeSection: activeSectionId, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus, handleApproachToggle, handleDataMethodToggle,
        proMode, handleMagic: handleImprovementRequest,
        isAnyAiLoading: isAnyAiLoading, // Pass the combined loading state
    };

  // --- MODIFICATION: Update interactionProps ---
  const interactionProps = {
      currentSection: currentChatSectionId,
      currentSectionTitle: sections?.[currentChatSectionId]?.title || '',
      chatMessages: chatMessages,
      currentMessage: currentChatMessage,
      setCurrentMessage: setCurrentChatMessage,
      handleSendMessage: zustandSendMessage,
      loading: loadingFlags.chat, // Pass specific chat loading flag
      isAiBusy: isAnyAiLoading, // Pass the combined loading state as isAiBusy
      currentSectionData: sections?.[currentChatSectionId] || null,
  };
  // --- END MODIFICATION ---

  // --- Render ---
  if (!sections || Object.keys(sections).length === 0) {
      console.log("[VPPApp] Sections not initialized, rendering null");
      return <div className="p-4 text-center text-gray-500">Loading application state...</div>;
  }

  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={handleResetRequest}
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest}
      loadProject={handleLoadProject}
      importDocumentContent={handleDocumentImport} // Pass the hook's import handler
      onOpenReviewModal={handleOpenReviewModal}
      openExamplesDialog={handleOpenExamples}
      showHelpSplash={handleShowHelpSplash}
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps} // Pass updated interactionProps
      modalState={modals}
      currentReviewData={reviewData} // Pass reviewData from store
      modalActions={{
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: handleCloseReviewModal,
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
          // setReviewData/clearReviewData actions are now handled internally by store
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      isAnyAiLoading={isAnyAiLoading} // Pass the combined loading state
    />
  );
};

export default VerticalPaperPlannerApp;
