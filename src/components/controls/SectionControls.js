import React from 'react';
import { setAllSectionStates } from '../../services/sectionStateService';

/**
 * Controls for expanding/minimizing all sections at once
 * Provides expand all and collapse all functionality
 * Dispatches events to notify section components of changes
 */
const SectionControls = ({ sectionIds, onStateChange }) => {
  // Expand all sections
  const expandAll = () => {
    setAllSectionStates(false, sectionIds);
    
    // Dispatch custom event to notify section cards
    const event = new CustomEvent('sectionStatesChanged', { 
      detail: { minimized: false } 
    });
    window.dispatchEvent(event);
    
    if (onStateChange) {
      onStateChange(false);
    }
  };
  
  // Minimize all sections
  const minimizeAll = () => {
    setAllSectionStates(true, sectionIds);
    
    // Dispatch custom event to notify section cards
    const event = new CustomEvent('sectionStatesChanged', { 
      detail: { minimized: true } 
    });
    window.dispatchEvent(event);
    
    if (onStateChange) {
      onStateChange(true);
    }
  };
  
  return (
    <div className="flex justify-end mb-2 space-x-2">
      <button
        onClick={expandAll}
        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
        title="Expand all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Expand All
      </button>
      <button
        onClick={minimizeAll}
        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
        title="Minimize all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Collapse All
      </button>
    </div>
  );
};

export default SectionControls;
