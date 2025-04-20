import React, { useState, useEffect, useRef } from 'react';
import { getSectionMinimizedState, setSectionMinimizedState } from '../../services/sectionStateService';

/**
 * Enhanced section card component with minimization capabilities
 * - Minimization toggle with smooth animations and clear visual indication
 * - Persistence of minimized states between sessions
 * - Responds to global state changes
 * - Different defaults for new projects vs examples
 * - FIXED: Properly maintains blue highlighting for active sections
 * - IMPROVED: Toggle minimization on header click
 * - IMPROVED: Different icons for minimize vs expand states
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
  onSignificantEdit
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
  
  // State for minimized/expanded cards with localStorage persistence
  // New projects start minimized, examples start expanded
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load initial state from localStorage if available
    return getSectionMinimizedState(section.id);
  });

  // Listen for global section state changes
  useEffect(() => {
    // This ensures the component refreshes when section states are updated globally
    const handler = () => {
      // Check if state has changed and update if needed
      const newState = getSectionMinimizedState(section.id);
      if (newState !== isMinimized) {
        setIsMinimized(newState);
      }
    };
    
    // Listen for a custom event that might be dispatched when all sections change
    window.addEventListener('sectionStatesChanged', handler);
    
    return () => {
      window.removeEventListener('sectionStatesChanged', handler);
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

  // Modified click handler that handles both selection and toggle based on the click target
  const handleCardClick = (e) => {
    // Let's find out if the click was on the header or toggle button
    const header = e.currentTarget.querySelector('.section-header');
    
    // Check if the click was inside the header area (excluding the toggle button)
    const isHeaderClick = header && header.contains(e.target) && 
                         !e.target.closest('.minimize-toggle-btn');
    
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
      {/* Header with Title and Toggle button */}
      <div className="flex justify-between items-center mb-1 section-header">
        <h2 className="font-semibold text-lg mr-2 text-gray-800" style={{ fontSize: 'calc(1.4 * 1rem)' }}>
          {section.title}
        </h2>
        
        <div className="flex items-center">
          {/* Edit indicator icon */}
          <div className={`edit-icon transition-opacity duration-200 mr-2 ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          
          {/* Toggle button for minimizing/expanding with different icons based on state */}
          <button 
            onClick={toggleMinimized}
            className="minimize-toggle-btn text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isMinimized ? "Expand section" : "Minimize section"}
            title={isMinimized ? "Expand section" : "Minimize section"}
          >
            {isMinimized ? (
              /* Expand icon (down arrow) */
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transition-transform duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              /* Minimize icon (up arrow) */
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transition-transform duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
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

      {/* Input Area - Enhanced with visual cues - Only show when not minimized */}
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
