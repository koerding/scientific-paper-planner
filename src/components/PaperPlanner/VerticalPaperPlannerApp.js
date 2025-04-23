// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { useChat } from '../../hooks/useChat';
// import { useUI } from '../../contexts/UIContext'; // REMOVED useUI
import { useDocumentImport } from '../../hooks/useDocumentImport';
import { reviewScientificPaper } from '../../services/paperReviewService';
import { improveBatchInstructions } from '../../services/instructionImprovementService';
import { exportProject, saveProjectAsJson } from '../../utils/export';
import { trackSectionChange, trackApproachToggle, trackDataMethodToggle, trackExport, trackSave } from '../../utils/analyticsUtils';
import MainLayout from '../layout/MainLayout';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import '../../styles/PaperPlanner.css';
import { getNextVisibleSectionId } from '../../utils/sectionOrderUtils';


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

  // --- Select UI State from Zustand Store ---
  const modals = useAppStore((state) => state.modals);
  const loadingFlags = useAppStore((state) => state.loading);
  const reviewData = useAppStore((state) => state.reviewData); // Select reviewData
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const setLoading = useAppStore((state) => state.setLoading);
  const setReviewData = useAppStore((state) => state.setReviewData);
  const clearReviewData = useAppStore((state) => state.clearReviewData);
  const zustandShowHelpSplash = useAppStore((state) => state.showHelpSplash); // Renamed for clarity


  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question');
  // const [isImproving, setIsImproving] = useState(false); // Now handled by store loading.improvement
  // const [isReviewing, setIsReviewing] = useState(false); // Now handled by store loading.review
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- Get Current Section Data ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Chat Hook (If ChatContext is kept separate) ---
  const {
     currentMessage, setCurrentMessage, loading: chatLoading, handleSendMessage, chatMessages,
  } = useChat(
      Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}),
      {}, () => {}, activeSectionId,
      { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] }
   );

  // --- Document Import Hook ---
  const { importLoading, handleDocumentImport } = useDocumentImport(
      loadStoreProjectData,
      { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] },
      resetState
  );

  // Combined loading state (using store and local hooks)
  const isAnyAiLoading = chatLoading || loadingFlags.import || loadingFlags.review || loadingFlags.improvement;

  // --- Effects ---
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
    console.log("[VPPApp] Mounted. Initial activeSectionId:", activeSectionId);
    // Log state directly from store if needed
    // console.log("[VPPApp] Mounted. Initial Zustand Modals state:", useAppStore.getState().modals);
    // console.log("[VPPApp] Mounted. Initial Zustand ReviewData state:", useAppStore.getState().reviewData);
  }, []);

  useEffect(() => {
     console.log(`[VPPApp] activeSectionId changed to: ${activeSectionId}`);
     ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
  }, [activeSectionId]);

  useEffect(() => {
     if (sections) {
         Object.keys(sections).forEach(sectionId => {
          sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef();
         });
     }
   }, [sections]);

   // Effect to handle global privacy policy event using store action
   useEffect(() => {
       const handleOpenPrivacyPolicy = () => {
           console.log("[VPPApp] Received 'openPrivacyPolicy' event.");
           openModal('privacyPolicy');
       };
       window.addEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
       return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacyPolicy);
   }, [openModal]); // Depend on openModal action from store


  // --- Core Functions ---
  const handleSectionFocus = (sectionId) => { setActiveSectionId(sectionId); };
  const handleContentChange = (sectionId, value) => { updateSectionContent(sectionId, value); };
  const handleApproachToggle = (approachId) => { trackApproachToggle(approachId); setActiveToggle('approach', approachId); };
  const handleDataMethodToggle = (methodId) => { trackDataMethodToggle(methodId); setActiveToggle('dataMethod', methodId); };
  const handleResetRequest = () => { console.log("[VPPApp] Reset Request"); openModal('confirmDialog'); };
  const handleConfirmReset = () => { console.log("[VPPApp] Confirm Reset"); resetState(); setActiveSectionId('question'); closeModal('confirmDialog'); };
  const handleLoadProject = (data) => { loadStoreProjectData(data); setActiveSectionId(data?.detectedToggles?.approach || 'question'); expandAllSections(); };
  const handleSaveRequest = () => { openModal('saveDialog'); };
  const handleSaveWithFilename = (fileName) => { trackSave(); const sectionsToSave = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); saveProjectAsJson(sectionsToSave, chatMessages, fileName); closeModal('saveDialog'); };
  const handleExportRequest = () => { trackExport('any'); const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); exportProject(sectionsToExport, chatMessages); };
  const handleOpenExamples = () => { openModal('examplesDialog'); };
  const handleShowHelpSplash = () => { zustandShowHelpSplash(); }; // Use store action

  const handleOpenReviewModal = () => {
      console.log("[VPPApp] handleOpenReviewModal");
      // Clear previous data *before* opening if desired, otherwise let modal handle it
      // clearReviewData();
      openModal('reviewModal');
  };

  const handleReviewPaperRequest = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      // Use setLoading from store
      setLoading('review', true);
      try {
          console.log(`[VPPApp] Requesting review for: ${file.name}`);
          const result = await reviewScientificPaper(file);
          if (result.success) {
              console.log("[VPPApp] Review successful, setting review data.");
              setReviewData(result); // Update store state
              // Modal should open or be open already if triggered by 'New Review' inside modal
              // openModal('reviewModal'); // Only call if not already open?
          } else {
              console.error("[VPPApp] Review failed:", result.error);
              clearReviewData();
              alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
          }
      } catch (error) {
           console.error("[VPPApp] Exception during review:", error);
           clearReviewData();
           alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
      }
      finally { setLoading('review', false); }
  };

  const handleImprovementRequest = async (sectionId = null) => {
        const targetSectionId = sectionId || activeSectionId;
        const sectionToImprove = sections?.[targetSectionId];
        if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') { alert("Please add content..."); return; }
        // Use setLoading from store
        setLoading('improvement', true);
        try {
            const sectionDefinitions = { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] };
            const currentInputs = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {});
            const result = await improveBatchInstructions([sectionToImprove], currentInputs, sectionDefinitions, true);
            if (result.success && result.improvedData && result.improvedData.length > 0) {
                updateSectionFeedback(targetSectionId, result.improvedData[0]);
                const nextSectionId = getNextVisibleSectionId(targetSectionId, activeToggles.approach, activeToggles.dataMethod);
                if (nextSectionId && sections?.[nextSectionId]?.isMinimized) { useAppStore.getState().toggleMinimize(nextSectionId); }
            } else { console.error("Improvement failed", result); alert("Failed to get feedback."); }
        } catch (error) { console.error("Error improving:", error); alert(`Error getting feedback: ${error.message}`); }
        finally { setLoading('improvement', false); }
     };

  const handleCloseReviewModal = () => {
      closeModal('reviewModal');
      // Decide whether to clear data on close
      // clearReviewData();
  };

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
        activeSection: activeSectionId, sections: safeSections, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus, handleContentChange, handleApproachToggle, handleDataMethodToggle, sectionRefs, handleMagic: handleImprovementRequest,
        isAnyAiLoading: Object.values(loadingFlags).some(Boolean), // Recalculate based on store loading flags
        proMode,
    };
  const interactionProps = {
        currentSection: activeSectionId, currentSectionTitle: currentSectionData?.title || '', chatMessages: chatMessages,
        currentMessage, setCurrentMessage, handleSendMessage, loading: chatLoading, currentSectionData: currentSectionData,
    };

  // --- Render ---
  // console.log("[VPPApp] Rendering. Zustand modals state:", modals);
  // console.log("[VPPApp] Rendering. Zustand reviewData state:", reviewData);

  if (!sections || Object.keys(sections).length === 0) { return null; }

  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={handleResetRequest}
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest}
      loadProject={handleLoadProject}
      importDocumentContent={handleDocumentImport} // Pass the hook's function
      onOpenReviewModal={handleOpenReviewModal}
      openExamplesDialog={handleOpenExamples}
      showHelpSplash={handleShowHelpSplash} // Use the store action trigger
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps}
      // Pass modal visibility flags from Zustand store
      modalState={modals}
      // No need to pass reviewData directly anymore
      // currentReviewData={reviewData} // REMOVED prop drill
      // Pass actions needed by ModalManager and its children
      modalActions={{
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: handleCloseReviewModal,
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
          // Add other actions if needed by modals, fetched from store
          setReviewData: setReviewData,
          clearReviewData: clearReviewData,
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      isAnyAiLoading={Object.values(loadingFlags).some(Boolean)} // Use recalculated loading state
    />
  );
};

export default VerticalPaperPlannerApp;
