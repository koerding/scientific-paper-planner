import React from 'react';

/**
 * InstructionsPanel displays instructions for the current section
 * Occupies remaining space in the flex container
 */
const InstructionsPanel = ({ currentSection }) => {
  return (
    <div style={{
      backgroundColor: '#EBF5FF', /* bg-blue-50 */
      borderRadius: '0.5rem',
      padding: '1.5rem',
      borderLeftWidth: '4px',
      borderLeftColor: '#3B82F6', /* border-blue-500 */
      overflowY: 'auto',
      flex: '1 1 auto', /* Allow this to grow and take available space */
      position: 'relative'
    }}>
      {/* Connection to active section */}
      <div style={{
        position: 'absolute',
        left: '-3px',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        width: '16px',
        height: '16px',
        backgroundColor: '#3B82F6', /* bg-blue-500 */
        borderRadius: '50%',
        zIndex: 10
      }}>
        {/* Line connecting to active section */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '100%',
          width: '30px',
          height: '2px',
          backgroundColor: '#3B82F6', /* bg-blue-500 */
          transform: 'translateY(-50%)'
        }}></div>
      </div>
    
      {!currentSection ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-blue-600">Select a section to view instructions</p>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-blue-800 mb-4">
            {currentSection.title}
          </h3>
          <div className="prose prose-blue max-w-none">
            <div className="text-blue-700">
              {currentSection.instructions.description.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-3">{paragraph}</p>
              ))}
            </div>
            {currentSection.instructions.workStep && currentSection.instructions.workStep.content && (
              <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  {currentSection.instructions.workStep.title}
                </h4>
                <div className="text-blue-600 text-sm">
                  {currentSection.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InstructionsPanel;
