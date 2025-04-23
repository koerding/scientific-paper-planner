// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore';
import { useChat } from '../../hooks/useChat';
import { useUI } from '../../contexts/UIContext'; // Import useUI
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
  // --- Zustand Store State ---
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
  const [activeSectionId, setActiveSectionId] = useState('question');
  const [isImproving, setIsImproving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- UI Context ---
  const {
      modals,
      openModal,
      closeModal,
      setReviewData, // Action to set data
      clearReviewData,
      setLoading: setUILoading,
      reviewData // *** ADDED: Read reviewData directly from context ***
  } = useUI();

  // --- Get Current Section Data ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Chat Hook ---
   const {
       currentMessage, setCurrentMessage, loading: chatLoading, handleSendMessage, chatMessages,
   } = useChat(/* ...chat args... */
        Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}),
        {}, () => {}, activeSectionId,
        { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] }
    );

  // --- Document Import Hook ---
  const { importLoading, handleDocumentImport } = useDocumentImport(/* ...import args... */
        loadStoreProjectData,
        { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] },
        resetState
    );

  // Combined loading state
  const isAnyAiLoading = chatLoading || importLoading || isImproving || isReviewing;

  // --- Effects (remain the same) ---
  useEffect(() => { /* ... Mount effect ... */
        window.splashManagerRef = splashManagerRef;
        console.log("[VerticalPaperPlannerApp] Mounted. Initial activeSectionId:", activeSectionId);
        console.log("[VerticalPaperPlannerApp] Mounted. Initial UI modals state:", modals);
        console.log("[VerticalPaperPlannerApp] Mounted. Initial UI reviewData state:", reviewData); // Log initial reviewData
   }, []);
   useEffect(() => { /* ... Section change effect ... */
       console.log(`[VerticalPaperPlannerApp] activeSectionId changed to: ${activeSectionId}`);
       ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
    }, [activeSectionId]);
   useEffect(() => { /* ... Map refs effect ... */
        if (sections) {
            Object.keys(sections).forEach(sectionId => {
             sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef();
            });
        }
    }, [sections]);

  // --- Core Functions (remain largely the same) ---
  const handleSectionFocus = (sectionId) => { /* ... */ setActiveSectionId(sectionId);};
  const handleContentChange = (sectionId, value) => { /* ... */ updateSectionContent(sectionId, value); };
  const handleApproachToggle = (approachId) => { /* ... */ trackApproachToggle(approachId); setActiveToggle('approach', approachId); };
  const handleDataMethodToggle = (methodId) => { /* ... */ trackDataMethodToggle(methodId); setActiveToggle('dataMethod', methodId); };
  const handleResetRequest = () => { /* ... */ console.log("[VPPApp] Reset Request"); openModal('confirmDialog'); };
  const handleConfirmReset = () => { /* ... */ console.log("[VPPApp] Confirm Reset"); resetState(); setActiveSectionId('question'); closeModal('confirmDialog'); };
  const handleLoadProject = (data) => { /* ... */ loadStoreProjectData(data); setActiveSectionId(data?.detectedToggles?.approach || 'question'); expandAllSections(); };
  const handleSaveRequest = () => { /* ... */ openModal('saveDialog'); };
  const handleSaveWithFilename = (fileName) => { /* ... */ trackSave(); const sectionsToSave = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); saveProjectAsJson(sectionsToSave, chatMessages, fileName); closeModal('saveDialog'); };
  const handleExportRequest = () => { /* ... */ trackExport('any'); const sectionsToExport = Object.entries(sections || {}).reduce((acc, [id, data]) => { acc[id] = data?.content; return acc; }, {}); exportProject(sectionsToExport, chatMessages); };
  const handleOpenExamples = () => { /* ... */ openModal('examplesDialog'); };
  const handleOpenPrivacy = () => { /* ... */ openModal('privacyPolicy'); };
  useEffect(() => { window.addEventListener('openPrivacyPolicy', handleOpenPrivacy); return () => window.removeEventListener('openPrivacyPolicy', handleOpenPrivacy); }, []);
  const handleShowHelpSplash = () => { /* ... */ if (splashManagerRef.current) { splashManagerRef.current.showSplash(); } };
  const handleOpenReviewModal = () => { /* ... */ console.log("[VPPApp] handleOpenReviewModal"); openModal('reviewModal'); };

  const handleReviewPaperRequest = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsReviewing(true); setUILoading('review', true);
      try {
          console.log(`[VPPApp] Requesting review for: ${file.name}`);
          const result = await reviewScientificPaper(file);
          if (result.success) {
              console.log("[VPPApp] Review successful, setting review data.");
              setReviewData(result); // Update context state
              // No need to explicitly open modal here if it's already open or logic handles it
              // openModal('reviewModal'); // Can likely remove this if modal is opened by button first
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
      finally { setIsReviewing(false); setUILoading('review', false); }
  };

  const handleImprovementRequest = async (sectionId = null) => { /* ... (improvement logic) ... */
        const targetSectionId = sectionId || activeSectionId;
        const sectionToImprove = sections?.[targetSectionId];
        if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') { alert("Please add content..."); return; }
        setIsImproving(true); setUILoading('improvement', true);
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
        finally { setIsImproving(false); setUILoading('improvement', false); }
     };

  const handleCloseReviewModal = () => { closeModal('reviewModal'); /* clearReviewData(); // Optional: clear on close */ };

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = { /* ... (props remain same) ... */
        activeSection: activeSectionId, sections: safeSections, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus, handleContentChange, handleApproachToggle, handleDataMethodToggle, sectionRefs, handleMagic: handleImprovementRequest,
        isAnyAiLoading, proMode,
    };
  const interactionProps = { /* ... (props remain same) ... */
        currentSection: activeSectionId, currentSectionTitle: currentSectionData?.title || '', chatMessages: chatMessages,
        currentMessage, setCurrentMessage, handleSendMessage, loading: chatLoading, currentSectionData: currentSectionData,
    };

  // --- Render ---
  console.log("[VPPApp] Rendering. Current modals state from context:", modals);
  console.log("[VPPApp] Rendering. Current reviewData state from context:", reviewData); // Log reviewData being passed

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
      // Pass modal visibility flags from context
      modalState={modals}
      // *** ADDED: Pass reviewData directly as a prop ***
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
      isAnyAiLoading={isAnyAiLoading}
    />
  );
};

export default VerticalPaperPlannerApp;
