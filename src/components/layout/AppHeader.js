import React from 'react';

/**
 * Improved header component with consistent spacing and alignment
 * FIXES:
 * - Consistent spacing between header elements
 * - Proper vertical alignment
 * - Responsive button layout
 * - Fixed z-index issues
 */
const AppHeader = ({
  activeSection,
  setActiveSection,
  handleSectionChange,
  scrollToSection,
  resetProject,
  exportProject,
  saveProject,
  loadProject,
  importDocumentContent,
  setShowExamplesDialog
}) => {
  // Handle file import for PDF/Word docs
  const handleFileImport = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (importDocumentContent) {
        importDocumentContent(file);
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

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between">
          {/* Logo and title - fixed spacing */}
          <div className="flex items-center mb-2 md:mb-0">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-md flex items-center justify-center mr-3">
              <span className="font-bold text-xl">SP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Scientific Paper Planner</h1>
              <p className="text-sm text-gray-600">Design a scientific project step-by-step</p>
            </div>
          </div>

          {/* Action buttons - improved wrap behavior */}
          <div className="flex flex-wrap items-center gap-2">
            {/* New Project button */}
            <button
              onClick={resetProject}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New
            </button>

            {/* Make Example from PDF/Doc button */}
            <label className="inline-flex items-center px-3 py-2 border border-indigo-500 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Make Example from PDF/Doc
              <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileImport} />
            </label>

            {/* Save button */}
            <button
              onClick={saveProject}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>

            {/* Load button */}
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load
              <input type="file" className="hidden" accept=".json" onChange={handleFileSelection} />
            </label>

            {/* Examples button */}
            <button
              onClick={() => setShowExamplesDialog(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Examples
            </button>

            {/* Export button */}
            <button
              onClick={exportProject}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
