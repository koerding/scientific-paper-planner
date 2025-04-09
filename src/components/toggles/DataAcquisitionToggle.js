import React from 'react';

/**
 * Toggle component for selecting data acquisition method
 * UPDATED: Made styling more subtle
 * FIXED: Significantly more compact layout with less whitespace
 * UPDATED: Added Theory/Simulation as a third option
 */
const DataAcquisitionToggle = ({ activeMethod, setActiveMethod }) => {
  // Helper to generate button classes
  const getButtonClasses = (method) => `
    px-3 py-1 rounded-md text-sm font-medium transition-colors flex-1
    ${activeMethod === method
      ? 'active font-semibold text-indigo-600 bg-indigo-100' // Subtle active style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Subtle default/hover
    }
  `;

  return (
    // Removed heavy container styles, added padding/margin
    <div className="data-toggle mb-3">
      <h3 className="font-medium text-sm text-gray-800 mb-2">Data Acquisition:</h3>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveMethod('experiment')}
          className={getButtonClasses('experiment')}
        >
          <div className="flex items-center justify-center">
            New Experiment
          </div>
        </button>

        <button
          onClick={() => setActiveMethod('existingdata')}
          className={getButtonClasses('existingdata')}
        >
          <div className="flex items-center justify-center">
            Existing Data
          </div>
        </button>

        <button
          onClick={() => setActiveMethod('theorysimulation')}
          className={getButtonClasses('theorysimulation')}
        >
          <div className="flex items-center justify-center">
            Theory/Simulation
          </div>
        </button>
      </div>
    </div>
  );
};

export default DataAcquisitionToggle;
