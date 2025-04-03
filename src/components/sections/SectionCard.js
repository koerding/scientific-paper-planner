import React, { useState, useEffect, useRef } from 'react';
import CheckboxItem from './CheckboxItem'; // Assuming CheckboxItem component exists

const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted, // Use this prop to determine if it's marked complete
  userInputs,
  handleInputChange,
  handleFirstVersionFinished, // Receive the handler prop
  loading, // Receive loading prop specific to this section's completion/review
  sectionRef, // Receive the ref
  onClick, // Receive the onClick handler
  setActiveSection, // Pass this down if needed by internal elements
  handleSectionChange, // Pass this down if needed by internal elements
  useLargerFonts = false // Prop for larger fonts
}) => {
  const [checklistComplete, setChecklistComplete] = useState(false);
  const textareaRef = useRef(null); // Ref for the textarea

  // Extract the text value for the current section
  const textValue = userInputs[section.id] || ''; // Default to empty string if undefined

  // Check completion status based on checklist items
  useEffect(() => {
    if (section.completionChecklist && Array.isArray(section.completionChecklist.items)) {
      const allChecked = section.completionChecklist.items.every(item => {
        if (!item.checkPattern) return true; // Assume optional items are met if no pattern
        try {
          // Ensure textValue is a string before testing
          const pattern = new RegExp(item.checkPattern, 'i'); // Case-insensitive check
          return pattern.test(String(textValue)); // Convert textValue to string
        } catch (e) {
          console.error(`Invalid regex pattern for ${section.id} - ${item.text}: ${item.checkPattern}`, e);
          return false; // Treat invalid regex as not checked
        }
      });
      setChecklistComplete(allChecked);
    } else {
      setChecklistComplete(true); // If no checklist, consider it complete for button enabling
    }
  }, [textValue, section.completionChecklist]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [textValue]); // Adjust height when textValue changes


  // Determine button text and disabled state
  const isEffectivelyCompleted = isCompleted || checklistComplete;
  const buttonText = loading ? section.loadingButtonText : section.completeButtonText;
  const isButtonDisabled = loading || !checklistComplete; // Disable if loading or checklist not met


  return (
    <div ref={sectionRef} className={`mb-12 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out ${isCurrentSection ? 'bg-white border-2 border-blue-500 shadow-xl' : 'bg-gray-100 border border-gray-200 hover:shadow-lg'}`} onClick={onClick}>
      <h2 className={`font-semibold mb-4 ${useLargerFonts ? 'text-3xl' : 'text-2xl'} text-gray-800`}>{section.title}</h2>

      {/* Input Area */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-none overflow-hidden ${useLargerFonts ? 'text-xl leading-relaxed' : 'text-base'} ${isCurrentSection ? 'bg-blue-50' : 'bg-white'}`}
          value={textValue} // Bind value to state
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          // *** REMOVED placeholder prop ***
          rows="5" // Initial rows, will auto-expand
          maxLength={section.maxLength}
        />
        {section.maxLength && (
          <p className="text-right text-xs text-gray-500 mt-1 pr-1">
            {textValue.length} / {section.maxLength}
          </p>
        )}
      </div>

      {/* Checklist */}
      {section.completionChecklist && (
        <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className={`font-medium mb-2 ${useLargerFonts ? 'text-lg' : 'text-base'} text-gray-700`}>{section.completionChecklist.title}</h3>
          <ul className="space-y-1">
            {section.completionChecklist.items.map((item, index) => (
              <CheckboxItem key={index} item={item} textValue={String(textValue)} useLargerFonts={useLargerFonts}/>
            ))}
          </ul>
        </div>
      )}

      {/* Completion Button */}
      <button
         onClick={() => handleFirstVersionFinished(section.id)} // Call the passed handler
         disabled={isButtonDisabled} // Disable based on loading or checklist
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
