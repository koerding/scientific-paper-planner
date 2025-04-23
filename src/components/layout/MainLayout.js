// src/components/layout/MainLayout.js
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
  openReviewModal,
  openExamplesDialog,
  showHelpSplash,
  
  // Content area props
  contentAreaProps,
  
  // Interaction elements props
  interactionProps,
  
  // Modal props
  modalState,
  modalActions,
  handleReviewPaper,
  saveWithFilename,
  
  // Loading state
  isAnyAiLoading
}) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Splash screen manager */}
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      
      <div className="w-full pb-6">
        {/* Header */}
        <AppHeader
          resetProject={resetProject}
          exportProject={exportProject}
          saveProject={saveProject}
          loadProject={loadProject}
          importDocumentContent={importDocumentContent}
          onOpenReviewModal={openReviewModal}
          setShowExamplesDialog={openExamplesDialog}
          showHelpSplash={showHelpSplash}
          loading={isAnyAiLoading}
        />

        {/* Main content area */}
        <ContentArea {...contentAreaProps} />

        {/* Interactive UI elements */}
        <InteractionElements {...interactionProps} />

        {/* Centralized modal management */}
        <ModalManager 
          modals={modalState}
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
