// FILE: src/components/sections/ToggleHeader.js
import React from 'react';

/**
 * A component that displays toggle options within a section header
 * UPDATED: Removed minimization and added guide mode switch icon
 */
const ToggleHeader = ({
  options,
  activeOption,
  onToggle,
  isMinimized, // Keeping this for future use but not using currently
  isHovered,
  isFocused,
  toggleMinimized, // Keeping this for future use but not using currently
  onSwitchToGuide // New prop for switching to guide mode
}) => {
  return (
    <div className="flex flex-col mb-1">      
      {/* Toggle button header */}
      <div className="flex justify-between items-center section-header">
        <div className="flex items-center flex-grow">
          <div className="flex space-x-1 in-card-toggle w-full">
            {options.map(option => (
              <button
                key={option.id}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card expansion/collapse
                  onToggle(option.id);
                }}
                className={`font-semibold py-1 px-2 rounded-md transition-colors flex-1 ${
                  // Enhanced visual distinction between active and inactive
                  activeOption === option.id
                    ? 'text-black bg-white border-2 border-blue-500 shadow-sm active-toggle'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 inactive-toggle'
                }`}
                style={{ fontSize: 'calc(1.2 * 1rem)' }} // Slightly smaller for better fit
                aria-pressed={activeOption === option.id} // Accessibility: indicate if pressed
                title={activeOption === option.id ? `${option.label} (Selected)` : option.label}
              >
                {/* Add visual indicator for selected state */}
                {activeOption === option.id && (
                  <span className="mr-1 text-blue-500">•</span>
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center ml-2">
          {/* New Guide Mode Button - using 💡▶ */}
          <button 
            onClick={onSwitchToGuide}
            className="guide-button text-purple-600 hover:text-purple-800 focus:outline-none ml-2 transition-colors"
            aria-label="Switch to Guide mode"
            title="Switch to Guide mode"
          >
            <span className="text-xl">💡▶</span>
          </button>

          {/* The toggle minimize button is kept in the code but hidden with CSS */}
          <button
            onClick={toggleMinimized}
            className="minimize-toggle-btn hidden"
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
    </div>
  );
};

export default ToggleHeader;
