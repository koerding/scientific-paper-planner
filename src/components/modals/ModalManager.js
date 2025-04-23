// FILE: src/components/modals/ModalManager.js
import React from 'react';
import ConfirmDialog from '../PaperPlanner/ConfirmDialog';
import ExamplesDialog from '../PaperPlanner/ExamplesDialog';
import ReviewPaperModal from './ReviewPaperModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SaveDialog from '../PaperPlanner/SaveDialog';

const ModalManager = ({
  modals, // Modal visibility flags { confirmDialog: bool, ... }
  reviewData, // *** ADDED: Accept reviewData directly ***
  actions, // Modal closing actions { closeConfirmDialog: fn, ... }
  handleReviewPaper, // Function passed down to ReviewPaperModal
  loadProject, // Function passed down to ExamplesDialog
  saveWithFilename // Function passed down to SaveDialog
}) => {
  // console.log("[ModalManager] Rendering with modals state:", modals);
  // console.log("[ModalManager] Rendering with DIRECT reviewData prop:", reviewData); // Log direct prop

  // Destructure modal visibility states from the modals object
  const {
    confirmDialog = false,
    examplesDialog = false,
    reviewModal = false, // Use this for visibility only
    privacyPolicy = false,
    saveDialog = false,
    // reviewData is now received as a direct prop, remove from here if present
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
  // console.log(`[ModalManager] confirmDialog value: ${confirmDialog}`);
  // console.log(`[ModalManager] reviewModal visibility value: ${reviewModal}`);

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
        setShowConfirmDialog={handleCloseConfirm} // Prop name change intentional if ConfirmDialog expects this
        resetProject={handleReset}
      />

      {/* Examples Dialog */}
      <ExamplesDialog
        showExamplesDialog={examplesDialog}
        setShowExamplesDialog={handleCloseExamples} // Prop name change intentional
        loadProject={loadProject}
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={reviewModal} // Controls visibility
        onClose={handleCloseReview}
        reviewData={reviewData} // *** CHANGED: Pass the direct prop ***
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
        setShowSaveDialog={handleCloseSave} // Prop name change intentional
        saveProject={saveWithFilename}
      />
    </>
  );
};

export default ModalManager;
