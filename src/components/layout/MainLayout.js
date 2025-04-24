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
  // Loading state props have been removed as they're now directly accessed from the store
}) => {

  // Prepare props for AppHeader - no need to pass loading props
  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash,
  };

  // Prepare props for InteractionElements - no need to pass loading props
  const finalInteractionProps = {
      ...interactionProps,
  };

   // Prepare props for ContentArea - no need to pass loading props
   const finalContentAreaProps = {
       ...contentAreaProps,
   };


  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      <AppHeader {...appHeaderProps} />
      <div className="flex flex-col flex-grow overflow-hidden relative">
        {/* Pass updated props */}
        <ContentArea {...finalContentAreaProps} />
        <InteractionElements {...finalInteractionProps} />
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
