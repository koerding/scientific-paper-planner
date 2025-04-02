import React from 'react';

/**
 * Header component for the Scientific Paper Planner
 * Contains logo, navigation tabs for sections, and action buttons
 */
const AppHeader = ({ 
  sections, 
  activeSection, 
  setActiveSection, 
  handleSectionChange, 
  scrollToSection,
  resetProject,
  exportProject
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white shadow py-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
            SP
          </div>
          <div>
            <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
            <p className="text-sm text-gray-600">
              Hypothesis-Driven Research Project
            </p>
          </div>
        </div>
        
        {/* Save and Export buttons */}
        <div className="flex space-x-2">
          <button
            onClick={resetProject}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New
          </button>
          
          <button
            onClick={exportProject}
            className="px-3 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export
          </button>
        </div>
      </div>
      
      {/* Section quick links */}
      <div className="flex overflow-x-auto py-2 mt-2 space-x-2">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => {
              scrollToSection(section.id);
              setActiveSection(section.id);
              handleSectionChange(section.id);
            }}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap 
              ${activeSection === section.id 
                ? 'bg-indigo-100 text-indigo-800 font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {index + 1}. {section.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppHeader;
