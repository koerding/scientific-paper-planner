import React from 'react';

/**
 * Toggle component for selecting data acquisition method
 * UPDATED: Made styling more subtle
 */
const DataAcquisitionToggle = ({ activeMethod, setActiveMethod }) => {
  // Helper to generate button classes
  const getButtonClasses = (method) => `
    px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1
    ${activeMethod === method
      ? 'active font-semibold text-indigo-600 bg-indigo-100' // Subtle active style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Subtle default/hover
    }
  `;

  return (
    // Removed heavy container styles, added padding/margin
    <div className="data-toggle mb-4 pt-2">
      <h3 className="font-medium text-lg text-gray-800 mb-3">Choose Data Acquisition Method:</h3>

      <div className="flex gap-3">
        <button
          onClick={() => setActiveMethod('experiment')}
          className={getButtonClasses('experiment')}
        >
          <div className="flex items-center justify-center">
            {/* Icon can remain or be removed for more subtlety */}
            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg> */}
            New Experiment
          </div>
        </button>

        <button
          onClick={() => setActiveMethod('existingdata')}
          className={getButtonClasses('existingdata')}
        >
          <div className="flex items-center justify-center">
            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg> */}
            Existing Data
          </div>
        </button>
      </div>
    </div>
  );
};

export default DataAcquisitionToggle;
