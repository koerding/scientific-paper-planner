// src/components/toggles/DataAcquisitionToggle.js
import React from 'react';

const DataAcquisitionToggle = ({ activeMethod, setActiveMethod }) => {
  // Helper to generate button classes
  const getButtonClasses = (method) => `
    px-3 py-1 rounded-md text-sm font-medium transition-colors flex-1
    ${activeMethod === method
      ? 'active font-semibold text-indigo-600 bg-indigo-100' // Subtle active style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Subtle default/hover
    }
  `;

  // Handler for method selection
  const handleMethodChange = (method) => {
    console.log(`Changing data acquisition method to: ${method}`);
    if (setActiveMethod && typeof setActiveMethod === 'function') {
      setActiveMethod(method);
    }
  };

  return (
    // Removed heavy container styles, added padding/margin
    <div className="data-toggle mb-3">
      <h3 className="font-medium text-sm text-gray-800 mb-2">Data Acquisition:</h3>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => handleMethodChange('experiment')}
          className={getButtonClasses('experiment')}
        >
          <div className="flex items-center justify-center">
            New Experiment
          </div>
        </button>

        <button
          onClick={() => handleMethodChange('existingdata')}
          className={getButtonClasses('existingdata')}
        >
          <div className="flex items-center justify-center">
            Existing Data
          </div>
        </button>

        <button
          onClick={() => handleMethodChange('theorysimulation')}
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
