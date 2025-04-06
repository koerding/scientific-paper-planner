// FILE: src/components/layout/AppHeader.js
import React, { useRef, useState, useEffect } from 'react';

/**
 * Application header
 * KEPT: Salient green button for PDF import.
 */
const AppHeader = ({
  activeSection, setActiveSection, handleSectionChange, scrollToSection,
  resetProject, exportProject, saveProject, loadProject,
  importDocumentContent, setShowExamplesDialog
}) => {
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Handlers remain the same...
  const handleFileChange = (event) => { /* ... */ };
  const handleDocumentChange = async (event) => { /* ... sets isImporting ... */ };
  const handleLoadClick = () => { /* ... */ };
  const handleDocumentImportClick = () => { /* ... */ };
  const handleExamplesClick = () => { /* ... */ };
  const handleSaveClick = () => { /* ... */ };
  useEffect(() => { /* Ctrl+S listener */ }, []); // Add dependencies if needed

  return (
    <header style={{ position: 'relative', /* ... other styles ... */ zIndex: 1000 }}>
      <div style={{ /* ... inner div styles ... */ }}>
        {/* App title and logo */}
        <div className="flex items-center"> {/* ... */} </div>

        {/* Action buttons container */}
        <div style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem', zIndex: 1001 }}>
          {/* New Button */}
          <button onClick={() => { /* ... */ }} className="..." title="Start a new project"> New </button>
          {/* Save Button */}
          <button onClick={handleSaveClick} disabled={isSaving} className="..." title="Save your project (Ctrl+S)"> {isSaving ? (<>...</>) : (<>Save</>)} </button>
          {/* Load Button */}
          <div className="relative"> <button onClick={handleLoadClick} className="..." title="Load a saved project"> Load </button> <input ref={fileInputRef} /* ... */ /> </div>

          {/* Make Example from PDF/Doc Button - Kept salient green style */}
          <div className="relative">
            <button
              onClick={handleDocumentImportClick}
              disabled={isImporting}
              className={`flex items-center justify-center px-3 py-1.5 border rounded text-sm font-medium transition-colors shadow-sm ${ // Added justify-center
                isImporting
                  ? 'bg-gray-100 text-gray-400 border-gray-400 cursor-wait'
                  : 'bg-green-600 text-white border-green-600 hover:bg-green-700' // Salient style
              }`}
              style={{ minWidth: '120px' }}
              title="Create example project from a scientific paper (PDF or Word)"
            >
              {isImporting ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" /* ... */ > {/* Spinner */} </svg>
              ) : (
                <> <svg className="h-4 w-4 mr-1" /* ... */ > {/* Icon */} </svg> Make Example from PDF/Doc </>
              )}
            </button>
            <input ref={documentInputRef} type="file" /* ... */ style={{ display: 'none' }}/>
          </div>

          {/* Examples Button */}
          <button onClick={handleExamplesClick} className="..." title="Load an example project"> Examples </button>
          {/* Export Button */}
          <button onClick={() => { /* ... */ }} className="..." title="Export your project..."> Export </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
