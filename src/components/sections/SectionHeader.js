// src/components/sections/SectionHeader.js
import React from 'react';

const SectionHeader = ({ 
  title, 
  isMinimized, // Keeping this for future use but not using currently
  hasFeedback, 
  feedbackRating, 
  editedSinceFeedback, 
  isHovered, 
  isFocused,
  toggleMinimized, // Keeping this for future use but not using currently
  onSwitchToGuide // New prop for switching to guide mode
}) => {
  const getMinimizedIndicatorColor = () => {
    if (!hasFeedback || !feedbackRating) return 'bg-gray-300';
    
    if (feedbackRating <= 3) return 'bg-red-500';
    if (feedbackRating <= 5) return 'bg-orange-500';
    if (feedbackRating <= 7) return 'bg-yellow-500';
    if (feedbackRating <= 9) return 'bg-lime-500';
    return 'bg-green-600';
  };

  return (
    <div className="flex justify-between items-center mb-1 section-header">
      <div className="flex items-center">
        <h2 className="font-semibold text-lg mr-2 text-gray-800" style={{ fontSize: 'calc(1.4 * 1rem)' }}>
          {title}
        </h2>
        
        {/* Rating indicator dot */}
        {hasFeedback && feedbackRating && (
          <div 
            className={`w-3 h-3 rounded-full ml-1 ${getMinimizedIndicatorColor()}`} 
            title={`Rated ${feedbackRating}/10`}
          ></div>
        )}
        
        {/* Show edited indicator if content changed since last feedback */}
        {editedSinceFeedback && (
          <div className="ml-1 text-xs text-purple-600 font-medium">
            (edited)
          </div>
        )}
      </div>
      
      <div className="flex items-center">
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
  );
};

export default SectionHeader;
