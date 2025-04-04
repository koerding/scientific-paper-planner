import React from 'react';

/**
 * Toggle component for selecting research approach
 */
const ResearchApproachToggle = ({ activeApproach, setActiveApproach }) => {
  return (
    <div className="approach-toggle mb-2 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="font-medium text-lg text-gray-800 mb-3">Choose Your Research Approach:</h3>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveApproach('hypothesis')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow 
            ${activeApproach === 'hypothesis' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hypothesis Testing
          </div>
        </button>
        
        <button
          onClick={() => setActiveApproach('needsresearch')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow
            ${activeApproach === 'needsresearch' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Needs-Based Research
          </div>
        </button>
        
        <button
          onClick={() => setActiveApproach('exploratoryresearch')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-grow
            ${activeApproach === 'exploratoryresearch' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Exploratory Research
          </div>
        </button>
      </div>
    </div>
  );
};

export default ResearchApproachToggle;
