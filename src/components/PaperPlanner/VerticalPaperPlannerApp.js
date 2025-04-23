// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import { useChat } from '../../hooks/useChat'; // Keep using the chat hook
import { useUI } from '../../contexts/UIContext'; // Use UI context for modals
import { useDocumentImport } from '../../hooks/useDocumentImport'; // Keep for import logic
import { reviewScientificPaper } from '../../services/paperReviewService'; // Keep service
import { improveBatchInstructions, updateSectionWithImprovedInstructions } from '../../services/instructionImprovementService'; // Keep service
import { exportProject, saveProjectAsJson } from '../../utils/export'; // Keep utils
import { trackSectionChange, trackApproachToggle, trackDataMethodToggle, trackExport, trackSave } from '../../utils/analyticsUtils'; // Keep utils
import MainLayout from '../layout/MainLayout';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager'; // Keep for help splash
import '../../styles/PaperPlanner.css';
import { getNextVisibleSectionId, getVisibleSectionsInDisplayOrder } from '../../utils/sectionOrderUtils'; // Keep utils

// Removed usePaperPlanner hook import

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


  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question'); // Track focused section locally
  const [isImproving, setIsImproving] = useState(false); // Local loading state for improvements
  const [isReviewing, setIsReviewing] = useState(false); // Local loading state for paper review
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null); // Ref for splash screen

  // --- UI Context for Modals ---
  const {
      modals,          // Object containing boolean flags for modal visibility
      openModal,       // Function to open a modal by name
      closeModal,      // Function to close a modal by name
      setReviewData,   // Function to set review data for the review modal
      setLoading: setUILoading, // Function to set global loading states (optional)
  } = useUI();

  // --- Chat Hook ---
  // Pass sections.map(s => s.content) or similar if chat needs all content
  const currentSectionContent = sections[activeSectionId]?.content || '';
  const {
      currentMessage,
      setCurrentMessage,
      loading: chatLoading,
      handleSendMessage,
      chatMessages, // Assuming useChat now manages its own messages state internally or via context
      // ... other chat return values if needed
  } = useChat(
     Object.entries(sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {}), // Pass current content of all sections
     {}, // Initial chat messages (ChatProvider likely handles persistence)
     () => {}, // setChatMessages might not be needed if ChatProvider handles it
     activeSectionId,
     { sections: Object.values(sections).map(s => ({...s, subsections: s.originalInstructions })) } // Pass section definitions
   );


  // --- Document Import Hook ---
  const { importLoading, handleDocumentImport } = useDocumentImport(
    loadStoreProjectData, // Pass the store's load action
    { sections: Object.values(sections).map(s => ({...s, subsections: s.originalInstructions })) }, // Pass section definitions
    resetState // Pass the store's reset action
  );

  // Combined loading state
  const isAnyAiLoading = chatLoading || importLoading || isImproving || isReviewing;

  // --- Effects ---
  useEffect(() => { // Initialize GA and splash ref
    ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
    window.splashManagerRef = splashManagerRef;
  }, []);

  // Map refs when sections change (e.g., on load)
  useEffect(() => {
    Object.keys(sections).forEach(sectionId => {
      sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef();
    });
  }, [sections]);

  // --- Core Functions ---

  // Handle section focus change
  const handleSectionFocus = (sectionId) => {
    if (sectionId !== activeSectionId) {
      setActiveSectionId(sectionId);
      trackSectionChange(sectionId, sections[sectionId]?.title || 'Unknown');
    }
  };

  // Handle input changes -> update store
  const handleContentChange = (sectionId, value) => {
    updateSectionContent(sectionId, value);
    // Optional: Debounced analytics tracking
    // trackInputChange(sectionId, value.length);
  };

   // Handle approach toggle -> update store
  const handleApproachToggle = (approachId) => {
     console.log(`Setting research approach to: ${approachId}`);
     trackApproachToggle(approachId);
     setActiveToggle('approach', approachId);
     // Optionally set focus to the newly selected section
     // handleSectionFocus(approachId);
   };

   // Handle data method toggle -> update store
  const handleDataMethodToggle = (methodId) => {
     console.log(`Setting data acquisition method to: ${methodId}`);
     trackDataMethodToggle(methodId);
     setActiveToggle('dataMethod', methodId);
      // Optionally set focus to the newly selected section
     // handleSectionFocus(methodId);
   };

   // Reset Project -> Show Confirm Dialog
   const handleResetRequest = () => {
      openModal('confirmDialog');
   };

  // Confirm Reset -> Call Store Action
  const handleConfirmReset = () => {
      resetState();
      setActiveSectionId('question'); // Reset focus
      closeModal('confirmDialog');
  };

  // Load Project from file -> Call Store Action
  const handleLoadProject = (data) => {
     loadStoreProjectData(data);
     // Logic to set activeSectionId might be needed based on loaded data,
     // e.g., set to the first section or the detected approach.
     // The loadProjectData action now handles setting toggles and visibility.
     setActiveSectionId(data?.detectedToggles?.approach || 'question');
     expandAllSections(); // Ensure sections are expanded after load
  };

   // Save Project -> Show Save Dialog
   const handleSaveRequest = () => {
     openModal('saveDialog');
   };

   // Save with Filename -> Use Util
  const handleSaveWithFilename = (fileName) => {
     trackSave();
     // Pass current sections state for saving
     const sectionsToSave = Object.entries(sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {});
     // Pass current chat messages if managed by ChatProvider/Hook
     // const chatMessagesToSave = ...;
     saveProjectAsJson(sectionsToSave, chatMessages, fileName); // Pass chatMessages if available
     closeModal('saveDialog');
   };

  // Export Project -> Use Util
   const handleExportRequest = () => {
     trackExport('any');
     const sectionsToExport = Object.entries(sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {});
      // Pass current chat messages if managed by ChatProvider/Hook
     // const chatMessagesToExport = ...;
     exportProject(sectionsToExport, chatMessages); // Pass chatMessages if available
   };

   // Show Examples Dialog
   const handleOpenExamples = () => {
     openModal('examplesDialog');
   };

   // Show Privacy Policy
   const handleOpenPrivacy = () => {
       openModal('privacyPolicy');
   };
    // Add this listener if not already present globally
    useEffect(() => {
      window.addEventListener('openPrivacyPolicy', handleOpenPrivacy);
      return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacy);
    }, []);

  // Show Help Splash Screen
  const handleShowHelpSplash = () => {
    if (splashManagerRef.current) {
      splashManagerRef.current.showSplash();
    }
  };


  // Handle Paper Review
  const handleReviewPaperRequest = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsReviewing(true);
      setUILoading('review', true); // Use UI context loading if desired
      try {
          const result = await reviewScientificPaper(file);
          if (result.success) {
              setReviewData(result); // Set data in UI context
              openModal('reviewModal');
          } else {
              alert(`Error reviewing paper: ${result.error || 'Unknown error'}`);
          }
      } catch (error) {
          alert(`Error reviewing paper: ${error.message || 'Unknown error'}`);
      } finally {
          setIsReviewing(false);
          setUILoading('review', false);
      }
  };


  // Handle Instruction Improvement (Magic Button)
  const handleImprovementRequest = async (sectionId = null) => {
    const targetSectionId = sectionId || activeSectionId;
    const sectionToImprove = sections[targetSectionId];

    // Basic check if content exists (beyond placeholder)
    if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') {
      alert("Please add some content to this section before requesting feedback.");
      return;
    }

    setIsImproving(true);
    setUILoading('improvement', true); // Use UI context loading if desired

    try {
        const sectionDefinitions = { sections: Object.values(sections).map(s => ({...s, subsections: s.originalInstructions })) };
        const currentInputs = Object.entries(sections).reduce((acc, [id, data]) => { acc[id] = data.content; return acc; }, {});

      // Call the service function - it handles calling OpenAI
      const result = await improveBatchInstructions(
        [sectionToImprove], // Pass only the target section as an array
        currentInputs,      // Pass all current inputs for context
        sectionDefinitions, // Pass definitions
        true                // Force improvement on button click
      );

      if (result.success && result.improvedData && result.improvedData.length > 0) {
        // Update the store with the feedback data
        updateSectionFeedback(targetSectionId, result.improvedData[0]);

        // Progression logic is now handled *inside* updateSectionFeedback

        // Optionally open the next section visually (without changing focus)
         const nextSectionId = getNextVisibleSectionId(
            targetSectionId,
            activeToggles.approach,
            activeToggles.dataMethod
          );
          if (nextSectionId && sections[nextSectionId]?.isMinimized) {
              // Use a local toggle function if SectionCard doesn't expose it directly,
              // or potentially add an action to the store to set isMinimized directly.
               useAppStore.getState().toggleMinimize(nextSectionId); // Example using store action
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
      setIsImproving(false);
      setUILoading('improvement', false);
    }
  };


  // --- Props for Child Components ---
   const contentAreaProps = {
    activeSection: activeSectionId, // Pass the locally tracked active section ID
    sections, // Pass the sections object from the store
    activeApproach: activeToggles.approach,
    activeDataMethod: activeToggles.dataMethod,
    handleSectionFocus, // Pass the focus handler
    handleContentChange, // Pass the content change handler
    handleApproachToggle,
    handleDataMethodToggle,
    sectionRefs,
    handleMagic: handleImprovementRequest, // Pass the improvement handler
    isAnyAiLoading,
    proMode,
   };

  const interactionProps = {
      currentSection: activeSectionId,
      currentSectionTitle: sections[activeSectionId]?.title,
      chatMessages: chatMessages, // Get from useChat or ChatProvider
      currentMessage,
      setCurrentMessage,
      handleSendMessage,
      loading: chatLoading, // Pass specific chat loading state
      currentSectionData: sections[activeSectionId], // Pass current section data for context
  };


  // --- Render ---
  return (
    <MainLayout
      splashManagerRef={splashManagerRef}
      resetProject={handleResetRequest} // Open confirm dialog
      exportProject={handleExportRequest}
      saveProject={handleSaveRequest} // Open save dialog
      loadProject={handleLoadProject} // Loads data into store
      importDocumentContent={handleDocumentImport} // Uses import hook
      openReviewModal={() => openModal('reviewModal')} // Open review modal
      openExamplesDialog={handleOpenExamples} // Open examples dialog
      showHelpSplash={handleShowHelpSplash} // Show help
      contentAreaProps={contentAreaProps}
      interactionProps={interactionProps}
      modalState={modals} // Pass modal visibility flags from UIContext
      modalActions={{ // Pass actions to control modals
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: () => closeModal('reviewModal'),
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset, // Use the reset handler defined above
      }}
      handleReviewPaper={handleReviewPaperRequest} // Pass paper review handler
      saveWithFilename={handleSaveWithFilename} // Pass save handler
      isAnyAiLoading={isAnyAiLoading}
    />
  );
};

export default VerticalPaperPlannerApp;
