// FILE: src/components/layout/AppHeader.js
import React from 'react'; // Removed useState import as it wasn't used
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
  // REMOVED: loading // Prop removed
}) => {
  // --- Get global loading state directly from store ---
  const isAiBusy = useAppStore((state) => state.isAnyLoading());
  // ---

  // Handle file import for PDF/Word docs
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file && importDocumentContent) {
        // Loading state is now managed globally by the hook/store
        await importDocumentContent(file);
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
             loadProject(data); // This triggers store update
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

  // --- Loading spinner SVG (unchanged) ---
  const loadingSpinner = (
    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // --- Button style functions (unchanged, use isAiBusy now) ---
  const getButtonClasses = (baseStyle = "text-gray-700 bg-white hover:bg-gray-50", activeStyle = baseStyle) => {
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy // Use state from store
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : `${baseStyle} cursor-pointer`
              }`;
  };
  const getImportButtonClasses = () => { // Keep specific style if desired
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy // Use state from store
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                : 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              }`;
  };
  const getReviewButtonClasses = () => { // Keep specific style if desired
      return `inline-flex items-center px-2 py-1 border rounded-md shadow-sm text-xs font-medium transition-colors
              ${isAiBusy // Use state from store
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
            <button onClick={handleNewButtonClick} disabled={isAiBusy} className={getButtonClasses()}>
              {isAiBusy ? loadingSpinner : ( /* SVG */ )} New
            </button>
            {/* Import */}
             <label className={getImportButtonClasses()} style={isAiBusy ? { pointerEvents: 'none' } : {}}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Pdf->Example
              <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} disabled={isAiBusy} />
            </label>
            {/* Save */}
            <button onClick={saveProject} disabled={isAiBusy} className={getButtonClasses()}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Save
            </button>
            {/* Load */}
             <label className={getButtonClasses()} style={isAiBusy ? { pointerEvents: 'none' } : {}}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Load
               <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} disabled={isAiBusy} />
            </label>
            {/* Examples */}
            <button onClick={() => setShowExamplesDialog(true)} disabled={isAiBusy} className={getButtonClasses()}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Examples
            </button>
            {/* Export */}
            <button onClick={exportProject} disabled={isAiBusy} className={getButtonClasses()}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Export
            </button>
            {/* Pro Mode */}
            <ProModeToggle /> {/* Should generally not be disabled */}
            {/* Review */}
            <button onClick={onOpenReviewModal} disabled={isAiBusy} className={getReviewButtonClasses()}>
               {isAiBusy ? loadingSpinner : ( /* SVG */ )} Review
            </button>
            {/* Help */}
            <button onClick={handleHelpClick} disabled={isAiBusy} className={getButtonClasses()}>
              {isAiBusy ? loadingSpinner : ( /* SVG */ )} Help
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
