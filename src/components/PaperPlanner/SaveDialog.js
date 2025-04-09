import React, { useState } from 'react';

/**
 * Dialog for saving a project with a custom name
 * Matches the style of other dialogs in the application
 */
const SaveDialog = ({ showSaveDialog, setShowSaveDialog, saveProject }) => {
  const [fileName, setFileName] = useState('scientific-paper-plan');
  
  if (!showSaveDialog) return null;
  
  const handleSave = () => {
    if (fileName.trim() === '') {
      alert('Please enter a file name.');
      return;
    }
    
    // Call the save function with the provided filename
    saveProject(fileName);
    setShowSaveDialog(false);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Save Project</h3>
        <p className="mb-4 text-gray-600">
          Enter a name for your project file:
        </p>
        
        <div className="mb-4">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="scientific-paper-plan"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-1">
            The file will be saved with .json extension
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowSaveDialog(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveDialog;
