// FILE: src/hooks/useModalState.js

/**
 * Hook for centralized modal state management
 */
import { useState, useCallback } from 'react';

export const useModalState = () => {
  // Modal state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExamplesDialog, setShowExamplesDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Review state
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Methods to open/close modals
  const openConfirmDialog = useCallback(() => setShowConfirmDialog(true), []);
  const closeConfirmDialog = useCallback(() => setShowConfirmDialog(false), []);
  
  const openExamplesDialog = useCallback(() => setShowExamplesDialog(true), []);
  const closeExamplesDialog = useCallback(() => setShowExamplesDialog(false), []);
  
  const openReviewModal = useCallback(() => setShowReviewModal(true), []);
  const closeReviewModal = useCallback(() => setShowReviewModal(false), []);
  
  const openPrivacyPolicy = useCallback(() => setShowPrivacyPolicy(true), []);
  const closePrivacyPolicy = useCallback(() => setShowPrivacyPolicy(false), []);
  
  const openSaveDialog = useCallback(() => setShowSaveDialog(true), []);
  const closeSaveDialog = useCallback(() => setShowSaveDialog(false), []);

  return {
    // Modal visibility state
    showConfirmDialog,
    showExamplesDialog,
    showReviewModal,
    showPrivacyPolicy,
    showSaveDialog,
    
    // Review state
    reviewData,
    setReviewData,
    reviewLoading,
    setReviewLoading,
    
    // Modal open/close methods
    openConfirmDialog,
    closeConfirmDialog,
    openExamplesDialog,
    closeExamplesDialog,
    openReviewModal,
    closeReviewModal,
    openPrivacyPolicy,
    closePrivacyPolicy,
    openSaveDialog,
    closeSaveDialog
  };
};
