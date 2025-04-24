// FILE: src/components/PaperPlanner/ConfirmDialog.js

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';

/**
 * Enhanced Confirmation dialog that handles both regular resets and import confirmations
 */
const ConfirmDialog = ({ showConfirmDialog, setShowConfirmDialog, resetProject }) => {
  // Get the import confirmation operation from the store
  const importConfirmOperation = useAppStore((state) => state._importConfirmOperation);
  
  // Determine if this is an import confirmation
  const isImportConfirm = importConfirmOperation?.active === true;
  
  // Get the message to display
  const message = isImportConfirm 
    ? (importConfirmOperation.message || "Are you sure you want to continue?")
    : "Are you sure you want to start a new project? All current progress will be lost.";
  
  // The title text
  const title = isImportConfirm ? "Confirm Import" : "Confirm New Project";
  
  // The confirm button text
  const confirmText = isImportConfirm ? "Yes, continue" : "Yes, start new";

  // Handle confirm button click
  const handleConfirm = () => {
    if (isImportConfirm) {
      // This is an import confirmation, resolve the promise
      if (typeof window._importConfirmResolve === 'function') {
        window._importConfirmResolve(true); // Resolve with true
        
        // Clear the import confirmation operation
        useAppStore.setState({
          _importConfirmOperation: {
            active: false,
            message: null
          }
        });
      }
    } else {
      // This is a regular reset confirmation
      if (typeof resetProject === 'function') {
        resetProject();
      } else {
        console.error("ConfirmDialog: resetProject prop function is missing!");
      }
    }
    
    // Close the dialog
    if (typeof setShowConfirmDialog === 'function') {
      setShowConfirmDialog(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    if (isImportConfirm) {
      // This is an import confirmation, resolve the promise with false
      if (typeof window._importConfirmResolve === 'function') {
        window._importConfirmResolve(false); // Resolve with false
        
        // Clear the import confirmation operation
        useAppStore.setState({
          _importConfirmOperation: {
            active: false,
            message: null
          }
        });
      }
    }
    
    // Close the dialog
    if (typeof setShowConfirmDialog === 'function') {
      setShowConfirmDialog(false);
    }
  };

  if (!showConfirmDialog) {
    return null; // Don't render if not showing
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
        <p className="mb-6 text-gray-600">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
