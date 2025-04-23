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
  contentAreaProps, interactionProps, modalState, modalActions,
  handleReviewPaper, saveWithFilename, isAnyAiLoading
}) => {

  // console.log("[MainLayout] Rendering with modalState prop:", modalState); // Keep logs if needed

  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash, loading: isAnyAiLoading
  };

  return (
    // Keep h-screen flex flex-col overflow-hidden
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />

      {/* Header remains fixed height (implicitly, ensure its component sets a height) */}
      <AppHeader {...appHeaderProps} />

      {/* This div will contain the main growing content area */}
      {/* ADDED: relative. Kept: flex-grow, overflow-hidden */}
      <div className="flex flex-col flex-grow overflow-hidden relative">

        {/* ContentArea will be positioned absolutely within this div */}
        <ContentArea {...contentAreaProps} />

        {/* Fixed position elements remain outside the main flow */}
        <InteractionElements {...interactionProps} />
        <ModalManager
          modals={modalState}
          actions={modalActions}
          handleReviewPaper={handleReviewPaper}
          loadProject={loadProject}
          saveWithFilename={saveWithFilename}
        />
      </div>
       {/* Footer removed or placed elsewhere */}
    </div>
  );
};

export default MainLayout;
