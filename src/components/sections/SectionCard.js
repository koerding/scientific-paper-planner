import React, { useState, useEffect, useRef } from 'react';

/**
 * Section card component for the paper planner
 * UPDATED: Changed "empty" status label to "incomplete" for better clarity
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

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textValue]);

  // Determine the border classes based on completion status
  // Now just using red/green (unstarted/complete)
  const getBorderClasses = () => {
    // Current section gets blue focus border regardless of completion
    if (isCurrentSection) {
      return 'border-4 border-blue-500 shadow-xl';
    }
    
    // Just red/green for completion status - very simplified
    return completionStatus === 'complete' 
      ? 'border-4 border-green-600 section-complete'
      : 'border-4 border-red-300 section-unstarted';
  };

  // Combine all the classes
  const sectionClasses = `
    section-card 
    bg-white 
    rounded-lg 
    shadow-sm 
    p-5 
    mb-6 
    transition-all 
    duration-300 
    ease-in-out 
    ${getBorderClasses()}
  `;

  return (
    <div
      ref={sectionRef}
      className={sectionClasses}
      onClick={onClick}
    >
      {/* Header with Title */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-semibold ${useLargerFonts ? 'text-3xl' : 'text-2xl'} text-gray-800 mr-4`}>
          {section.title}
        </h2>
        
        {/* Status Indicator - Changed "empty" to "incomplete" */}
        <div className="text-xs inline-block px-2 py-1 rounded" 
             style={{
               backgroundColor: 
                 completionStatus === 'complete' ? '#d1fae5' : '#fee2e2',
               color: 
                 completionStatus === 'complete' ? '#065f46' : '#b91c1c'
             }}>
          {completionStatus === 'complete' ? 'complete' : 'incomplete'}
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none overflow-hidden ${useLargerFonts ? 'text-xl leading-relaxed' : 'text-base'} ${isCurrentSection ? 'bg-blue-50' : 'bg-white'}`}
          value={textValue}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          rows="1"
          maxLength={section.maxLength}
        />
        {section.maxLength && (
          <p className="text-right text-xs text-gray-500 mt-1 pr-1">
            {textValue.length} / {section.maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default SectionCard;
