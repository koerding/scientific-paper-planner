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
  console.log("[ModalManager] Rendering with modals state:", modals);

  // --- CORRECTED DESTRUCTURING ---
  // Use the actual keys from the state object in UIContext
  const {
    confirmDialog, // Changed from showConfirmDialog
    examplesDialog, // Assuming this matches the key in UIContext state
    reviewModal,    // Assuming this matches the key in UIContext state
    privacyPolicy,  // Assuming this matches the key in UIContext state
    saveDialog,     // Assuming this matches the key in UIContext state
    reviewData      // Keep reviewData if it's part of the modals state slice passed down
  } = modals || {};
  // --- END CORRECTION ---

  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal,
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions || {};

  // Log the specific value using the CORRECT variable name
  console.log(`[ModalManager] confirmDialog value: ${confirmDialog}`); // Changed variable name

  // Ensure actions are functions before passing down
  const handleReset = typeof onConfirmReset === 'function' ? onConfirmReset : () => console.error("onConfirmReset action missing");
  const handleCloseConfirm = typeof closeConfirmDialog === 'function' ? closeConfirmDialog : () => console.error("closeConfirmDialog action missing");
  // Add similar checks for other actions if needed

  return (
    <>
      {/* Confirmation Dialog */}
      {/* Pass the correct variable 'confirmDialog' to the prop */}
      <ConfirmDialog
        showConfirmDialog={confirmDialog} // Pass the correct destructured variable
        setShowConfirmDialog={handleCloseConfirm}
        resetProject={handleReset}
      />

      {/* Examples Dialog */}
       {/* Assuming key was 'examplesDialog' and prop for ExamplesDialog is 'showExamplesDialog' */}
      <ExamplesDialog
        showExamplesDialog={examplesDialog}
        setShowExamplesDialog={closeExamplesDialog}
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
       {/* Assuming key was 'reviewModal' and prop for ReviewPaperModal is 'showModal' */}
      <ReviewPaperModal
        showModal={reviewModal}
        onClose={closeReviewModal}
        reviewData={reviewData} // Make sure reviewData is actually part of modals state or passed separately
        handleReviewPaper={handleReviewPaper}
      />

      {/* Privacy Policy Modal */}
      {/* Assuming key was 'privacyPolicy' and prop for PrivacyPolicyModal is 'showModal' */}
      <PrivacyPolicyModal
        showModal={privacyPolicy}
        onClose={closePrivacyPolicy}
      />

      {/* Save Dialog */}
      {/* Assuming key was 'saveDialog' and prop for SaveDialog is 'showSaveDialog' */}
      <SaveDialog
        showSaveDialog={saveDialog}
        setShowSaveDialog={closeSaveDialog}
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
