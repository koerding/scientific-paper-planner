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
  handleReviewPaper, // Keep if needed by ReviewPaperModal
  loadProject, // Keep if needed by ExamplesDialog
  saveWithFilename // Keep if needed by SaveDialog
}) => {
  // Log the received props during render
  console.log("[ModalManager] Rendering with modals state:", modals); // <-- ADD LOG

  const {
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    reviewData // Destructure reviewData if needed by ReviewPaperModal
  } = modals || {}; // Add fallback for safety during initial renders

  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal,
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions || {}; // Add fallback for safety

  // Log the specific value being passed
  console.log(`[ModalManager] showConfirmDialog value: ${showConfirmDialog}`); // <-- ADD LOG

  // Ensure actions are functions before passing down (optional safety)
  const handleReset = typeof onConfirmReset === 'function' ? onConfirmReset : () => console.error("onConfirmReset action missing");
  const handleCloseConfirm = typeof closeConfirmDialog === 'function' ? closeConfirmDialog : () => console.error("closeConfirmDialog action missing");
  // Add similar checks for other actions if needed

  return (
    <>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog} // Pass the boolean value
        setShowConfirmDialog={handleCloseConfirm} // Pass the close function
        resetProject={handleReset} // Pass the reset execution function
      />

      {/* Examples Dialog */}
      <ExamplesDialog
        showExamplesDialog={showExamplesDialog}
        setShowExamplesDialog={closeExamplesDialog} // Assuming this exists in actions
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={showReviewModal}
        onClose={closeReviewModal} // Assuming this exists in actions
        reviewData={reviewData}
        handleReviewPaper={handleReviewPaper}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        showModal={showPrivacyPolicy}
        onClose={closePrivacyPolicy} // Assuming this exists in actions
      />

      {/* Save Dialog */}
      <SaveDialog
        showSaveDialog={showSaveDialog}
        setShowSaveDialog={closeSaveDialog} // Assuming this exists in actions
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
