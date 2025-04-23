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
  currentReviewData, // *** ADDED: Accept reviewData prop ***
  modalActions,
  handleReviewPaper, saveWithFilename, isAnyAiLoading
}) => {

  // console.log("[MainLayout] Rendering with modalState:", modalState);
  // console.log("[MainLayout] Rendering with currentReviewData:", currentReviewData); // Log received prop

  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash, loading: isAnyAiLoading
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      <AppHeader {...appHeaderProps} />
      <div className="flex flex-col flex-grow overflow-hidden relative">
        <ContentArea {...contentAreaProps} />
        <InteractionElements {...interactionProps} />
        <ModalManager
          modals={modalState} // Pass modal visibility flags
          reviewData={currentReviewData} // *** CHANGED: Pass reviewData directly ***
          actions={modalActions}
          handleReviewPaper={handleReviewPaper}
          loadProject={loadProject} // Pass loadProject needed by ExamplesDialog
          saveWithFilename={saveWithFilename} // Pass saveWithFilename needed by SaveDialog
        />
      </div>
    </div>
  );
};

export default MainLayout;
