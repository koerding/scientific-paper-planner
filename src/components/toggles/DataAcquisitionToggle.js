// FILE: src/components/toggles/DataAcquisitionToggle.js
import React from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store

const DataAcquisitionToggle = ({ activeMethod, setActiveMethod }) => {
  // No need to select state from store here if parent (LeftPanel) handles it

  const getButtonClasses = (method) => `
    px-3 py-1 rounded-md text-sm font-medium transition-colors flex-1
    ${activeMethod === method
      ? 'active font-semibold text-indigo-600 bg-indigo-100'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }
  `;

  // Use the setActiveMethod function passed from the parent (which calls the store action)
  const handleMethodChange = (method) => {
    if (setActiveMethod && typeof setActiveMethod === 'function') {
      setActiveMethod(method);
    }
  };

  return (
    <div className="data-toggle mb-3">
      <h3 className="font-medium text-sm text-gray-800 mb-2">Data Acquisition:</h3>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => handleMethodChange('experiment')}
          className={getButtonClasses('experiment')}
        >
          New Experiment
        </button>
        <button
          onClick={() => handleMethodChange('existingdata')}
          className={getButtonClasses('existingdata')}
        >
          Existing Data
        </button>
        <button
          onClick={() => handleMethodChange('theorysimulation')}
          className={getButtonClasses('theorysimulation')}
        >
          Theory/Simulation
        </button>
      </div>
    </div>
  );
};

export default DataAcquisitionToggle;
