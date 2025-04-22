// src/components/sections/SectionHeader.js
import React from 'react';

const SectionHeader = ({ 
  title, 
  isMinimized, 
  hasFeedback, 
  feedbackRating, 
  editedSinceFeedback, 
  isHovered, 
  isFocused,
  toggleMinimized 
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
        
        {/* Rating indicator dot for minimized cards */}
        {isMinimized && hasFeedback && feedbackRating && (
          <div 
            className={`w-3 h-3 rounded-full ml-1 ${getMinimizedIndicatorColor()}`} 
            title={`Rated ${feedbackRating}/10`}
          ></div>
        )}
        
        {/* Show edited indicator if content changed since last feedback */}
        {isMinimized && editedSinceFeedback && (
          <div className="ml-1 text-xs text-purple-600 font-medium">
            (edited)
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        {/* Edit indicator icon */}
        <div className={`edit-icon transition-opacity duration-200 mr-2 ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
        
        {/* Toggle button */}
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

export default SectionHeader;
