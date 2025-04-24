// FILE: src/components/modals/ModalManager.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import Zustand store
import ConfirmDialog from '../PaperPlanner/ConfirmDialog';
import ExamplesDialog from '../PaperPlanner/ExamplesDialog';
import ReviewPaperModal from './ReviewPaperModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import SaveDialog from '../PaperPlanner/SaveDialog';

const ModalManager = ({
  // modalState, // REMOVED - will get from store now
  // reviewData, // REMOVED - will get from store now
  actions, // Keep actions passed down (like close functions, reset confirm)
  handleReviewPaper, // Function passed down to ReviewPaperModal
  loadProject, // Function passed down to ExamplesDialog
  saveWithFilename // Function passed down to SaveDialog
}) => {

  // --- Select state directly from Zustand store ---
  const modals = useAppStore((state) => state.modals);
  const reviewData = useAppStore((state) => state.reviewData);
  // --- End Selection ---

  // REMOVED: console.log("[ModalManager] Rendering with Zustand modals state:", modals);
  // REMOVED: console.log("[ModalManager] Rendering with Zustand reviewData state:", reviewData);

  // Destructure modal visibility states from the modals object (fetched from store)
  const {
    confirmDialog = false,
    examplesDialog = false,
    reviewModal = false,
    privacyPolicy = false,
    saveDialog = false,
  } = modals || {}; // Add default {} for safety

  // Destructure modal actions passed via props
  const {
    closeConfirmDialog,
    closeExamplesDialog,
    closeReviewModal,
    closePrivacyPolicy,
    closeSaveDialog,
    onConfirmReset
  } = actions || {}; // Add default {} for safety

  // Ensure actions are functions before passing them down (good practice)
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
        setShowConfirmDialog={handleCloseConfirm} // Pass close action
        resetProject={handleReset} // Pass confirm action
      />

      {/* Examples Dialog */}
      <ExamplesDialog
        showExamplesDialog={examplesDialog}
        setShowExamplesDialog={handleCloseExamples} // Pass close action
        loadProject={loadProject} // Pass loadProject from parent
      />

      {/* Review Paper Modal */}
      <ReviewPaperModal
        showModal={reviewModal} // Visibility from store
        onClose={handleCloseReview} // Pass close action
        reviewData={reviewData} // Data from store
        handleReviewPaper={handleReviewPaper} // Pass handler from parent
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        showModal={privacyPolicy} // Visibility from store
        onClose={handleClosePrivacy} // Pass close action
      />

      {/* Save Dialog */}
      <SaveDialog
        showSaveDialog={saveDialog} // Visibility from store
        setShowSaveDialog={handleCloseSave} // Pass close action
        saveProject={saveWithFilename} // Pass handler from parent
      />
    </>
  );
};

export default ModalManager;
