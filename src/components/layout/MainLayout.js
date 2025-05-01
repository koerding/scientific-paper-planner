// FILE: src/components/layout/MainLayout.js
import React, { useState } from 'react';
import AppHeader from './AppHeader';
import ContentArea from './ContentArea';
import InteractionElements from './InteractionElements';
import ModalManager from '../modals/ModalManager';
import { ForwardedSplashScreenManager } from '../modals/SplashScreenManager';
import LeftRailNavigation from '../navigation/LeftRailNavigation'; // Import the new component
import useAppStore from '../../store/appStore'; // Import store to access loading state directly

const MainLayout = ({
  // Props...
  splashManagerRef, resetProject, exportProject, saveProject, loadProject,
  importDocumentContent, onOpenReviewModal, openExamplesDialog, showHelpSplash,
  contentAreaProps, interactionProps, modalState,
  currentReviewData,
  modalActions,
  handleReviewPaper, saveWithFilename,
}) => {
  // --- Get global loading state directly from store ---
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const globalAiLoading = useAppStore((state) => state.globalAiLoading);

  // --- Add local state for mobile rail visibility ---
  const [showMobileRail, setShowMobileRail] = useState(true);

  // Prepare props for AppHeader
  const appHeaderProps = {
      resetProject, exportProject, saveProject, loadProject, importDocumentContent,
      onOpenReviewModal, setShowExamplesDialog: openExamplesDialog,
      showHelpSplash,
  };

  // Prepare props for InteractionElements
  const finalInteractionProps = {
      ...interactionProps,
  };

  // Prepare props for ContentArea
  const finalContentAreaProps = {
      ...contentAreaProps,
  };

  // Toggle mobile rail visibility
  const toggleMobileRail = () => {
    setShowMobileRail(!showMobileRail);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <ForwardedSplashScreenManager ref={splashManagerRef} />
      <AppHeader {...appHeaderProps} />
      <div className="flex flex-col flex-grow overflow-hidden relative">
        {/* Add the LeftRailNavigation component here */}
        <LeftRailNavigation visible={showMobileRail} />
        
        {/* Main content with adjusted margin for the rail */}
        <div className="main-content h-full flex flex-col">
          {/* Main content area */}
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
        
        {/* Mobile rail toggle button (only on very small screens) */}
        {window.innerWidth <= 480 && !showMobileRail && (
          <button 
            className="show-rail-button"
            onClick={toggleMobileRail}
            aria-label="Show navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
