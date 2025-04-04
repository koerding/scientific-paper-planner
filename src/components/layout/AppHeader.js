import React, { useRef, useState } from 'react';

/**
 * Application header with absolute positioning to ensure buttons are visible
 * UPDATED: Improved document import feature for PDF and Word files
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
  importDocumentContent, // Renamed from importPdfContent to reflect broader support
  setShowExamplesDialog
}) => {
  // Use refs for file inputs
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
  // States for visual feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Handle JSON file input change
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      alert("Please select a JSON file (ending in .json)");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        if (typeof loadProject === 'function') {
          loadProject(data);
        } else {
          alert("Loading functionality is not available");
        }
      } catch (error) {
        console.error("Error parsing loaded file:", error);
        alert("Error loading file. Please make sure it's a valid project file.");
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error reading file. Please try again.");
    };

    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    event.target.value = null;
  };

  // Handle document file input change (PDF or Word)
  const handleDocumentChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Check file type (PDF or Word)
    if (!file.type.includes('pdf') && 
        !file.type.includes('word') && 
        !file.type.includes('docx') && 
        !file.type.includes('doc') &&
        !file.name.endsWith('.pdf') && 
        !file.name.endsWith('.docx') && 
        !file.name.endsWith('.doc')) {
      alert("Please select a PDF or Word document");
      return;
    }

    setIsImporting(true);

    try {
      // Call the importDocumentContent function with the file
      if (typeof importDocumentContent === 'function') {
        await importDocumentContent(file);
      } else {
        alert("Document import functionality is not available");
      }
    } catch (error) {
      console.error("Error importing document:", error);
      // More user-friendly error message
      alert("We had some trouble processing this document. You might want to try a different file or format.");
    } finally {
      setIsImporting(false);
      // Reset file input so the same file can be selected again
      event.target.value = null;
    }
  };

  // Handle load button click
  const handleLoadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle document import button click
  const handleDocumentImportClick = () => {
    if (documentInputRef.current) {
      documentInputRef.current.click();
    }
  };

  // Handle examples button click
  const handleExamplesClick = () => {
    if (typeof setShowExamplesDialog === 'function') {
      setShowExamplesDialog(true);
    } else {
        console.error("setShowExamplesDialog function is not provided to AppHeader");
    }
  };

  // Handle save button click with visual indicator
  const handleSaveClick = () => {
    if (typeof saveProject === 'function') {
      setIsSaving(true);
      
      // Ask for file name
      const fileName = prompt("Enter a name for your project file:", "my-research-project");
      
      if (fileName) {
        try {
          saveProject(fileName);
          
          // Show saving indicator then hide after delay
          setTimeout(() => {
            setIsSaving(false);
          }, 1000);
        } catch (error) {
          console.error("Error saving project:", error);
          alert("Error saving project: " + error.message);
          setIsSaving(false);
        }
      } else {
        // User cancelled the prompt
        setIsSaving(false);
      }
    } else {
      console.error("saveProject function is not provided to AppHeader");
    }
  };

  // Effect to capture Ctrl+S keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog
        handleSaveClick();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header style={{
      position: 'relative',
      width: '100%',
      padding: '1rem 0',
      marginBottom: '2rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: 'white',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* App title and logo */}
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 text-lg">
            SP
          </div>
          <div>
            <h1 className="text-3xl font-bold m-0 text-gray-900">
              Scientific Paper Planner
            </h1>
            <p className="text-lg text-gray-600 m-0">
              Design a hypothesis-based neuroscience project step-by-step
            </p>
          </div>
        </div>

        {/* Floating action buttons */}
        <div style={{
           position: 'absolute',
           top: '50%',
           right: '1rem',
           transform: 'translateY(-50%)',
           display: 'flex',
           gap: '0.5rem',
           zIndex: 1001
        }}>
          {/* New Button */}
          <button
            onClick={() => { if(typeof resetProject === 'function') resetProject(); }}
            className="flex items-center px-3 py-1.5 border border-red-500 text-red-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-red-50 transition-colors"
            title="Start a new project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`flex items-center px-3 py-1.5 border border-indigo-500 rounded text-sm font-medium transition-colors ${
              isSaving 
                ? 'bg-indigo-100 text-indigo-400 cursor-wait' 
                : 'bg-white text-indigo-600 hover:bg-indigo-50'
            } shadow-sm`}
            title="Save your project (Ctrl+S)"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </>
            )}
          </button>

          {/* Load Button - Triggers hidden file input */}
          <div className="relative">
            <button
              onClick={handleLoadClick}
              className="flex items-center px-3 py-1.5 border border-blue-500 text-blue-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-blue-50 transition-colors"
              title="Load a saved project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Document Import Button - RENAMED */}
          <div className="relative">
            <button
              onClick={handleDocumentImportClick}
              disabled={isImporting}
              className={`flex items-center px-3 py-1.5 border rounded text-sm font-medium transition-colors shadow-sm ${
                isImporting
                  ? 'bg-gray-100 text-gray-400 border-gray-400 cursor-wait'
                  : 'bg-white text-orange-600 border-orange-500 hover:bg-orange-50'
              }`}
              title="Create example project from a scientific paper (PDF or Word)"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Make Example from PDF/Doc
                </>
              )}
            </button>
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleDocumentChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Examples Button */}
          <button
            onClick={handleExamplesClick}
            className="flex items-center px-3 py-1.5 border border-purple-500 text-purple-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-purple-50 transition-colors"
            title="Load an example project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Examples
          </button>

          {/* Export Button */}
          <button
            onClick={() => { if(typeof exportProject === 'function') exportProject(); }}
            className="flex items-center px-3 py-1.5 border border-green-500 text-green-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-green-50 transition-colors"
            title="Export your project as a markdown file"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
            Export
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
