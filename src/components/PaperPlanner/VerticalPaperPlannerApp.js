// FILE: src/components/PaperPlanner/VerticalPaperPlannerApp.js
import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import useAppStore from '../../store/appStore'; // Import the Zustand store
// import { useChat } from '../../hooks/useChat'; // REMOVED
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
  // Core State
  const sections = useAppStore((state) => state.sections);
  const activeToggles = useAppStore((state) => state.activeToggles);
  const proMode = useAppStore((state) => state.proMode);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const setActiveToggle = useAppStore((state) => state.setActiveToggle);
  const updateSectionFeedback = useAppStore((state) => state.updateSectionFeedback);
  const resetState = useAppStore((state) => state.resetState);
  const loadStoreProjectData = useAppStore((state) => state.loadProjectData);
  const expandAllSections = useAppStore((state) => state.expandAllSections);
  // UI State
  const modals = useAppStore((state) => state.modals);
  const loadingFlags = useAppStore((state) => state.loading);
  const reviewData = useAppStore((state) => state.reviewData);
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const setLoading = useAppStore((state) => state.setLoading);
  const setReviewData = useAppStore((state) => state.setReviewData);
  const clearReviewData = useAppStore((state) => state.clearReviewData);
  const zustandShowHelpSplash = useAppStore((state) => state.showHelpSplash);
  // Chat State & Actions
  const chatMessages = useAppStore((state) => state.chatMessages);
  const currentChatMessage = useAppStore((state) => state.currentChatMessage);
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  const setCurrentChatMessage = useAppStore((state) => state.setCurrentChatMessage);
  const setCurrentChatSectionId = useAppStore((state) => state.setCurrentChatSectionId);
  const zustandSendMessage = useAppStore((state) => state.sendMessage); // Renamed for clarity


  // --- Local State & Refs ---
  const [activeSectionId, setActiveSectionId] = useState('question'); // Focused section for main panel
  const sectionRefs = useRef({});
  const splashManagerRef = useRef(null);

  // --- Get Current Section Data ---
  const currentSectionData = sections?.[activeSectionId] || null;

  // --- Document Import Hook ---
  const { importLoading, handleDocumentImport } = useDocumentImport(
      loadStoreProjectData,
      { sections: sections ? Object.values(sections).map(s => ({...(s || {}), subsections: s?.originalInstructions || [] })) : [] },
      resetState
  );

  // Combined loading state
  const isAnyAiLoading = Object.values(loadingFlags).some(Boolean) || importLoading; // Include importLoading if it's separate

  // --- Effects ---
  useEffect(() => { /* ... Mount effect ... */
    window.splashManagerRef = splashManagerRef;
  }, []);

  useEffect(() => { // Update chat section context when main section focus changes
     console.log(`[VPPApp] activeSectionId changed to: ${activeSectionId}, updating chat section`);
     setCurrentChatSectionId(activeSectionId); // Update chat context in store
     ReactGA.send({ hitType: "pageview", page: `/section/${activeSectionId}` });
  }, [activeSectionId, setCurrentChatSectionId]); // Add dependency

  useEffect(() => { /* ... Map refs effect ... */
    if (sections) { Object.keys(sections).forEach(sectionId => { sectionRefs.current[sectionId] = sectionRefs.current[sectionId] || React.createRef(); }); }
   }, [sections]);

  useEffect(() => { /* ... Privacy policy effect ... */
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
  const handleShowHelpSplash = () => {
    // Call the store action (clears localStorage, updates state)
    zustandShowHelpSplash();
    if (splashManagerRef.current && typeof splashManagerRef.current.showSplash === 'function') {
      splashManagerRef.current.showSplash();
    } else {
      console.warn("Could not call showSplash on splashManagerRef");
    }
  };
  const handleOpenReviewModal = () => openModal('reviewModal');

  const handleReviewPaperRequest = async (event) => { /* ... (no change needed) ... */
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
  const handleImprovementRequest = async (sectionId = null) => { /* ... (no change needed) ... */
        const targetSectionId = sectionId || activeSectionId;
        const sectionToImprove = sections?.[targetSectionId];
        if (!sectionToImprove || sectionToImprove.content === (sectionToImprove.placeholder || '') || sectionToImprove.content.trim() === '') { alert("Please add content..."); return; }
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
  const handleCloseReviewModal = () => closeModal('reviewModal');

  // --- Props for Child Components ---
  const safeSections = sections || {};
  const contentAreaProps = {
        activeSection: activeSectionId, sections: safeSections, activeApproach: activeToggles.approach, activeDataMethod: activeToggles.dataMethod,
        handleSectionFocus, handleContentChange, handleApproachToggle, handleDataMethodToggle, sectionRefs, handleMagic: handleImprovementRequest,
        isAnyAiLoading: isAnyAiLoading, proMode,
    };

  // Props for InteractionElements (including chat state/actions from store)
  const interactionProps = {
      currentSection: currentChatSectionId, // Use chat-specific section ID from store
      currentSectionTitle: sections?.[currentChatSectionId]?.title || '', // Get title based on chat section
      chatMessages: chatMessages,
      currentMessage: currentChatMessage,
      setCurrentMessage: setCurrentChatMessage, // Action from store
      handleSendMessage: zustandSendMessage, // Async action from store
      loading: loadingFlags.chat, // Chat-specific loading flag from store
      currentSectionData: sections?.[currentChatSectionId] || null, // Pass data for current *chat* section
  };

  // --- Render ---
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
      interactionProps={interactionProps} // Pass chat props down
      modalState={modals}
      // Pass necessary actions (now includes chat actions if modals needed them)
      modalActions={{
          closeConfirmDialog: () => closeModal('confirmDialog'),
          closeExamplesDialog: () => closeModal('examplesDialog'),
          closeReviewModal: handleCloseReviewModal,
          closePrivacyPolicy: () => closeModal('privacyPolicy'),
          closeSaveDialog: () => closeModal('saveDialog'),
          onConfirmReset: handleConfirmReset,
          setReviewData: setReviewData,
          clearReviewData: clearReviewData,
      }}
      handleReviewPaper={handleReviewPaperRequest}
      saveWithFilename={handleSaveWithFilename}
      isAnyAiLoading={isAnyAiLoading}
    />
  );
};

export default VerticalPaperPlannerApp;
