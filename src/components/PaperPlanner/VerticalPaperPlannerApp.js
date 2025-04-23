// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { useChat } from '../../hooks/useChat'; // Keep using the chat hook
import { useUI } from '../../contexts/UIContext'; // Use UI context for modals
import { useDocumentImport } from '../../hooks/useDocumentImport'; // Keep for import logic
import { reviewScientificPaper } from '../../services/paperReviewService'; // Keep service
import { improveBatchInstructions } from '../../services/instructionImprovementService'; // Keep service
import { exportProject, saveProjectAsJson } from '../../utils/export'; // Keep utils
import { trackSectionChange, trackApproachToggle, trackDataMethodToggle, trackExport, trackSave } from '../../utils/analyticsUtils'; // Keep utils
import MainLayout from '../layout/MainLayout';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager'; // Keep for help splash
import '../../styles/PaperPlanner.css';
import { getNextVisibleSectionId } from '../../utils/sectionOrderUtils'; // Keep utils


const VerticalPaperPlannerApp = () => {
  // --- Get State and Actions from Zustand Store ---
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const proMode = useAppStore((state) => state.proMode);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const setActiveToggle = useAppStore((state) => state.setActiveToggle);
  const updateSectionFeedback = useAppStore((state) => state.updateSectionFeedback);
  const resetState = useAppStore((state) => state.resetState); // Get reset action from store
  const loadStoreProjectData = useAppStore((state) => state.loadProjectData);
  const expandAllSections = useAppStore((state) => state.expandAllSections);

  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question'); // Track focused section locally
  const [isImproving, setIsImproving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- UI Context for Modals ---
  const {
      modals, // Get the modals state object from the context
      openModal,
      closeModal,
      setReviewData,
      clearReviewData, // Get the clear action from context
      setLoading: setUILoading // Assuming useUI provides setLoading directly
  } = useUI();

  // --- Get Current Section Data (with fallback) ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Chat Hook ---
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
    resetState // Pass the store's reset action here
  );

  // Combined loading state
  const isAnyAiLoading = chatLoading || importLoading || isImproving || isReviewing;

  // --- Effects ---
  useEffect(() => {
    window.splashManagerRef = splashManagerRef;
    console.log("[VerticalPaperPlannerApp] Mounted. Initial activeSectionId:", activeSectionId);
    console.log("[VerticalPaperPlannerApp] Mounted. Initial UI modals state:", modals);
  }, []); // Run only on mount

   useEffect(() => { // Track subsequent section changes
       console.log(`[VerticalPaperPlannerApp] activeSectionId changed to: ${activeSectionId}`);
       ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
   }, [activeSectionId]);


  useEffect(() => { // Map refs
    if (sections) {
        Object.keys(sections).forEach(sectionId => {
         sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef();
        });
    }
  }, [sections]);

  // --- Core Functions ---

  const handleSectionFocus = (sectionId) => {
    if (sectionId && sectionId !== activeSectionId) {
      setActiveSectionId(sectionId); // Update local state
    }
  };

  const handleContentChange = (sectionId, value) => {
     if (sectionId) { updateSectionContent(sectionId, value); }
  };

  const handleApproachToggle = (approachId) => {
      trackApproachToggle(approachId);
      setActiveToggle('approach', approachId);
  };

  const handleDataMethodToggle = (methodId) => {
      trackDataMethodToggle(methodId);
      setActiveToggle('dataMethod', methodId);
  };

  // Reset Project -> Show Confirm Dialog
   const handleResetRequest = () => {
       console.log("[VerticalPaperPlannerApp] handleResetRequest called.");
       openModal('confirmDialog');
       console.log("[VerticalPaperPlannerApp] openModal('confirmDialog') executed.");
   };


  // Confirm Reset -> Call Store Action
  const handleConfirmReset = () => {
      console.log("[VerticalPaperPlannerApp] handleConfirmReset called.");
      resetState(); // Call the store action to reset state
      setActiveSectionId('question'); // Reset local focus state
      closeModal('confirmDialog');
      console.log("[VerticalPaperPlannerApp] resetState() and closeModal() executed.");
  };

  // Load Project from file -> Call Store Action
  const handleLoadProject = (data) => {
     loadStoreProjectData(data);
     setActiveSectionId(data?.detectedToggles?.approach || 'question');
     expandAllSections();
  };

   // Save Project -> Show Save Dialog
   const handleSaveRequest = () => {
     openModal('saveDialog');
   };

   // Save with Filename -> Use Util
  const handleSaveWithFilename = (fileName) => {
     trackSave();
     const sectionsToSave = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {});
     saveProjectAsJson(sectionsToSave, chatMessages, fileName);
     closeModal('saveDialog');
   };

  // Export Project -> Use Util
   const handleExportRequest = () => {
     trackExport('any'); // Will trigger format selection dialog
     const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {});
     // Assuming exportProject handles the format selection internally now
     exportProject(sectionsToExport, chatMessages);
   };

   // Show Examples Dialog
   const handleOpenExamples = () => {
     openModal('examplesDialog');
   };

   // Show Privacy Policy
   const handleOpenPrivacy = () => {
       openModal('privacyPolicy');
   };
    useEffect(() => { window.addEventListener('openPrivacyPolicy', handleOpenPrivacy); return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacy); }, []);

  // Show Help Splash Screen
  const handleShowHelpSplash = () => { if (splashManagerRef.current) { splashManagerRef.current.showSplash(); } };

  // Handler for opening review modal
  const handleOpenReviewModal = () => {
      console.log("[VerticalPaperPlannerApp] handleOpenReviewModal called.");
      // --- FIX: Don't clear review data here. Let it persist or clear explicitly ---
      // clearReviewData(); // Removed this line
      openModal('reviewModal');
      console.log("[VerticalPaperPlannerApp] openModal('reviewModal') executed.");
  };

  // Handle Paper Review Request (when file is selected)
  const handleReviewPaperRequest = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsReviewing(true); setUILoading('review', true);
      try {
          console.log(`[VerticalPaperPlannerApp] Requesting review for: ${file.name}`);
          const result = await reviewScientificPaper(file);
          if (result.success) {
              console.log("[VerticalPaperPlannerApp] Review successful, setting review data and opening modal.");
              setReviewData(result); // Update context state
              openModal('reviewModal'); // Open the modal
          }
          else {
              console.error("[VerticalPaperPlannerApp] Review failed:", result.error);
              // --- FIX: Clear review data on failure ---
              clearReviewData();
              alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
          }
      } catch (error) {
           console.error("[VerticalPaperPlannerApp] Exception during review:", error);
           // --- FIX: Clear review data on exception ---
           clearReviewData();
           alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
      }
      finally { setIsReviewing(false); setUILoading('review', false); }
  };


  // Handle Instruction Improvement (Magic Button)
  const handleImprovementRequest = async (sectionId = null) => {
    const targetSectionId = sectionId || activeSectionId;
    const sectionToImprove = sections?.[targetSectionId];

    if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') {
      alert("Please add some content to this section before requesting feedback."); return;
    }
    setIsImproving(true); setUILoading('improvement', true);
    try {
        const sectionDefinitions = { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] };
        const currentInputs = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {});
        const result = await improveBatchInstructions([sectionToImprove], currentInputs, sectionDefinitions, true);
        if (result.success && result.improvedData && result.improvedData.length > 0) {
            updateSectionFeedback(targetSectionId, result.improvedData[0]);
            const nextSectionId = getNextVisibleSectionId(targetSectionId, activeToggles.approach, activeToggles.dataMethod);
            if (nextSectionId && sections?.[nextSectionId]?.isMinimized) {
                useAppStore.getState().toggleMinimize(nextSectionId);
                console.log(`Automatically expanded next section: ${nextSectionId}`);
            }
        } else { console.error("Instruction improvement failed or returned no data", result); alert("Failed to get feedback for this section. Please try again."); }
    } catch (error) { console.error("Error requesting instruction improvement:", error); alert(`Error getting feedback: ${error.message || 'Unknown error'}`); }
    finally { setIsImproving(false); setUILoading('improvement', false); }
  };

  // --- Action Handler for Closing Review Modal ---
  const handleCloseReviewModal = () => {
      closeModal('reviewModal');
      // --- FIX: Explicitly clear review data when modal is closed ---
      // clearReviewData(); // Decide if you want to clear data on close, or let it persist
      console.log("[VerticalPaperPlannerApp] Review modal closed.");
  };


  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
    activeSection: activeSectionId, sections: safeSections, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
    handleSectionFocus, handleContentChange, handleApproachToggle, handleDataMethodToggle, sectionRefs, handleMagic: handleImprovementRequest,
    isAnyAiLoading, proMode,
  };

  const interactionProps = {
      currentSection: activeSectionId, currentSectionTitle: currentSectionData?.title || '', chatMessages: chatMessages,
      currentMessage, setCurrentMessage, handleSendMessage, loading: chatLoading, currentSectionData: currentSectionData,
  };

  // --- Render ---
  console.log("[VerticalPaperPlannerApp] Rendering. Current modals state:", modals);

  if (!sections || Object.keys(sections).length === 0) { return null; }

  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={handleResetRequest}
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest}
      loadProject={handleLoadProject}
      importDocumentContent={handleDocumentImport}
      onOpenReviewModal={handleOpenReviewModal} // Pass handler to open modal
      openExamplesDialog={handleOpenExamples}
      showHelpSplash={handleShowHelpSplash}
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps}
      modalState={modals} // Pass the modals object obtained from useUI()
      modalActions={{ // Actions needed by ModalManager/children
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: handleCloseReviewModal, // Pass the specific close handler
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
      }}
      handleReviewPaper={handleReviewPaperRequest} // Pass handler for file upload
      saveWithFilename={handleSaveWithFilename}
      isAnyAiLoading={isAnyAiLoading}
    />
  );
};

export default VerticalPaperPlannerApp;
