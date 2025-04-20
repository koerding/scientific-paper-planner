// FILE: src/components/controls/SectionControls.js

import React from 'react';
import { toggleAllSections } from '../../services/sectionStateService';

/**
 * Section controls component for bulk expand/collapse functions
 * - Allows users to expand or collapse all sections at once
 */
const SectionControls = ({ sectionIds, onStateChange }) => {
  // Handle expanding all sections
  const handleExpandAll = () => {
    toggleAllSections(false, sectionIds); // false = not minimized
    if (onStateChange) onStateChange();
  };
  
  // Handle minimizing all sections
  const handleMinimizeAll = () => {
    toggleAllSections(true, sectionIds); // true = minimized
    if (onStateChange) onStateChange();
  };
  
  return (
    <div className="flex justify-end mb-2 space-x-2">
      <button
        onClick={handleExpandAll}
        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-1 rounded flex items-center"
        title="Expand all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
        Expand All
      </button>
      
      <button
        onClick={handleMinimizeAll}
        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-1 rounded flex items-center"
        title="Minimize all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Minimize All
      </button>
    </div>
  );
};

export default SectionControls;
