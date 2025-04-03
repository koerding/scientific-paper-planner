import React from 'react';

/**
 * Application header with simplified navigation
 */
const AppHeader = ({
  activeSection,
  setActiveSection,
  handleSectionChange,
  scrollToSection,
  resetProject,
  exportProject
}) => {
  return (
    <header className="py-4 mb-8 border-b border-gray-200">
      <div className="flex justify-between items-center">
        {/* App title and logo */}
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
            SP
          </div>
          <div>
            <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
            <p className="text-sm text-gray-600">
              Design a hypothesis-based neuroscience project step-by-step
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={resetProject}
            className="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 flex items-center"
            title="Start a new project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New
          </button>
          
          <button
            onClick={exportProject}
            className="px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 flex items-center"
            title="Export your project as a markdown file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
