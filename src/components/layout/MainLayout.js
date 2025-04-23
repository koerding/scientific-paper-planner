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
  isAnyAiLoading // Receive the combined loading state
}) => {

  // Prepare props for AppHeader, passing the combined loading state
  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash,
      loading: isAnyAiLoading // Pass the combined state to AppHeader as 'loading'
  };

  // Prepare props for InteractionElements, passing the combined loading state
  // Note: interactionProps already contains isAiBusy which is derived from isAnyAiLoading
  const finalInteractionProps = {
      ...interactionProps,
      // Ensure isAiBusy is passed if not already included in interactionProps object
      // isAiBusy: isAnyAiLoading // This should already be set in VerticalPaperPlannerApp
  };

   // Prepare props for ContentArea, passing the combined loading state
   const finalContentAreaProps = {
       ...contentAreaProps,
       isAnyAiLoading: isAnyAiLoading // Ensure it's passed down
   };


  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      <AppHeader {...appHeaderProps} /> {/* Pass loading prop */}
      <div className="flex flex-col flex-grow overflow-hidden relative">
        {/* Ensure ContentArea receives the loading state if needed by its children */}
        <ContentArea {...finalContentAreaProps} />
        {/* Pass updated interactionProps */}
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
