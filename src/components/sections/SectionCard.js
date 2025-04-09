import React, { useState, useEffect, useRef } from 'react';

/**
 * Section card component for the paper planner
 * UPDATED: Removed color-coding based on completion status
 * UPDATED: Removed "complete/incomplete" status labels
 * UPDATED: Simplified box design with neutral colors
 * FIXED: Made the inner textbox seamless and reduced padding throughout
 * FIXED: Consistent font styles with right panel (instruction panel)
 * FIXED: Increased section title size by 40% as requested
 * FIXED: Properly resize textarea based on content
 */
const SectionCard = ({
  section,
  isCurrentSection,
  completionStatus = 'unstarted',
  userInputs,
  handleInputChange,
  loading,
  sectionRef,
  onClick,
  useLargerFonts = false
}) => {
  const textareaRef = useRef(null);
  
  // Get the actual value stored in userInputs
  const textValue = userInputs[section.id] || '';

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
  `;

  // Handle input change and resize
  const handleTextChange = (e) => {
    handleInputChange(section.id, e.target.value);
    // Ensure height adjustment occurs after state update
    setTimeout(adjustTextareaHeight, 0);
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
      </div>

      {/* Input Area - Simplified with matching background and reduced padding */}
      <div>
        <textarea
          ref={textareaRef}
          className={`w-full py-1 px-2 border-0 rounded focus:ring-1 focus:ring-blue-300 outline-none resize-none overflow-hidden text-base leading-relaxed ${getBackgroundColor()} font-normal`}
          value={textValue}
          onChange={handleTextChange}
          onInput={adjustTextareaHeight}
          rows="1"
          maxLength={section.maxLength}
          placeholder={section.inputPlaceholder || "Start writing..."}
          style={{ 
            minHeight: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}
        />
      </div>
    </div>
  );
};

export default SectionCard;
