// FILE: src/components/PaperPlanner/ConfirmDialog.js

import React from 'react';
import { resetAllState } from '../../services/resetService';

/**
 * Confirmation dialog for resetting the project
 * UPDATED: Now uses the resetAllState from resetService
 */
const ConfirmDialog = ({ showConfirmDialog, setShowConfirmDialog, resetProject }) => {
  if (!showConfirmDialog) return null;
  
  // Handle confirmed reset with centralized resetService
  const handleConfirmReset = () => {
    // Call the passed resetProject function if available
    if (typeof resetProject === 'function') {
      resetProject();
    } else {
      // Fallback to directly calling resetAllState
      resetAllState();
    }
    
    // Close the dialog
    setShowConfirmDialog(false);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm New Project</h3>
        <p className="mb-6 text-gray-600">
          Are you sure you want to start a new project? All current progress will be lost.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Yes, start new
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
