import React, { useState, useEffect, useRef } from 'react';

const SectionCard = ({
  section,
  isCurrentSection,
  completionStatus = 'unstarted', // New prop: 'complete', 'progress', or 'unstarted'
  userInputs,
  handleInputChange,
  loading,
  sectionRef,
  onClick,
  useLargerFonts = false
}) => {
  const textareaRef = useRef(null);
  
  // Get the actual value stored in userInputs - this should be pre-filled with template content
  const textValue = userInputs[section.id] || '';

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textValue]);

  // Determine the border color and style based on completion status
  const getBorderStyle = () => {
    // Current section gets blue focus border regardless of completion
    if (isCurrentSection) {
      return 'border-4 border-blue-500 shadow-xl';
    }
    
    // Otherwise, use completion status for border color
    switch (completionStatus) {
      case 'complete':
        return 'border-4 border-green-600';
      case 'progress':
        return 'border-4 border-yellow-500';
      case 'unstarted':
      default:
        return 'border-4 border-red-300';
    }
  };

  return (
    <div
      ref={sectionRef}
      className={`bg-white rounded-lg shadow-sm p-5 mb-6 transition-all duration-300 ease-in-out ${getBorderStyle()}`}
      onClick={onClick} // Keep onClick on the main div to set active section
    >
      {/* Header with Title */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-semibold ${useLargerFonts ? 'text-3xl' : 'text-2xl'} text-gray-800 mr-4`}>
          {section.title}
        </h2>
      </div>

      {/* Input Area */}
      <div className="mb-4"> {/* Reduced bottom margin */}
        <textarea
          ref={textareaRef}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none overflow-hidden ${useLargerFonts ? 'text-xl leading-relaxed' : 'text-base'} ${isCurrentSection ? 'bg-blue-50' : 'bg-white'}`}
          value={textValue}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          rows="1" // Start with 1 row, auto-expand will handle height
          maxLength={section.maxLength}
        />
        {section.maxLength && (
          <p className="text-right text-xs text-gray-500 mt-1 pr-1">
            {textValue.length} / {section.maxLength}
          </p>
        )}
      </div>
      
      {/* Debug info - remove in production */}
      {/* <p className="text-xs text-gray-400">Status: {completionStatus}</p> */}
    </div>
  );
};

export default SectionCard;
