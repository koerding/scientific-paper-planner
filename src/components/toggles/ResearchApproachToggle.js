import React from 'react';

/**
 * Toggle component for selecting research approach
 * FIXED: Ensured proper active state handling
 */
const ResearchApproachToggle = ({ activeApproach, setActiveApproach }) => {
  // Helper to generate button classes
  const getButtonClasses = (approach) => `
    px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow
    ${activeApproach === approach
      ? 'active font-semibold text-indigo-600 bg-indigo-100' // Subtle active style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Subtle default/hover
    }
  `;

  // Handler for approach selection
  const handleApproachChange = (approach) => {
    console.log(`Changing research approach to: ${approach}`);
    if (setActiveApproach && typeof setActiveApproach === 'function') {
      setActiveApproach(approach);
    }
  };

  return (
    // Removed heavy container styles, added padding/margin
    <div className="approach-toggle mb-3">
      <h3 className="font-medium text-sm text-gray-800 mb-2">Research Approach:</h3>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => handleApproachChange('hypothesis')}
          className={getButtonClasses('hypothesis')}
        >
          <div className="flex items-center justify-center">
            Hypothesis Testing
          </div>
        </button>

        <button
          onClick={() => handleApproachChange('needsresearch')}
          className={getButtonClasses('needsresearch')}
        >
          <div className="flex items-center justify-center">
            Needs-Based
          </div>
        </button>

        <button
          onClick={() => handleApproachChange('exploratoryresearch')}
          className={getButtonClasses('exploratoryresearch')}
        >
          <div className="flex items-center justify-center">
            Exploratory
          </div>
        </button>
      </div>
    </div>
  );
};

export default ResearchApproachToggle;
