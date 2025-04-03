import React from 'react';

/**
 * Full-height instructions panel that spans from top to bottom
 * with larger font sizes for improved readability
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
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
      <div className="px-6 py-4">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-blue-800 mb-4">
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
