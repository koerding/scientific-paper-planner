// FILE: src/components/layout/AppHeader.js
// Updated with teal-colored review button to match the modal's color scheme

import React, { useState } from 'react';

/**
 * Compact header component with reduced height
 * CHANGES:
 * - Changed title from "Paper" to "Project"
 * - Fixed Help button to properly show splash screen
 * - Added loading state animation for all buttons when any is active
 * - Updated Review Papers button to use teal color matching the modal
 */
const AppHeader = ({
  resetProject,
  exportProject,
  saveProject,
  loadProject,
  importDocumentContent,
  onOpenReviewModal,
  setShowExamplesDialog,
  showHelpSplash,
  loading
}) => {
  // Local loading state for import button
  const [importLoading, setImportLoading] = useState(false);

  // Handle file import for PDF/Word docs with loading animation
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Start loading animation
      setImportLoading(true);
      
      try {
        if (importDocumentContent) {
          // Call the import function and await its completion
          await importDocumentContent(file);
        }
      } catch (error) {
        console.error("Error importing document:", error);
        alert("There was an error importing the document. Please try again or use a different file.");
      } finally {
        // Stop loading animation when done (success or error)
        setImportLoading(false);
      }
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  // Function to handle file selection for project loading
  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (loadProject) {
            loadProject(data);
          }
        } catch (error) {
          console.error('Error parsing project file:', error);
          alert('Invalid project file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  // Handle splash screen display when Help button is clicked
  const handleHelpClick = () => {
    if (showHelpSplash && typeof showHelpSplash === 'function') {
      showHelpSplash();
    } else {
      console.error("showHelpSplash function not provided to AppHeader");
    }
  };
  
  // Use either local or global loading state
  const isImporting = importLoading || loading;

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and title - more compact */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-md flex items-center justify-center mr-2">
              <span className="font-bold text-lg">SP</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Scientific Project Planner</h1>
              <p className="text-xs text-gray-600 -mt-1">Design a scientific project step-by-step</p>
            </div>
          </div>

          {/* Action buttons - more compact */}
          <div className="flex items-center space-x-1">
            {/* New Project button */}
            <button
              onClick={resetProject}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New
            </button>

            {/* Make Example from PDF/Doc button - WITH ENHANCED LOADING ANIMATION */}
            <label 
              className={`inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'border-indigo-300 bg-indigo-300 text-white cursor-wait' 
                  : 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'}`}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Make example from pdf/doc 
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc" 
                onChange={handleFileImport} 
                disabled={isImporting} 
              />
            </label>

            {/* Save button */}
            <button
              onClick={saveProject}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>

            {/* Load button */}
            <label className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
              ${isImporting 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load
              <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} disabled={isImporting} />
            </label>

            {/* Examples button */}
            <button
              onClick={() => setShowExamplesDialog(true)}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Examples
            </button>

            {/* Export button */}
            <button
              onClick={exportProject}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            {/* Review Papers button - UPDATED to use teal color to match modal */}
            <button
              onClick={onOpenReviewModal}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border ${
                isImporting
                  ? 'border-teal-400 bg-teal-400 text-white cursor-wait'
                  : 'border-teal-500 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
              } rounded-md shadow-sm text-xs font-medium`}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reviewing...
                </>
              ) : (
                <>
                  <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Review Papers
                </>
              )}
            </button>
            
            {/* Help button */}
            <button
              onClick={handleHelpClick}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium 
                ${isImporting 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
