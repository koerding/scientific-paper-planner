import React, { useState } from 'react';

/**
 * Full-height instructions panel with Improve button
 * that intelligently updates instructions based on user progress
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  userInputs,
  improveInstructions,
  loading = false
}) => {
  const [improving, setImproving] = useState(false);
  
  // Handle improve button click
  const handleImprove = async () => {
    setImproving(true);
    await improveInstructions();
    setImproving(false);
  };
  
  return (
    <div 
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Account for header
        paddingBottom: '2rem', 
        zIndex: 10
      }}
    >
      <div className="px-6 py-4 relative">
        {/* Improve button */}
        <button 
          onClick={handleImprove}
          disabled={improving || loading}
          className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-base font-medium transition-all
            ${improving || loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md'
            }`}
        >
          {improving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Improving...
            </span>
          ) : 'Improve'}
        </button>

        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-blue-800 mb-4 pr-24">
              {currentSection.title}
            </h3>
            <div className="prose prose-blue max-w-none">
              <div className="text-blue-700 text-lg">
                {currentSection.instructions.description.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-3">{paragraph}</p>
                ))}
              </div>
              {currentSection.instructions.workStep && currentSection.instructions.workStep.content && (
                <div className="bg-white rounded-lg p-4 border border-blue-200 mt-5">
                  <h4 className="font-medium text-blue-800 mb-2 text-xl">
                    {currentSection.instructions.workStep.title}
                  </h4>
                  <div className="text-blue-600 text-lg">
                    {currentSection.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
