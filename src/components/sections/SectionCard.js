// FILE: src/components/sections/SectionCard.js

import React, { useState, useEffect, useRef } from 'react';

/**
 * Updated Section card component with expandable/collapsible functionality
 * and feedback status indicators
 */
const SectionCard = ({
  section,
  isExpanded = false,
  onToggleExpand,
  isCurrentSection,
  userInputs,
  handleInputChange,
  loading,
  sectionRef,
  onClick,
  onEdit,
  onSignificantEdit,
  feedbackStatus = 'none',
  onGetFeedback
}) => {
  const textareaRef = useRef(null);
  
  // Get the actual value stored in userInputs
  const textValue = userInputs[section.id] || '';

  // State to track user edits for improvement reminder
  const [lastEditTimestamp, setLastEditTimestamp] = useState(null);
  const [significantChange, setSignificantChange] = useState(false);
  
  // State to track focus and hover for edit indication
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle clicks directly to ensure both header and text work
  const handleComponentClick = () => {
    console.log("SectionCard click handler for section:", section.id);
    // Make sure we call both expansion toggle and active section update
    if (onClick) onClick(); // Update active section
  };

  // Auto-resize textarea height - improved version
  const adjustTextareaHeight = () => {
    if (textareaRef.current && isExpanded) {
      // Reset height to auto first to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Then set to scrollHeight to fit content exactly
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Adjust on initial render and when text changes
  useEffect(() => {
    if (isExpanded) {
      adjustTextareaHeight();
    }
  }, [textValue, isExpanded]);

  // Adjust after the component has fully mounted to handle initial content
  useEffect(() => {
    if (isExpanded) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        adjustTextareaHeight();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle input change and resize, with tracking for improvement reminder
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const currentValue = textValue;
    
    // Call the parent's input change handler
    handleInputChange(section.id, newValue);
    
    // Track edit timestamp for significant changes
    const now = Date.now();
    
    // Determine if this is a significant change (e.g., added/removed more than 15 chars)
    if (Math.abs(newValue.length - currentValue.length) > 15) {
      setLastEditTimestamp(now);
      setSignificantChange(true);
      
      // Emit significant edit event to parent component
      if (typeof onSignificantEdit === 'function') {
        onSignificantEdit(section.id, now);
      }
    }
    // Update timestamp periodically even for smaller changes
    else if (!lastEditTimestamp || (now - lastEditTimestamp) > 30000) { // 30 seconds
      setLastEditTimestamp(now);
      
      // Emit regular edit event to parent component
      if (typeof onEdit === 'function') {
        onEdit(section.id, now);
      }
    }
    
    // Ensure height adjustment occurs after state update
    setTimeout(adjustTextareaHeight, 0);
  };

  // Get status color classes for feedback button
  const getStatusColorClasses = () => {
    switch(feedbackStatus) {
      case 'good': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'fair': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'poor': return 'bg-red-600 hover:bg-red-700 text-white';
      default: return 'bg-purple-600 hover:bg-purple-700 text-white';
    }
  };

  // Get status indicator classes for minimized card
  const getStatusIndicatorClasses = () => {
    switch(feedbackStatus) {
      case 'good': return 'bg-green-600';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-600';
      case 'none': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Visual cue styling for the textarea - NEW
  const getTextareaClasses = () => {
    const baseClasses = `w-full py-1 px-2 border-0 rounded focus:ring-1 focus:ring-blue-300 outline-none resize-none overflow-hidden text-base leading-relaxed ${isCurrentSection ? 'bg-blue-50' : 'bg-white'} font-normal`;
    
    // Add visual cues for editing
    if (isFocused) {
      return `${baseClasses} edit-mode-focused`;
    } else if (isHovered) {
      return `${baseClasses} edit-mode-hover`;
    }
    
    return baseClasses;
  };

  // Different rendering based on expanded/collapsed state
  return (
    <div
      ref={sectionRef}
      className={`section-card rounded-md mb-2 transition-all duration-300 ease-in-out ${
        isExpanded ? 'border-2 border-blue-500 bg-white expanded shadow-md' : 'border-2 border-gray-300 bg-gray-50 minimized'
      }`}
    >
      {/* Header (always visible) */}
      <div 
        className="flex justify-between items-center p-3 cursor-pointer"
        onClick={() => {
          // When header is clicked, both toggle expansion and set as active section
          console.log("Section header clicked:", section.id, section.title);
          onToggleExpand();
          handleComponentClick(); // This now calls onClick to update active section
        }}
      >
        <h2 className="font-semibold text-lg mr-2 text-gray-800">
          {section.title}
        </h2>
        
        <div className="flex items-center">
          {/* Status indicator (if not expanded and has feedback) */}
          {!isExpanded && feedbackStatus !== 'none' && (
            <div 
              className={`w-3 h-3 rounded-full mr-2 ${getStatusIndicatorClasses()}`} 
              title={`Status: ${feedbackStatus}`}
            />
          )}
          
          {/* Expand/collapse indicator */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Content area (only visible when expanded) */}
      {isExpanded && (
        <div className="px-3 pb-4">
          {/* Input Area - Enhanced with visual cues */}
          <div 
            className="relative mb-12"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Visual edit indicator for empty textareas */}
            {textValue.trim() === '' && !isFocused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm italic">
                Click to edit...
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              className={getTextareaClasses()}
              value={textValue}
              onChange={handleTextChange}
              onInput={adjustTextareaHeight}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows="1"
              maxLength={section.maxLength}
              placeholder={section.inputPlaceholder || "Start writing..."}
              style={{ 
                minHeight: '2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                cursor: 'text' // Always show text cursor to indicate editability
              }}
              disabled={loading}
            />
          </div>
          
          {/* Feedback button */}
          <div className="flex justify-end absolute bottom-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering section click
                onGetFeedback(section.id);
              }}
              disabled={loading}
              className={`px-4 py-2 rounded-md ${getStatusColorClasses()} transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                feedbackStatus === 'none' ? 'Complete & Get Feedback' : 'Re-review'
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Custom styles for expand/collapse transitions */}
      <style jsx>{`
        .section-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .section-card.minimized {
          max-height: 60px;
        }

        .section-card.expanded {
          max-height: 2000px; /* Large value to accommodate any content size */
        }

        .section-card.minimized:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default SectionCard;
