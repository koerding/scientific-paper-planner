// FILE: src/components/controls/SectionControls.js

import React from 'react';
import { toggleAllSections } from '../../services/sectionStateService';

/**
 * Controls for managing section minimization state
 * Provides buttons to expand or collapse all sections
 */
const SectionControls = ({ sectionIds = [], onStateChange = () => {} }) => {
  // Expand all sections
  const handleExpandAll = () => {
    toggleAllSections(false, sectionIds); // false = not minimized, i.e., expanded
    onStateChange();
  };

  // Collapse all sections
  const handleCollapseAll = () => {
    toggleAllSections(true, sectionIds); // true = minimized
    onStateChange();
  };

  return (
    <div className="flex items-center justify-end mb-3 text-sm">
      <div className="text-gray-600 mr-2">Sections:</div>
      <button
        onClick={handleExpandAll}
        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-l border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        title="Expand all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span className="ml-1">Expand All</span>
      </button>
      <button
        onClick={handleCollapseAll}
        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-r border border-gray-300 border-l-0 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        title="Collapse all sections"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="ml-1">Collapse All</span>
      </button>
    </div>
  );
};

export default SectionControls;
