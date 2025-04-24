// FILE: src/components/sections/ToggleHeader.js
import React from 'react';

/**
 * A component that displays toggle options within a section header
 * Replaces the traditional section header title with toggle options
 * UPDATED: Font size now matches other section cards
 * UPDATED: Active option is now black to match other section headers
 */
const ToggleHeader = ({ 
  options, 
  activeOption, 
  onToggle, 
  isMinimized,
  isHovered,
  isFocused,
  toggleMinimized
}) => {
  return (
    <div className="flex justify-between items-center mb-1 section-header">
      <div className="flex items-center">
        <div className="flex space-x-1 in-card-toggle">
          {options.map(option => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card expansion/collapse
                onToggle(option.id);
              }}
              className={`font-semibold text-lg py-1 px-2 rounded-md transition-colors ${
                activeOption === option.id
                  ? 'text-gray-800 bg-white'
                  : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
              }`}
              style={{ fontSize: 'calc(1.4 * 1rem)' }} // Match the font size of other card headers
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center">
        {/* Edit indicator icon - same as in SectionHeader */}
        <div className={`edit-icon transition-opacity duration-200 mr-2 ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
        
        {/* Toggle button - same as in SectionHeader */}
        <button 
          onClick={toggleMinimized}
          className="minimize-toggle-btn text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={isMinimized ? "Expand section" : "Minimize section"}
          title={isMinimized ? "Expand section" : "Minimize section"}
        >
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ToggleHeader;
