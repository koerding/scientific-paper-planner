// FILE: src/components/layout/AppHeader.js
import React, { useState } from 'react';
import ProModeToggle from '../toggles/ProModeToggle'; // Assuming this path is correct

const AppHeader = ({
  resetProject, // This prop maps to handleResetRequest in parent
  exportProject,
  saveProject, // This prop maps to handleSaveRequest in parent
  loadProject, // Function to trigger file input for loading
  importDocumentContent, // Function from useDocumentImport hook
  onOpenReviewModal, // Function to open review modal
  setShowExamplesDialog, // Function to open examples dialog
  showHelpSplash, // Function to trigger help splash screen
  loading // Combined loading state (e.g., isAnyAiLoading from parent)
}) => {
  // Local loading state for import button specifically
  const [importLoading, setImportLoading] = useState(false);

  // Use the combined loading prop passed from the parent
  const isImporting = loading || importLoading; // Consider global loading state

  // Handle file import for PDF/Word docs with loading animation
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportLoading(true); // Start local loading indicator
      try {
        if (importDocumentContent) {
           // The confirmation dialog is now handled within useDocumentImport
          await importDocumentContent(file);
        } else {
           console.error("[AppHeader] importDocumentContent prop is missing!");
        }
      } catch (error) {
        console.error("Error during document import process:", error);
        alert("There was an error importing the document. Please try again or use a different file.");
      } finally {
        setImportLoading(false); // Stop local loading indicator
      }
    }
    event.target.value = ''; // Reset input
  };

  // Handle file selection for project loading (.json)
   const handleFileSelection = (event) => {
       const file = event.target.files?.[0];
       if (file) {
         const reader = new FileReader();
         reader.onload = (e) => {
           try {
             const data = JSON.parse(e.target.result);
             // Call the loadProject function passed as prop (triggers store update)
             if (loadProject && typeof loadProject === 'function') {
               loadProject(data);
             } else {
                console.error("[AppHeader] loadProject prop is missing or not a function!");
             }
           } catch (error) {
             console.error('Error parsing project file:', error);
             alert('Invalid project file format. Please select a valid JSON file.');
           }
         };
         reader.readAsText(file);
       }
       event.target.value = ''; // Reset input
   };


  // Handle help button click
  const handleHelpClick = () => {
    if (showHelpSplash && typeof showHelpSplash === 'function') {
      showHelpSplash();
    } else {
      console.error("[AppHeader] showHelpSplash function not provided");
    }
  };

  // Wrapper for New button click with console log
  const handleNewButtonClick = () => {
    console.log("[AppHeader] 'New' button clicked."); // <-- ADDED LOG
    if (resetProject && typeof resetProject === 'function') {
      resetProject(); // This should trigger handleResetRequest in parent
    } else {
      console.error("[AppHeader] resetProject prop is missing or not a function!");
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-md flex items-center justify-center mr-2">
              <span className="font-bold text-lg">SP</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Scientific Project Planner</h1>
              <p className="text-xs text-gray-600 -mt-1">Design a scientific project step-by-step</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* New Project button */}
            <button
              onClick={handleNewButtonClick} // <-- Use wrapper function
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

            {/* Import from PDF/Doc button */}
            <label
              className={`inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium
                ${isImporting
                  ? 'border-indigo-300 bg-indigo-300 text-white cursor-wait'
                  : 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'}`}
            >
               {isImporting ? ( /* Loading state */ <><svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" /*...*/ ></svg>Processing...</> ) :
               ( /* Default state */ <><svg className="h-3 w-3 mr-1" /*...*/ ></svg>Make example from pdf/doc</> )}
              <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} disabled={isImporting} />
            </label>

             {/* Save button */}
             <button
               onClick={saveProject} // Prop maps to handleSaveRequest in parent
               disabled={isImporting}
               className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
                 ${isImporting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
             >
                <svg className="h-3 w-3 mr-1" /*...*/ ></svg> Save
             </button>

            {/* Load button */}
            <label className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
              ${isImporting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`} >
               <svg className="h-3 w-3 mr-1" /*...*/ ></svg> Load
               <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} disabled={isImporting} />
             </label>

            {/* Examples button */}
             <button
               onClick={() => setShowExamplesDialog(true)} // Prop from parent
               disabled={isImporting}
               className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
                 ${isImporting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`} >
               <svg className="h-3 w-3 mr-1" /*...*/ ></svg> Examples
             </button>

            {/* Export button */}
             <button
               onClick={exportProject} // Prop maps to handleExportRequest in parent
               disabled={isImporting}
               className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
                 ${isImporting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`} >
               <svg className="h-3 w-3 mr-1" /*...*/ ></svg> Export
             </button>

            {/* Pro Mode toggle */}
            <ProModeToggle />

             {/* Review Papers button */}
             <button
               onClick={onOpenReviewModal} // Prop from parent
               disabled={isImporting}
               className={`inline-flex items-center px-2 py-1 border ${isImporting ? 'border-teal-400 bg-teal-400 text-white cursor-wait' : 'border-teal-500 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer' } rounded-md shadow-sm text-xs font-medium`}
             >
                {isImporting ? ( /* Loading state */ <><svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" /*...*/ ></svg>Reviewing...</> ) :
                ( /* Default state */ <><svg className="h-3 w-3 mr-1" /*...*/ ></svg>Review Papers</> )}
             </button>

            {/* Help button */}
            <button
              onClick={handleHelpClick}
              disabled={isImporting}
              className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium
                ${isImporting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'}`}
            >
              <svg className="h-3 w-3 mr-1" /*...*/ ></svg> Help
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
