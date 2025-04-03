import React from 'react';

/**
 * Application header with simplified navigation
 * Fixed alignment and button display issues
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
      <div className="container mx-auto px-4">
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
          
          {/* Action buttons - Force display */}
          <div className="flex space-x-2" style={{ display: 'flex !important' }}>
            <button
              onClick={resetProject}
              className="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 flex items-center"
              title="Start a new project"
              style={{ display: 'flex !important' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              New
            </button>
            
            <button
              onClick={exportProject}
              className="px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 flex items-center"
              title="Export your project as a markdown file"
              style={{ display: 'flex !important' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
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
