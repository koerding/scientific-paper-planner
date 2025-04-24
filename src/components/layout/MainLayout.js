// FILE: src/components/layout/MainLayout.js
import React from 'react';
import AppHeader from './AppHeader';
import ContentArea from './ContentArea';
import InteractionElements from './InteractionElements';
import ModalManager from '../modals/ModalManager';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';

const MainLayout = ({
  // Props...
  splashManagerRef, resetProject, exportProject, saveProject, loadProject,
  importDocumentContent, onOpenReviewModal, openExamplesDialog, showHelpSplash,
  contentAreaProps, interactionProps, modalState,
  currentReviewData,
  modalActions,
  handleReviewPaper, saveWithFilename,
  // REMOVED: isAnyAiLoading // Prop removed
}) => {

  // Prepare props for AppHeader - remove loading prop
  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash,
      // REMOVED: loading: isAnyAiLoading // Prop removed
  };

  // Prepare props for InteractionElements - remove isAiBusy prop
  const finalInteractionProps = {
      ...interactionProps,
      // REMOVED: isAiBusy: isAnyAiLoading // Prop removed
  };

   // Prepare props for ContentArea - remove isAnyAiLoading prop
   const finalContentAreaProps = {
       ...contentAreaProps,
       // REMOVED: isAnyAiLoading: isAnyAiLoading // Prop removed
   };


  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      <AppHeader {...appHeaderProps} /> {/* Prop removed */}
      <div className="flex flex-col flex-grow overflow-hidden relative">
        {/* Pass updated props */}
        <ContentArea {...finalContentAreaProps} />
        <InteractionElements {...finalInteractionProps} /> {/* Prop removed */}
        <ModalManager
          modals={modalState}
          reviewData={currentReviewData}
          actions={modalActions}
          handleReviewPaper={handleReviewPaper}
          loadProject={loadProject}
          saveWithFilename={saveWithFilename}
        />
      </div>
    </div>
  );
};

export default MainLayout;
