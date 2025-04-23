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
  modalState,
  modalActions,
  handleReviewPaper, // Prop for ReviewPaperModal
  saveWithFilename, // Prop for SaveDialog
  // Loading state
  isAnyAiLoading
}) => {

  // console.log("[MainLayout] Rendering with modalState prop:", modalState); // Keep logs if needed

  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, // Pass down the handler for the review modal button
      setShowExamplesDialog: openExamplesDialog, // Pass down the handler for examples
      showHelpSplash, loading: isAnyAiLoading
  };

  return (
    // Make this main div the screen height flex container
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden"> {/* Added overflow-hidden */}
      {/* Splash screen manager */}
      <ForwardedSplashScreenManager ref={splashManagerRef} />

      {/* Header remains fixed height (implicitly) */}
      <AppHeader {...appHeaderProps} />

      {/* This div will contain the main growing content area */}
      {/* Added flex-grow and overflow-hidden */}
      <div className="flex flex-col flex-grow overflow-hidden">

        {/* Content area needs to grow and manage its children's overflow */}
        {/* Pass necessary props down to ContentArea */}
        <ContentArea {...contentAreaProps} />

        {/* Interactive UI elements (Chat) - positioned fixed, outside main scroll flow */}
        {/* Ensure InteractionElements doesn't interfere with layout height */}
        <InteractionElements {...interactionProps} />

        {/* Modals - positioned fixed, outside main scroll flow */}
        <ModalManager
          modals={modalState}
          actions={modalActions}
          handleReviewPaper={handleReviewPaper}
          loadProject={loadProject} // Pass loadProject down for ExamplesDialog via ModalManager
          saveWithFilename={saveWithFilename}
        />
      </div>
       {/* Footer - If needed, place it outside the flex-grow div or adjust layout */}
       {/* <div className="text-center ...">Footer</div> */}
    </div>
  );
};

export default MainLayout;
