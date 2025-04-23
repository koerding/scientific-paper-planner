// FILE: src/components/modals/ModalManager.js
import React from 'react';
import ConfirmDialog from '../PaperPlanner/ConfirmDialog';
import ExamplesDialog from '../PaperPlanner/ExamplesDialog';
import ReviewPaperModal from './ReviewPaperModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SaveDialog from '../PaperPlanner/SaveDialog';

const ModalManager = ({
  modals,
  actions,
  handleReviewPaper,
  loadProject,
  saveWithFilename
}) => {
  console.log("[ModalManager] Rendering with modals state:", modals); // Keep this

  // Use the actual keys from the state object in UIContext
  const {
    confirmDialog, // Correct key
    examplesDialog,
    reviewModal,    // Correct key
    privacyPolicy,
    saveDialog,
    reviewData
  } = modals || {};

  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal, // Get the close function
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions || {};

  // Log the specific value for reviewModal
  console.log(`[ModalManager] confirmDialog value: ${confirmDialog}`); // Keep log for confirmDialog
  console.log(`[ModalManager] reviewModal value: ${reviewModal}`); // <-- ADDED LOG

  // Ensure actions are functions before passing down (optional safety)
  const handleReset = typeof onConfirmReset === 'function' ? onConfirmReset : () => console.error("onConfirmReset action missing");
  const handleCloseConfirm = typeof closeConfirmDialog === 'function' ? closeConfirmDialog : () => console.error("closeConfirmDialog action missing");
  const handleCloseReview = typeof closeReviewModal === 'function' ? closeReviewModal : () => console.error("closeReviewModal action missing");
  // Add similar checks for other actions if needed

  return (
    <>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        showConfirmDialog={confirmDialog}
        setShowConfirmDialog={handleCloseConfirm}
        resetProject={handleReset}
      />

      {/* Examples Dialog */}
      <ExamplesDialog
        showExamplesDialog={examplesDialog}
        setShowExamplesDialog={closeExamplesDialog}
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={reviewModal} // Pass the correct destructured variable
        onClose={handleCloseReview} // Pass the correct close function
        reviewData={reviewData}
        handleReviewPaper={handleReviewPaper}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        showModal={privacyPolicy}
        onClose={closePrivacyPolicy}
      />

      {/* Save Dialog */}
      <SaveDialog
        showSaveDialog={saveDialog}
        setShowSaveDialog={closeSaveDialog}
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
