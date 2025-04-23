// src/components/modals/ModalManager.js
import React from 'react';
import ConfirmDialog from '../PaperPlanner/ConfirmDialog';  // Updated path
import ExamplesDialog from '../PaperPlanner/ExamplesDialog';  // Updated path
import ReviewPaperModal from './ReviewPaperModal';  // This one should be correct
import PrivacyPolicyModal from './PrivacyPolicyModal';  // This one should be correct
import SaveDialog from '../PaperPlanner/SaveDialog';  // Updated path

const ModalManager = ({ 
  modals, 
  actions,
  handleReviewPaper,
  loadProject,
  saveWithFilename
}) => {
  const {
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    reviewData
  } = modals;
  
  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal,
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions;
  
  return (
    <>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog}
        setShowConfirmDialog={closeConfirmDialog}
        resetProject={onConfirmReset}
      />

      {/* Examples Dialog */}
      <ExamplesDialog
        showExamplesDialog={showExamplesDialog}
        setShowExamplesDialog={closeExamplesDialog}
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={showReviewModal}
        onClose={closeReviewModal}
        reviewData={reviewData}
        handleReviewPaper={handleReviewPaper}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal 
        showModal={showPrivacyPolicy} 
        onClose={closePrivacyPolicy} 
      />

      {/* Save Dialog */}
      <SaveDialog
        showSaveDialog={showSaveDialog}
        setShowSaveDialog={closeSaveDialog}
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
