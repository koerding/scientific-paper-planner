import React from 'react';

/**
 * Application header with absolute positioning to ensure buttons are visible
 * UPDATED: Added Load button and input file handler
 */
const AppHeader = ({
  activeSection, // Keep props even if unused by this component itself
  setActiveSection,
  handleSectionChange,
  scrollToSection,
  resetProject,
  exportProject,
  loadProject
}) => {
  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (typeof loadProject === 'function') {
            loadProject(data);
          }
        } catch (error) {
          console.error("Error parsing loaded file:", error);
          alert("Error loading file. Please make sure it's a valid project file.");
        }
      };
      reader.readAsText(file);
    }
    // Reset file input so the same file can be selected again
    event.target.value = null;
  };

  return (
    <header style={{
      position: 'relative', // Changed from sticky if it caused issues
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
        maxWidth: '1280px', // Or your preferred max-width
        margin: '0 auto',
        padding: '0 1rem' // Standard padding
      }}>
        {/* App title and logo */}
        <div className="flex items-center"> {/* Use className for Tailwind */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 text-lg"> {/* Added text-lg */}
            SP
          </div>
          <div>
            {/* Apply larger text classes */}
            <h1 className="text-3xl font-bold m-0 text-gray-900"> {/* Increased size */}
              Scientific Paper Planner
            </h1>
            <p className="text-lg text-gray-600 m-0"> {/* Increased size */}
              Design a hypothesis-based neuroscience project step-by-step
            </p>
          </div>
        </div>

        {/* Floating action buttons */}
        {/* Keep position absolute or adjust as needed */}
        <div style={{
           position: 'absolute', // Keep absolute or use flex end for non-overlap
           top: '50%', // Align vertically
           right: '1rem', // Align to the right padding
           transform: 'translateY(-50%)', // Center vertically
           display: 'flex',
           gap: '0.5rem', // Space between buttons
           zIndex: 1001
        }}>
          <button
            onClick={() => { if(typeof resetProject === 'function') resetProject(); }} // Added check
            className="flex items-center px-3 py-1.5 border border-red-500 text-red-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-red-50 transition-colors"
            title="Start a new project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>

          {/* Load Button - Triggers hidden file input */}
          <div className="relative">
            <button
              onClick={() => document.getElementById('loadProjectInput').click()}
              className="flex items-center px-3 py-1.5 border border-blue-500 text-blue-600 rounded text-sm font-medium bg-white shadow-sm hover:bg-blue-50 transition-colors"
              title="Load a saved project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load
            </button>
            <input 
              id="loadProjectInput"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <button
            onClick={() => { if(typeof exportProject === 'function') exportProject(); }} // Added check
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
