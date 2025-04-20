// Updated implementation for SectionCard to use the "Complete & Get Feedback" button
// Keep the existing imports and component structure, but add these features

import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Section card component with feedback button
 */
const SectionCard = ({
  section,
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

  // Track user edits for improvement reminder
  const [lastEditTimestamp, setLastEditTimestamp] = useState(null);
  const [significantChange, setSignificantChange] = useState(false);
  
  // State to track focus and hover for edit indication
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-resize textarea height - improved version
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset height to auto first to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Then set to scrollHeight to fit content exactly
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Adjust on initial render and when text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [textValue]);

  // Adjust after the component has fully mounted to handle initial content
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      adjustTextareaHeight();
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Determine border class for the current selection only
  const getBorderClasses = () => {
    // Current section gets blue focus border
    if (isCurrentSection) {
      return 'border-4 border-blue-500 shadow-md';
    }
    
    // Other sections get a neutral gray border
    return 'border-2 border-gray-300';
  };

  // Determine background color for the card and textarea
  const getBackgroundColor = () => {
    return isCurrentSection ? 'bg-blue-50' : 'bg-white';
  };

  // Combine all the classes
  const sectionClasses = `
    section-card 
    rounded-md 
    ${getBackgroundColor()}
    p-2
    mb-2
    transition-all 
    duration-300 
    ease-in-out 
    ${getBorderClasses()}
    relative
  `;

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

  // Visual cue styling for the textarea - NEW
  const getTextareaClasses = () => {
    const baseClasses = `w-full py-1 px-2 border-0 rounded focus:ring-1 focus:ring-blue-300 outline-none resize-none overflow-hidden text-base leading-relaxed ${getBackgroundColor()} font-normal`;
    
    // Add visual cues for editing
    if (isFocused) {
      return `${baseClasses} edit-mode-focused`;
    } else if (isHovered) {
      return `${baseClasses} edit-mode-hover`;
    }
    
    return baseClasses;
  };

  return (
    <div
      ref={sectionRef}
      className={sectionClasses}
      onClick={onClick}
    >
      {/* Header with Title only - removed status indicator */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="font-semibold text-lg mr-2 text-gray-800" style={{ fontSize: 'calc(1.4 * 1rem)' }}>
          {section.title}
        </h2>
        
        {/* Status indicator (if has feedback) */}
        {feedbackStatus !== 'none' && (
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${
              feedbackStatus === 'good' ? 'bg-green-600' :
              feedbackStatus === 'fair' ? 'bg-yellow-500' :
              feedbackStatus === 'poor' ? 'bg-red-600' : 'bg-gray-400'
            }`} 
            title={`Status: ${feedbackStatus}`}
          />
        )}
        
        {/* NEW: Edit indicator icon */}
        <div className={`edit-icon transition-opacity duration-200 ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
      </div>

      {/* Input Area - Enhanced with visual cues */}
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Visual edit indicator for empty textareas - NEW */}
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
            cursor: 'text', // Always show text cursor to indicate editability
            paddingBottom: '40px' // Make room for the feedback button
          }}
        />
        
        {/* Feedback button - NEW */}
        <div className="absolute bottom-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent click from activating section
              if (onGetFeedback) onGetFeedback(section.id);
            }}
            disabled={loading}
            className={`px-3 py-1 rounded-md ${getStatusColorClasses()} transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            } text-sm`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      
      {/* NEW: Custom styles for edit mode indicators */}
      <style jsx>{`
        .edit-mode-hover {
          background-color: #f9fafb !important; /* gray-50 */
          box-shadow: inset 0 0 0 1px #e5e7eb; /* gray-200 */
        }
        
        .edit-mode-focused {
          background-color: #ffffff !important;
          box-shadow: inset 0 0 0 2px #93c5fd; /* blue-300 */
        }
        
        .edit-icon {
          margin-left: auto;
        }
        
        textarea::placeholder {
          color: #9ca3af; /* gray-400 */
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default SectionCard;
