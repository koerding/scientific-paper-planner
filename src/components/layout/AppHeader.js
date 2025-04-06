// FILE: src/components/layout/AppHeader.js
import React, { useRef, useState, useEffect } from 'react';

/**
 * Application header
 * UPDATED: Corrected loading animation display for "Make Example from PDF/Doc" button.
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
  setShowExamplesDialog,
  // Removed onboardingStep prop
}) => {
  // Refs
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false); // State for PDF/Doc import loading

  // Handlers (remain unchanged)
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { alert("Please select a JSON file..."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { /* ... load logic ... */ };
    reader.onerror = (error) => { /* ... error handling ... */ };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleDocumentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // File type check remains
    if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('docx') && !file.type.includes('doc') && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      alert("Please select a PDF or Word document");
      return;
    }
    setIsImporting(true); // Set loading TRUE
    try {
      if (typeof importDocumentContent === 'function') await importDocumentContent(file);
      else alert("Document import functionality is not available");
    } catch (error) {
      console.error("Error importing document:", error);
      alert("We had some trouble processing this document...");
    } finally {
      setIsImporting(false); // Set loading FALSE
      event.target.value = null;
    }
  };

  const handleLoadClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleDocumentImportClick = () => { if (documentInputRef.current) documentInputRef.current.click(); };
  const handleExamplesClick = () => { if (typeof setShowExamplesDialog === 'function') setShowExamplesDialog(true); else console.error("setShowExamplesDialog function not provided"); };
  const handleSaveClick = () => { /* ... save logic ... */ };

  // Effect for Ctrl+S (remains unchanged)
  useEffect(() => {
    const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveClick(); } };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Add dependencies if handleSaveClick uses state/props

  return (
    <header style={{ /* Styles remain unchanged */ position: 'relative', width: '100%', padding: '1rem 0', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', zIndex: 1000 }}>
      <div style={{ /* Styles remain unchanged */ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        {/* App title and logo */}
        <div className="flex items-center">
            {/* ... title/logo ... */}
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 text-lg">SP</div>
             <div>
               <h1 className="text-3xl font-bold m-0 text-gray-900">Scientific Paper Planner</h1>
               <p className="text-lg text-gray-600 m-0">Design a scientific project step-by-step</p>
             </div>
        </div>

        {/* Action buttons container */}
        <div style={{ /* Styles remain unchanged */ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem', zIndex: 1001 }}>
          {/* New Button */}
          <button onClick={() => { if(typeof resetProject === 'function') resetProject(); }} className="..." title="Start a new project"> New </button>
          {/* Save Button */}
          <button onClick={handleSaveClick} disabled={isSaving} className="..." title="Save your project (Ctrl+S)"> {isSaving ? (<>...</>) : (<>Save</>)} </button>
          {/* Load Button */}
          <div className="relative"> <button onClick={handleLoadClick} className="..." title="Load a saved project"> Load </button> <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }}/> </div>

          {/* --- Make Example from PDF/Doc Button - Updated Loading State --- */}
          <div className="relative">
            <button
              onClick={handleDocumentImportClick}
              disabled={isImporting}
              className={`flex items-center justify-center px-3 py-1.5 border rounded text-sm font-medium transition-colors shadow-sm ${ // Added justify-center
                isImporting
                  ? 'bg-gray-100 text-gray-400 border-gray-400 cursor-wait' // Disabled style
                  : 'bg-green-600 text-white border-green-600 hover:bg-green-700' // Active style (salient green)
              }`}
              style={{ minWidth: '120px' }} // Optional: Set a min-width to reduce size jump if text changes
              title="Create example project from a scientific paper (PDF or Word)"
            >
              {isImporting ? (
                // Show only the spinner when importing
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> {/* Adjusted spinner color for contrast */}
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                // Normal state with icon and text
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
          {/* -------------------------------------------------------------- */}

          {/* Examples Button */}
          <button onClick={handleExamplesClick} className="..." title="Load an example project"> Examples </button>
          {/* Export Button */}
          <button onClick={() => { if(typeof exportProject === 'function') exportProject(); }} className="..." title="Export your project as a markdown file"> Export </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
