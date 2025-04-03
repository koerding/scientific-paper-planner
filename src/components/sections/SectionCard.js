import React, { useState, useEffect, useRef } from 'react';
// Removed: import CheckboxItem from './CheckboxItem'; // Component file is missing

const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted, // Prop indicating if marked complete (might not be used now)
  userInputs,
  handleInputChange,
  handleFirstVersionFinished,
  loading,
  sectionRef,
  onClick,
  setActiveSection, // Keep props even if unused by this component directly
  handleSectionChange, // Keep props even if unused by this component directly
  useLargerFonts = false
}) => {
  // Removed: const [checklistComplete, setChecklistComplete] = useState(false);
  const textareaRef = useRef(null);

  const textValue = userInputs[section.id] || '';

  // Removed: useEffect hook that calculated checklistComplete

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textValue]);

  // Determine button text and disabled state (simplified as checklist is removed)
  // You might want to re-evaluate the completion logic here.
  // For now, let's just disable based on loading.
  // Consider if 'isCompleted' prop should play a role or if button should always be enabled when not loading.
  const buttonText = loading ? section.loadingButtonText : section.completeButtonText;
  const isButtonDisabled = loading; // Simplified disabling logic


  return (
    <div ref={sectionRef} className={`mb-12 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out ${isCurrentSection ? 'bg-white border-2 border-blue-500 shadow-xl' : 'bg-gray-100 border border-gray-200 hover:shadow-lg'}`} onClick={onClick}>
      <h2 className={`font-semibold mb-4 ${useLargerFonts ? 'text-3xl' : 'text-2xl'} text-gray-800`}>{section.title}</h2>

      {/* Input Area */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none overflow-hidden ${useLargerFonts ? 'text-xl leading-relaxed' : 'text-base'} ${isCurrentSection ? 'bg-blue-50' : 'bg-white'}`}
          value={textValue}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          rows="5"
          maxLength={section.maxLength}
        />
        {section.maxLength && (
          <p className="text-right text-xs text-gray-500 mt-1 pr-1">
            {textValue.length} / {section.maxLength}
          </p>
        )}
      </div>

      {/* Removed Checklist Section */}
      {/* {section.completionChecklist && ( ... )} */}

      {/* Completion Button */}
      <button
         onClick={() => handleFirstVersionFinished(section.id)}
         disabled={isButtonDisabled}
         className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
           isButtonDisabled
             ? 'bg-gray-400 cursor-not-allowed'
             : 'bg-green-600 hover:bg-green-700'
         } ${useLargerFonts ? 'text-lg' : 'text-base'}`}
       >
         {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {buttonText}
            </span>
          ) : (
           buttonText
          )}
       </button>

    </div>
  );
};

export default SectionCard;
