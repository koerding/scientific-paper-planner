// FILE: src/components/toggles/ResearchApproachToggle.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store

const ResearchApproachToggle = ({ activeApproach, setActiveApproach }) => {
  // No need to select state from store here if parent (LeftPanel) handles it

  const getButtonClasses = (approach) => `
    px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow
    ${activeApproach === approach
      ? 'active font-semibold text-indigo-600 bg-indigo-100'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }
  `;

  // Use the setActiveApproach function passed from the parent (which calls the store action)
  const handleApproachChange = (approach) => {
    if (setActiveApproach && typeof setActiveApproach === 'function') {
      setActiveApproach(approach);
    }
  };

  return (
    <div className="approach-toggle mb-3">
      <h3 className="font-medium text-sm text-gray-800 mb-2">Research Approach:</h3>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => handleApproachChange('hypothesis')}
          className={getButtonClasses('hypothesis')}
        >
          Hypothesis Testing
        </button>
        <button
          onClick={() => handleApproachChange('needsresearch')}
          className={getButtonClasses('needsresearch')}
        >
          Needs-Based
        </button>
        <button
          onClick={() => handleApproachChange('exploratoryresearch')}
          className={getButtonClasses('exploratoryresearch')}
        >
          Exploratory
        </button>
      </div>
    </div>
  );
};

export default ResearchApproachToggle;
