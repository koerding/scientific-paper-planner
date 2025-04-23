// FILE: src/components/layout/MainLayout.js
import React from 'react';
import AppHeader from './AppHeader';
import ContentArea from './ContentArea';
import InteractionElements from './InteractionElements';
import ModalManager from '../modals/ModalManager';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';

const MainLayout = ({
  // Refs
  splashManagerRef,
  // Header props
  resetProject,
  exportProject,
  saveProject,
  loadProject,
  importDocumentContent,
  onOpenReviewModal, // Ensure correct prop name if passed from AppHeader via VPPApp
  openExamplesDialog, // Changed name to match VPPApp handler
  showHelpSplash,
  // Content area props
  contentAreaProps,
  // Interaction elements props
  interactionProps,
  // Modal props
  modalState, // <<< Prop being passed (The `modals` object from VPPApp's useUI)
  modalActions,
  handleReviewPaper, // Prop for ReviewPaperModal
  saveWithFilename, // Prop for SaveDialog
  // Loading state
  isAnyAiLoading
}) => {

  // --- ADDED LOG ---
  // Log the modalState prop received by MainLayout during render
  console.log("[MainLayout] Rendering with modalState prop:", modalState);
  // --- END ADDED LOG ---


  // Destructure necessary props for AppHeader (ensure names match)
  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, // Pass down the handler for the review modal button
      setShowExamplesDialog: openExamplesDialog, // Pass down the handler for examples
      showHelpSplash, loading: isAnyAiLoading
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Splash screen manager */}
      <ForwardedSplashScreenManager ref={splashManagerRef} />

      <div className="w-full pb-6">
        {/* Header */}
        <AppHeader {...appHeaderProps} />

        {/* Main content area */}
        {/* Pass necessary props down to ContentArea */}
        <ContentArea {...contentAreaProps} />

        {/* Interactive UI elements */}
        {/* Pass necessary props down to InteractionElements */}
        <InteractionElements {...interactionProps} />

        {/* Centralized modal management */}
        <ModalManager
          modals={modalState} // Pass the received modalState down
          actions={modalActions}
          handleReviewPaper={handleReviewPaper} // Pass handler down
          loadProject={loadProject} // Pass loadProject down for ExamplesDialog
          saveWithFilename={saveWithFilename} // Pass saveWithFilename down for SaveDialog
        />
      </div>
       {/* Footer moved outside or managed elsewhere if needed */}
       {/* <div className="text-center ...">Footer</div> */}
    </div>
  );
};

export default MainLayout;
