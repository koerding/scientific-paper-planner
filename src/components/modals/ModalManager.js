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
  console.log("[ModalManager] Rendering with modals state:", modals); // Keep this log for debugging

  // Destructure modal states from the modals object
  const {
    confirmDialog = false,
    examplesDialog = false,
    reviewModal = false,
    privacyPolicy = false,
    saveDialog = false,
    reviewData
  } = modals || {};

  // Destructure modal actions
  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal,
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions || {};

  // Log specific modal states for debugging
  console.log(`[ModalManager] confirmDialog value: ${confirmDialog}`);
  console.log(`[ModalManager] reviewModal value: ${reviewModal}`);

  // Ensure actions are functions before passing them down
  const handleReset = typeof onConfirmReset === 'function' ? onConfirmReset : () => console.error("onConfirmReset action missing");
  const handleCloseConfirm = typeof closeConfirmDialog === 'function' ? closeConfirmDialog : () => console.error("closeConfirmDialog action missing");
  const handleCloseReview = typeof closeReviewModal === 'function' ? closeReviewModal : () => console.error("closeReviewModal action missing");
  const handleCloseExamples = typeof closeExamplesDialog === 'function' ? closeExamplesDialog : () => console.error("closeExamplesDialog action missing");
  const handleClosePrivacy = typeof closePrivacyPolicy === 'function' ? closePrivacyPolicy : () => console.error("closePrivacyPolicy action missing");
  const handleCloseSave = typeof closeSaveDialog === 'function' ? closeSaveDialog : () => console.error("closeSaveDialog action missing");

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
        setShowExamplesDialog={handleCloseExamples}
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={reviewModal}
        onClose={handleCloseReview}
        reviewData={reviewData}
        handleReviewPaper={handleReviewPaper}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        showModal={privacyPolicy}
        onClose={handleClosePrivacy}
      />

      {/* Save Dialog */}
      <SaveDialog
        showSaveDialog={saveDialog}
        setShowSaveDialog={handleCloseSave}
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
