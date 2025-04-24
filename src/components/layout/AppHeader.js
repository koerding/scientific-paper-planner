// FILE: src/components/layout/AppHeader.js
import React, { useState } from 'react';
import ProModeToggle from '../toggles/ProModeToggle';
import useAppStore from '../../store/appStore'; // Import store

const AppHeader = ({
  resetProject,
  exportProject,
  saveProject,
  loadProject,
  importDocumentContent,
  onOpenReviewModal,
  setShowExamplesDialog,
  showHelpSplash,
}) => {
  // --- Get global loading state directly from store ---
  const isAiBusy = useAppStore((state) => state.isAnyLoading());
  
  // --- Add local state for import loading ---
  const [localImportLoading, setLocalImportLoading] = useState(false);
   
  // --- Loading spinner SVG (unchanged) ---
  const loadingSpinner = (
    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Handle file import for PDF/Word docs - Using local state
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file && importDocumentContent) {
        // Set local loading state
        setLocalImportLoading(true);
        
        try {
            await importDocumentContent(file);
        } finally {
            // Clear loading after a slight delay to ensure UI updates
            setTimeout(() => {
                setLocalImportLoading(false);
            }, 500);
        }
    }
    event.target.value = ''; // Reset input
  };

  // Handle file selection for project loading (.json)
   const handleFileSelection = (event) => {
       const file = event.target.files?.[0];
       if (file && loadProject) {
         const reader = new FileReader();
         reader.onload = (e) => {
           try {
             const data = JSON.parse(e.target.result);
             loadProject(data);
           } catch (error) {
             console.error('Error parsing project file:', error);
             alert('Invalid project file format. Please select a valid JSON file.');
           }
         };
         reader.readAsText(file);
       }
       event.target.value = ''; // Reset input
   };

  const handleHelpClick = () => {
    if (showHelpSplash) showHelpSplash();
  };

  const handleNewButtonClick = () => {
    if (resetProject) resetProject();
  };

  // --- Button style functions (unchanged, use isAiBusy now) ---
  const getButtonClasses = (baseStyle = "text-gray-700 bg-white hover:bg-gray-50", activeStyle = baseStyle) => {
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : `${baseStyle} cursor-pointer`
              }`;
  };
  
  // --- Import button with direct local loading state ---
  const getImportButtonClasses = () => {
      if (localImportLoading) {
          return 'inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors border-indigo-400 bg-indigo-300 text-indigo-800 cursor-wait animate-pulse';
      }
      
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              }`;
  };
  
  const getReviewButtonClasses = () => {
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : 'border-teal-500 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
              }`;
  };


  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-left">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-md flex items-center justify-center mr-2">
              <span className="font-bold text-lg">SP</span>
            </div>
          </div>

          {/* Action buttons use isAiBusy from store */}
          <div className="flex items-center space-x-1">
            {/* New Project */}
            <button onClick={handleNewButtonClick} disabled={isAiBusy || localImportLoading} className={getButtonClasses()}>
              {isAiBusy ? loadingSpinner : (
                  <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
              )} New
            </button>
            {/* Import - Using local loading state */}
             <label className={getImportButtonClasses()} style={(isAiBusy || localImportLoading) ? { pointerEvents: 'none' } : {}}>
               {localImportLoading ? loadingSpinner : (
                 <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                 </svg>
               )} {localImportLoading ? "Importing..." : "Pdf->Example"}
              <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} disabled={isAiBusy || localImportLoading} />
            </label>
            {/* Save */}
            <button onClick={saveProject} disabled={isAiBusy || localImportLoading} className={getButtonClasses()}>
               {isAiBusy ? loadingSpinner : (
                   <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                   </svg>
               )} Save
            </button>
            {/* Load */}
             <label className={getButtonClasses()} style={(isAiBusy || localImportLoading) ? { pointerEvents: 'none' } : {}}>
               {isAiBusy ? loadingSpinner : (
                   <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                   </svg>
               )} Load
               <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} disabled={isAiBusy || localImportLoading} />
            </label>
            {/* Export */}
            <button onClick={exportProject} disabled={isAiBusy || localImportLoading} className={getButtonClasses()}>
               {isAiBusy ? loadingSpinner : (
                   <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                   </svg>
               )} Export
            </button>
            {/* Pro Mode */}
            <ProModeToggle /> {/* Should generally not be disabled */}
            {/* Review */}
            <button onClick={onOpenReviewModal} disabled={isAiBusy || localImportLoading} className={getReviewButtonClasses()}>
               {isAiBusy ? loadingSpinner : (
                   <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
               )} Review
            </button>
            {/* Help */}
            <button onClick={handleHelpClick} disabled={isAiBusy || localImportLoading} className={getButtonClasses()}>
              {isAiBusy ? loadingSpinner : (
                  <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              )} Help
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
