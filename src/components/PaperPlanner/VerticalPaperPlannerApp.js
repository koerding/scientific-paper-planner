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
  // Load the loading states from Zustand
  const loadingStates = useAppStore((state) => state.loadingStates);
  const setLoading = useAppStore((state) => state.setLoading);
  const isAnyLoading = useAppStore((state) => state.isAnyLoading);

  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question'); // Track focused section locally
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- UI Context for Modals ---
  const {
      modals, // Get the modals state object from the context
      openModal,
      closeModal,
      setReviewData,
      setLoading: setUILoading // For compatibility with UIContext
  } = useUI();

  // --- Get Current Section Data (with fallback) ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Chat Hook ---
   const {
       currentMessage, 
       setCurrentMessage, 
       handleSendMessage, 
       chatMessages
   } = useChat(
      Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}),
      {}, () => {}, activeSectionId,
      { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] }
    );

  // --- Document Import Hook ---
  const { handleDocumentImport } = useDocumentImport(
    loadStoreProjectData,
    { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] },
    resetState // Pass the store's reset action here
  );

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
       openModal('confirmDialog'); // Use function from useUI hook
       console.log("[VerticalPaperPlannerApp] openModal('confirmDialog') executed.");
   };


  // Confirm Reset -> Call Store Action
  const handleConfirmReset = () => {
      console.log("[VerticalPaperPlannerApp] handleConfirmReset called.");
      resetState(); // Call the store action to reset state
      setActiveSectionId('question'); // Reset local focus state
      closeModal('confirmDialog'); // Use function from useUI hook
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
     trackExport('any');
     const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {});
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

  // Define handler for opening review modal to add logging
  const handleOpenReviewModal = () => {
      console.log("[VerticalPaperPlannerApp] handleOpenReviewModal called.");
      openModal('reviewModal');
      console.log("[VerticalPaperPlannerApp] openModal('reviewModal') executed.");
  };

  // Handle Paper Review - Updated to use Zustand loading state
  const handleReviewPaperRequest = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Set loading state using Zustand
      setLoading('review', true);
      
      try {
          const result = await reviewScientificPaper(file);
          if (result.success) { 
              setReviewData(result); 
              openModal('reviewModal'); 
          } else { 
              alert(`Error reviewing paper: ${result.error || 'Unknown error'}`); 
          }
      } catch (error) { 
          alert(`Error reviewing paper: ${error.message || 'Unknown error'}`); 
      } finally { 
          // Clear loading state when done
          setLoading('review', false);
      }
  };

  // Handle Instruction Improvement (Magic Button) - Updated to use Zustand loading state
  const handleImprovementRequest = async (sectionId = null) => {
    const targetSectionId = sectionId || activeSectionId;
    const sectionToImprove = sections?.[targetSectionId];

    if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') {
      alert("Please add some content to this section before requesting feedback."); 
      return;
    }
    
    // Set loading state using Zustand
    setLoading('feedback', true);
    
    try {
        const sectionDefinitions = { 
            sections: sections ? Object.values(sections).map(s => ({
                ...(s || {}), 
                subsections: s?.originalInstructions || [] 
            })) : [] 
        };
        
        const currentInputs = Object.entries(sections || {}).reduce((acc, [id, data]) => { 
            acc[id] = data?.content; 
            return acc; 
        }, {});
        
        const result = await improveBatchInstructions(
            [sectionToImprove], 
            currentInputs, 
            sectionDefinitions, 
            true
        );
        
        if (result.success && result.improvedData && result.improvedData.length > 0) {
            updateSectionFeedback(targetSectionId, result.improvedData[0]);
            
            const nextSectionId = getNextVisibleSectionId(
                targetSectionId, 
                activeToggles.approach, 
                activeToggles.dataMethod
            );
            
            if (nextSectionId && sections?.[nextSectionId]?.isMinimized) {
                useAppStore.getState().toggleMinimize(nextSectionId);
                console.log(`Automatically expanded next section: ${nextSectionId}`);
            }
        } else {
            console.error("Instruction improvement failed or returned no data", result);
            alert("Failed to get feedback for this section. Please try again.");
        }
    } catch (error) {
        console.error("Error requesting instruction improvement:", error);
        alert(`Error getting feedback: ${error.message || 'Unknown error'}`);
    } finally {
        // Clear loading state when done
        setLoading('feedback', false);
    }
  };

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
    activeSection: activeSectionId, 
    sections: safeSections, 
    activeApproach: activeToggles.approach, 
    activeDataMethod: activeToggles.dataMethod,
    handleSectionFocus, 
    handleContentChange, 
    handleApproachToggle,
    handleDataMethodToggle, 
    sectionRefs, 
    handleMagic: handleImprovementRequest,
    isAnyAiLoading: isAnyLoading(), 
    proMode
  };

  const interactionProps = {
      currentSection: activeSectionId, 
      currentSectionTitle: currentSectionData?.title || '', 
      chatMessages: chatMessages,
      currentMessage, 
      setCurrentMessage, 
      handleSendMessage, 
      currentSectionData: currentSectionData
  };

  // --- Render ---
  console.log("[VerticalPaperPlannerApp] Rendering. Current modals state:", modals);
  console.log("[VerticalPaperPlannerApp] Loading states:", loadingStates);

  if (!sections || Object.keys(sections).length === 0) { return null; }

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
      modalActions={{
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: () => closeModal('reviewModal'),
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      isAnyAiLoading={isAnyLoading()}
    />
  );
};

export default VerticalPaperPlannerApp;
