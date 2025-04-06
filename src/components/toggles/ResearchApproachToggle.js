import React from 'react';

/**
 * Toggle component for selecting research approach
 * UPDATED: Made styling more subtle
 */
const ResearchApproachToggle = ({ activeApproach, setActiveApproach }) => {
  // Helper to generate button classes
  const getButtonClasses = (approach) => `
    px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow
    ${activeApproach === approach
      ? 'active font-semibold text-indigo-600 bg-indigo-100' // Subtle active style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Subtle default/hover
    }
  `;

  return (
    // Removed heavy container styles, added padding/margin
    <div className="approach-toggle mb-4 pt-2">
      <h3 className="font-medium text-lg text-gray-800 mb-3">Choose Your Research Approach:</h3>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveApproach('hypothesis')}
          className={getButtonClasses('hypothesis')}
        >
          <div className="flex items-center justify-center">
            {/* Icon can remain or be removed for more subtlety */}
            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> */}
            Hypothesis Testing
          </div>
        </button>

        <button
          onClick={() => setActiveApproach('needsresearch')}
          className={getButtonClasses('needsresearch')}
        >
          <div className="flex items-center justify-center">
             {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg> */}
            Needs-Based Research
          </div>
        </button>

        <button
          onClick={() => setActiveApproach('exploratoryresearch')}
          className={getButtonClasses('exploratoryresearch')}
        >
          <div className="flex items-center justify-center">
             {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg> */}
            Exploratory Research
          </div>
        </button>
      </div>
    </div>
  );
};

export default ResearchApproachToggle;
