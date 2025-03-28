import React from 'react';

/**
 * A modern navigation component with visual stepper and animations
 */
const ModernNavigation = ({
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
  // Calculate overall progress percentage
  const getCompletionPercentage = () => {
    const completedSections = sections.filter(section => {
      return section.type === 'checklist' 
        ? userInputs.philosophy.length > 0 
        : userInputs[section.id]?.trim().length > 0;
    });
    
    return Math.round((completedSections.length / sections.length) * 100);
  };
  
  // Check if a section has content
  const hasContent = (section) => {
    return section.type === 'checklist' 
      ? userInputs.philosophy.length > 0 
      : userInputs[section.id]?.trim().length > 0;
  };

  return (
    <div className="mb-8">
      {/* Progress overview */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-700">Your Progress</h3>
          <span className="text-lg font-semibold text-indigo-600">{getCompletionPercentage()}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Visual step indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        {/* Connecting line */}
        <div className="absolute h-1 bg-gray-200 top-1/2 left-0 right-0 -translate-y-1/2 z-0"></div>
        
        {/* Steps */}
        {sections.map((section, index) => {
          const isComplete = hasContent(section);
          const isCurrent = currentSection === section.id;
          
          return (
            <div 
              key={section.id} 
              className="z-10 flex flex-col items-center"
              onClick={() => handleSectionChange(section.id)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white scale-110 shadow-md' 
                    : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-500 border-2 border-gray-200'
                }`}
              >
                {isComplete ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className={`text-xs font-medium mt-2 ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                {section.title}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousSection}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
              currentIndex === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="px-4 py-2 rounded-lg flex items-center bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Project
          </button>
          
          <button
            onClick={exportProject}
            className="px-4 py-2 rounded-lg flex items-center bg-white border border-green-200 text-green-600 hover:bg-green-50 transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export
          </button>
        </div>
        
        <button
          onClick={goToNextSection}
          disabled={currentIndex === sections.length - 1}
          className={`px-6 py-2 rounded-lg flex items-center font-medium transition-all duration-200 ${
            currentIndex === sections.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg'
          }`}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ModernNavigation;
