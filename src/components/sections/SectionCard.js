// FILE: src/components/sections/SectionCard.js

import React, { useState, useEffect, useRef } from 'react';
import { getSectionMinimizedState, setSectionMinimizedState } from '../../services/sectionStateService';

/**
 * Enhanced section card component with rating-based feedback
 * - Added edit-after-feedback tracking to update button label
 * - Uses green text for completed items instead of strikethrough
 * - UPDATED: Now listens for global reset events
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
  onRequestFeedback,
  hasFeedback,
  feedbackRating, // Feedback rating (1-10)
  lastFeedbackTime = 0 // Prop for tracking when feedback was last received
}) => {
  const textareaRef = useRef(null);
  
  // Get the actual value stored in userInputs
  const textValue = userInputs[section.id] || '';
  
  // Check if the content is just the placeholder or hasn't been edited
  const isPlaceholder = textValue === (section.placeholder || '');
  const isDefaultContent = textValue.trim() === '';

  // Determine if the content has been meaningfully edited - must be different from placeholder
  // AND have actual content
  const hasEditedContent = !isPlaceholder && !isDefaultContent;

  // Track user edits for improvement reminder
  const [lastEditTimestamp, setLastEditTimestamp] = useState(null);
  const [significantChange, setSignificantChange] = useState(false);
  
  // Track if content was edited since last feedback
  const [editedSinceFeedback, setEditedSinceFeedback] = useState(false);
  
  // Update editedSinceFeedback when appropriate
  useEffect(() => {
    if (lastEditTimestamp && lastFeedbackTime && lastEditTimestamp > lastFeedbackTime) {
      setEditedSinceFeedback(true);
    } else if (!lastEditTimestamp || !lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastEditTimestamp, lastFeedbackTime]);
  
  // Reset editedSinceFeedback when new feedback is received
  useEffect(() => {
    if (lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastFeedbackTime]);
  
  // Listen for global reset events to clear local state
  useEffect(() => {
    const handleProjectReset = () => {
      console.log(`[SectionCard ${section.id}] Resetting local state due to global reset event`);
      setLastEditTimestamp(null);
      setSignificantChange(false);
      setEditedSinceFeedback(false);
    };
    
    const handleProjectDataLoaded = () => {
      console.log(`[SectionCard ${section.id}] Resetting local state due to project data load`);
      setLastEditTimestamp(null);
      setSignificantChange(false);
      setEditedSinceFeedback(false);
    };
    
    const handleDocumentImported = () => {
      console.log(`[SectionCard ${section.id}] Resetting local state due to document import`);
      setLastEditTimestamp(null);
      setSignificantChange(false);
      setEditedSinceFeedback(false);
    };
    
    // Listen for various events that should trigger a reset
    window.addEventListener('projectStateReset', handleProjectReset);
    window.addEventListener('projectDataLoaded', handleProjectDataLoaded);
    window.addEventListener('documentImported', handleDocumentImported);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('projectStateReset', handleProjectReset);
      window.removeEventListener('projectDataLoaded', handleProjectDataLoaded);
      window.removeEventListener('documentImported', handleDocumentImported);
    };
  }, [section.id]);
  
  // State to track focus and hover for edit indication
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // State for minimized/expanded cards with localStorage persistence
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load initial state from localStorage if available
    return getSectionMinimizedState(section.id);
  });

  // Listen for global section state changes
  useEffect(() => {
    // This ensures the component refreshes when section states are updated globally
    const handleSectionStatesChanged = (e) => {
      // If this is a specific section event and it matches this section
      if (e?.detail?.sectionId === section.id) {
        setIsMinimized(e.detail.isMinimized);
      } 
      // Otherwise check if it's a global change
      else {
        // Check if state has changed and update if needed
        const newState = getSectionMinimizedState(section.id);
        if (newState !== isMinimized) {
          setIsMinimized(newState);
        }
      }
    };
    
    // Listen for a custom event that might be dispatched when all sections change
    window.addEventListener('sectionStatesChanged', handleSectionStatesChanged);
    
    return () => {
      window.removeEventListener('sectionStatesChanged', handleSectionStatesChanged);
    };
  }, [section.id, isMinimized]);

  // Auto-resize textarea height - improved version
  const adjustTextareaHeight = () => {
    if (textareaRef.current && !isMinimized) {
      // Reset height to auto first to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Then set to scrollHeight to fit content exactly
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Adjust on initial render and when text changes
  useEffect(() => {
    if (!isMinimized) {
      adjustTextareaHeight();
    }
  }, [textValue, isMinimized]);

  // Adjust after the component has fully mounted to handle initial content
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (!isMinimized) {
        adjustTextareaHeight();
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [isMinimized]);

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
    // Always prioritize the current section highlighting
    if (isCurrentSection) {
      return 'bg-blue-50'; // Keep the blue highlighting for current section
    }
    
    // For non-current sections, return white
    return 'bg-white';
  };

  // Calculate max height for minimized cards
  const getMaxHeight = () => {
    if (isMinimized) {
      return 'max-h-14'; // Maximum height for minimized cards
    }
    return 'max-h-[2000px]'; // Effectively no maximum height for expanded cards
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
    ${isMinimized ? 'minimized' : 'expanded'}
    ${getMaxHeight()}
    overflow-hidden
    relative
    ${isCurrentSection ? 'current-active' : ''}
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
    
    // Set editedSinceFeedback flag if we have previous feedback
    if (hasFeedback && lastFeedbackTime) {
      setEditedSinceFeedback(true);
    }
    
    // Ensure height adjustment occurs after state update
    setTimeout(adjustTextareaHeight, 0);
  };

  // Visual cue styling for the textarea
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

  // Calculate preview text for minimized view
  const getPreviewText = () => {
    if (!textValue || textValue.trim() === '') {
      return 'No content yet...';
    }
    
    // Get the first non-empty line
    const firstLine = textValue.split('\n').find(line => line.trim() !== '') || '';
    if (firstLine.length > 50) {
      return firstLine.substring(0, 50) + '...';
    }
    return firstLine;
  };

  // Toggle minimized state with persistence
  const toggleMinimized = (e) => {
    e.stopPropagation(); // Prevent section selection when toggling
    const newState = !isMinimized;
    setIsMinimized(newState);
    
    // Save state to localStorage
    setSectionMinimizedState(section.id, newState);
  };

  // Function to get the color based on the rating
  const getFeedbackButtonColor = () => {
    if (!hasEditedContent) return 'bg-gray-400 text-white cursor-not-allowed'; // Gray when content not edited
    if (loading) return 'bg-purple-300 text-white cursor-wait'; // Light purple when loading
    
    // Default state (not yet rated)
    if (!feedbackRating) return 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer';
    
    // Color based on rating (1=red, 10=green)
    if (feedbackRating <= 3) return 'bg-red-500 text-white hover:bg-red-600';
    if (feedbackRating <= 5) return 'bg-orange-500 text-white hover:bg-orange-600';
    if (feedbackRating <= 7) return 'bg-yellow-500 text-white hover:bg-yellow-600';
    if (feedbackRating <= 9) return 'bg-lime-500 text-white hover:bg-lime-600';
    return 'bg-green-600 text-white hover:bg-green-700'; // Use our standard green-600 color
  };

  // Function to get a descriptive label based on the rating
  const getFeedbackLabel = () => {
    if (!hasEditedContent) return "Add content first";
    if (loading) return "Processing...";
    
    // If not rated yet or edited after feedback, show default prompt
    if (!hasFeedback) return "Ready for feedback";
    
    // If edited since feedback, show "New feedback" instead of rating
    if (editedSinceFeedback) return "Get new feedback";
    
    // Otherwise show the rating with descriptive text
    if (!feedbackRating) return "Get new feedback";
    
    if (feedbackRating <= 3) return `Needs work (${feedbackRating}/10)`;
    if (feedbackRating <= 5) return `Average (${feedbackRating}/10)`;
    if (feedbackRating <= 7) return `Good (${feedbackRating}/10)`;
    if (feedbackRating <= 9) return `Very good (${feedbackRating}/10)`;
    return `Excellent (${feedbackRating}/10)`;
  };

  // Get indicator color for minimized cards
  const getMinimizedIndicatorColor = () => {
    if (!hasFeedback || !feedbackRating) return 'bg-gray-300';
    
    if (feedbackRating <= 3) return 'bg-red-500';
    if (feedbackRating <= 5) return 'bg-orange-500';
    if (feedbackRating <= 7) return 'bg-yellow-500';
    if (feedbackRating <= 9) return 'bg-lime-500';
    return 'bg-green-600'; // Use our standard green-600 color
  };

  // Handle feedback button click
  const handleFeedbackRequest = (e) => {
    e.stopPropagation(); // Prevent other actions
    
    // Only allow feedback if the content has been edited
    if (hasEditedContent && onRequestFeedback && typeof onRequestFeedback === 'function') {
      onRequestFeedback(section.id);
    }
  };

  // Modified click handler that handles both selection and toggle based on the click target
  const handleCardClick = (e) => {
    // Let's find out if the click was on the header or toggle button
    const header = e.currentTarget.querySelector('.section-header');
    
    // Check if the click was inside the header area (excluding the toggle button)
    const isHeaderClick = header && header.contains(e.target) && 
                         !e.target.closest('.minimize-toggle-btn') &&
                         !e.target.closest('.feedback-button');
    
    if (isHeaderClick) {
      // If clicked on the header, toggle minimized state
      toggleMinimized(e);
    } else if (!isMinimized) {
      // If expanded and clicked elsewhere (not header or toggle), use the normal onClick behavior
      // This allows selection without toggling when clicking in the content area
      onClick(e);
    } else {
      // If minimized and clicked anywhere on the card (except toggle button),
      // expand the card first
      toggleMinimized(e);
    }
  };

  return (
    <div
      ref={sectionRef}
      className={sectionClasses}
      onClick={handleCardClick}
    >
      {/* Header with Title, Rating Indicator (if minimized), and Toggle button */}
      <div className="flex justify-between items-center mb-1 section-header">
        <div className="flex items-center">
          <h2 className="font-semibold text-lg mr-2 text-gray-800" style={{ fontSize: 'calc(1.4 * 1rem)' }}>
            {section.title}
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
          
          {/* Toggle button for minimizing/expanding */}
          <button 
            onClick={toggleMinimized}
            className="minimize-toggle-btn text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isMinimized ? "Expand section" : "Minimize section"}
            title={isMinimized ? "Expand section" : "Minimize section"}
          >
            {isMinimized ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Preview text for minimized state */}
      {isMinimized && (
        <div className="text-sm text-gray-500 overflow-hidden whitespace-nowrap overflow-ellipsis">
          {getPreviewText()}
        </div>
      )}

      {/* Input Area - Only show when not minimized */}
      {!isMinimized && (
        <div 
          className="relative"
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
          />
          
          {/* Feedback Button - only show for expanded cards */}
          {!isMinimized && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleFeedbackRequest}
                disabled={loading || !hasEditedContent}
                className={`
                  feedback-button text-sm font-medium
                  px-3 py-1.5 rounded
                  flex items-center
                  transition-colors
                  ${getFeedbackButtonColor()}
                `}
                title={hasEditedContent ? 
                       (editedSinceFeedback ? "Content changed since last feedback" : "Get AI feedback on this section") : 
                       "Add content before requesting feedback"}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getFeedbackLabel()}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Fade gradient at bottom of minimized cards */}
      {isMinimized && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-200 to-transparent"></div>
      )}
      
      {/* Custom styles for edit mode indicators and minimized states */}
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
        
        /* Styles for minimized cards */
        .section-card.minimized {
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        /* Make sure current section styling always takes precedence */
        .section-card.current-active {
          background-color: #eff6ff !important; /* bg-blue-50 with !important */
        }
        
        /* Update minimized card hover to respect active section */
        .section-card.minimized:hover:not(.current-active) {
          background-color: #f8fafc !important; /* slate-50 */
        }
        
        .section-card.minimized.current-active:hover {
          background-color: #dbeafe !important; /* blue-100 for hover state of active section */
        }
        
        .minimize-toggle-btn {
          z-index: 10;
          transition: all 0.2s ease;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .minimize-toggle-btn:hover {
          background-color: #f1f5f9; /* slate-100 */
          border-radius: 50%;
        }
        
        /* Style for header to indicate clickability */
        .section-header {
          cursor: pointer;
          position: relative;
        }
        
        /* Add subtle hover effect to the header */
        .section-header:hover::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          bottom: -4px;
          left: -4px;
          background-color: rgba(0, 0, 0, 0.02);
          z-index: -1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default SectionCard;
