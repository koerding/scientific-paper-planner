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

  // Common button styles for better consistency and appearance
  const standardButtonClasses = `
    inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
  `;
  
  const primaryButtonClasses = `${standardButtonClasses} 
    ${isImporting ? 'bg-indigo-400 border-indigo-400 text-white cursor-wait' : 
    'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white cursor-pointer'}
  `;
  
  const secondaryButtonClasses = `${standardButtonClasses}
    ${isImporting ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' : 
    'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer'}
  `;
  
  const accentButtonClasses = `${standardButtonClasses}
    ${isImporting ? 'bg-teal-400 border-teal-400 text-white cursor-wait' : 
    'bg-teal-600 border-teal-600 hover:bg-teal-700 hover:border-teal-700 text-white cursor-pointer'}
  `;

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
          <div className="flex items-center space-x-2">
            {/* New Project button */}
            <button
              onClick={handleNewButtonClick}
              disabled={isImporting}
              className={secondaryButtonClasses}
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New
            </button>

            {/* Import from PDF/Doc button */}
            <label
              className={primaryButtonClasses}
            >
               {isImporting ? ( 
                 <div className="flex items-center">
                   <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Processing...
                 </div>
               ) : (
                 <div className="flex items-center">
                   <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                   </svg>
                   Import PDF/Doc
                 </div>
               )}
              <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} disabled={isImporting} />
            </label>

             {/* Save button */}
             <button
               onClick={saveProject}
               disabled={isImporting}
               className={secondaryButtonClasses}
             >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
             </button>

            {/* Load button */}
            <label className={secondaryButtonClasses}>
               <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
               </svg>
               Load
               <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} disabled={isImporting} />
             </label>

            {/* Examples button */}
             <button
               onClick={() => setShowExamplesDialog(true)}
               disabled={isImporting}
               className={secondaryButtonClasses}
             >
               <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
               Examples
             </button>

            {/* Export button */}
             <button
               onClick={exportProject}
               disabled={isImporting}
               className={secondaryButtonClasses}
             >
               <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
               </svg>
               Export
             </button>

            {/* Pro Mode toggle */}
            <ProModeToggle />

             {/* Review Papers button */}
             <button
               onClick={onOpenReviewModal}
               disabled={isImporting}
               className={accentButtonClasses}
             >
                {isImporting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reviewing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Review Papers
                  </div>
                )}
             </button>

            {/* Help button */}
            <button
              onClick={handleHelpClick}
              disabled={isImporting}
              className={secondaryButtonClasses}
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
