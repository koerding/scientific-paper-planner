import React, { useState, useEffect, useRef } from 'react';
// Removed CheckboxItem import

const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted, // Keep receiving this prop, might be useful later
  userInputs,
  handleInputChange,
  handleFirstVersionFinished,
  loading,
  sectionRef,
  onClick,
  // Removed unused setActiveSection, handleSectionChange props from signature if not needed
  useLargerFonts = false
}) => {
  const textareaRef = useRef(null);
  const textValue = userInputs[section.id] || '';

  // Determine if user has actually added content beyond the initial placeholder
  const hasMeaningfulContent = () => {
    const placeholder = section.placeholder || '';
    return textValue !== placeholder && String(textValue).trim() !== '';
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textValue]);

  // Button state - enable if not loading AND has meaningful content
  const buttonText = loading ? section.loadingButtonText : section.completeButtonText;
  const isButtonDisabled = loading || !hasMeaningfulContent();

  return (
    <div
      ref={sectionRef}
      className={`bg-white rounded-lg shadow-sm p-5 mb-6 transition-all duration-300 ease-in-out
        ${isCurrentSection ? 'border-2 border-blue-500 shadow-xl' : 'border border-gray-200 hover:shadow-lg'}
        ${isCompleted ? 'border-green-500' : ''} // Add green border if completed
      `}
      onClick={onClick} // Keep onClick on the main div to set active section
    >
      {/* Header with Title and Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-semibold ${useLargerFonts ? 'text-3xl' : 'text-2xl'} text-gray-800 mr-4`}>
          {section.title}
        </h2>
        {/* Moved Button Here */}
        <button
           onClick={(e) => {
                e.stopPropagation(); // Prevent card's onClick from firing
                handleFirstVersionFinished(section.id);
            }}
           disabled={isButtonDisabled}
           className={`py-1 px-3 rounded-md text-white font-medium transition-colors whitespace-nowrap ${ // Reduced padding, added whitespace-nowrap
             isButtonDisabled
               ? 'bg-gray-400 cursor-not-allowed'
               : 'bg-green-600 hover:bg-green-700'
           } ${useLargerFonts ? 'text-base' : 'text-sm'}`} // Adjusted font size
         >
           {loading ? (
              <span className="flex items-center justify-center">
                {/* Simple loading text or smaller spinner */}
                ...
              </span>
            ) : (
             buttonText
            )}
         </button>
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

      {/* Removed Checklist Section */}

      {/* Removed Full Width Button Section */}

    </div>
  );
};

export default SectionCard;
