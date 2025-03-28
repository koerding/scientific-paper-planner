import React from 'react';

/**
 * Renders the navigation tabs and buttons
 */
const Navigation = ({
  sections,
  currentSection,
  currentIndex,
  userInputs,
  handleSectionChange,
  setShowConfirmDialog,
  exportProject,
  goToNextSection,
  goToPreviousSection
}) => {
  return (
    <>
      {/* Tab Navigation */}
      <div className="flex flex-wrap mb-6">
        {sections.map((section, index) => {
          const hasContent = section.type === 'checklist' 
            ? userInputs.philosophy.length > 0 
            : userInputs[section.id]?.trim().length > 0;
          
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`mr-2 mb-2 px-4 py-2 rounded flex items-center ${
                currentSection === section.id
                  ? 'bg-blue-600 text-white'
                  : hasContent
                    ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full mr-2 ${
                currentIndex === index
                  ? 'bg-white text-blue-600'
                  : hasContent
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-400 text-white'
              }`}>
                {index + 1}
              </span>
              {section.title}
            </button>
          );
        })}
      </div>
      
      {/* Bottom Navigation */}
      <div className="flex justify-between mt-8">
        <div className="flex">
          <button
            onClick={goToPreviousSection}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center mr-2"
            disabled={currentIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center mr-2"
            title="Start a new project"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Project
          </button>
          
          <button
            onClick={exportProject}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            title="Export your project as a markdown file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Project
          </button>
        </div>
        
        <button
          onClick={goToNextSection}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          disabled={currentIndex === sections.length - 1}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default Navigation;
