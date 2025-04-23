// FILE: src/components/PaperPlanner/ConfirmDialog.js

import React from 'react';
// Removed import from resetService

/**
 * Confirmation dialog for resetting the project
 */
const ConfirmDialog = ({ showConfirmDialog, setShowConfirmDialog, resetProject }) => {

  // Log the crucial prop value
  console.log(`[ConfirmDialog] Rendering with showConfirmDialog: ${showConfirmDialog}`); // <-- ADD LOG

  if (!showConfirmDialog) {
      return null; // Don't render if false
  }

  // Handle confirmed reset by calling the function passed via props
  const handleConfirmReset = () => {
    if (typeof resetProject === 'function') {
      resetProject();
    } else {
      console.error("ConfirmDialog: resetProject prop function is missing!");
    }
    // The component itself doesn't control visibility directly anymore,
    // it relies on the parent changing the prop.
    // We can still call the close function if provided, though it might be redundant
    // if the parent closes it upon reset.
    if (typeof setShowConfirmDialog === 'function') {
        setShowConfirmDialog(); // Call the close function passed via props
    }
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
            onClick={setShowConfirmDialog} // Call close function directly on cancel
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
