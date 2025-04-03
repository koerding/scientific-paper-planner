import React, { useEffect, useRef } from 'react';

/**
 * SectionCard component with larger fonts
 */
const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted,
  userInputs,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  philosophyOptions,
  loading,
  sectionRef,
  onClick,
  setActiveSection,
  handleSectionChange,
  useLargerFonts = false
}) => {
  // Reference to the textarea
  const textareaRef = useRef(null);
  
  // Font size adjustments
  const fontSizes = useLargerFonts ? {
    title: 'text-2xl',
    label: 'text-lg',
    content: 'text-lg',
    button: 'text-base'
  } : {
    title: 'text-lg',
    label: 'text-sm',
    content: 'text-sm',
    button: 'text-sm'
  };
  
  // When isCurrentSection changes, focus the textarea if this is the active section
  useEffect(() => {
    if (isCurrentSection && textareaRef.current && section.type !== 'checklist') {
      // Only focus if not already focused to avoid stealing focus from another element
      if (document.activeElement !== textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isCurrentSection, section.type]);

  // Check if content has been modified from placeholder
  const hasUserModifiedContent = () => {
    if (section.id === 'philosophy') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    
    const content = userInputs[section.id] || '';
    const placeholder = section.placeholder || '';
    
    // Consider it modified if it's not empty and not exactly the placeholder
    return content.trim() !== '' && content !== placeholder;
  };

  // Force this section to be active when interacted with
  const forceActiveSection = () => {
    setActiveSection(section.id);
    handleSectionChange(section.id);
  };

  return (
    <div 
      id={section.id}
      ref={sectionRef}
      className={`bg-white rounded-lg shadow-sm p-5 mb-6 
        ${isCompleted ? 'border-2 border-green-500' : isCurrentSection ? 'border-2 border-indigo-500' : 'border border-gray-200'}
        ${isCurrentSection ? 'relative' : ''}
      `}
      onClick={() => {
        if (section.type !== 'checklist' && textareaRef.current) {
          textareaRef.current.focus();
        }
        forceActiveSection();
      }}
    >
      {/* Connection dot for active section */}
      {isCurrentSection && (
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-blue-500 rounded-full transform -translate-y-1/2 z-10"></div>
      )}
      
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 
          className={`font-bold ${fontSizes.title}`}
          onClick={(e) => {
            e.stopPropagation();
            forceActiveSection();
          }}
        >
          {section.title}
        </h2>
        {isCompleted && !isCurrentSection && (
          <div className="bg-green-100 text-green-800 text-base font-medium px-3 py-1 rounded">
            Completed
          </div>
        )}
      </div>
      
      {/* Section content - Philosophy has checkboxes, others have textareas */}
      {section.id === 'philosophy' ? (
        <div className="space-y-3">
          {philosophyOptions.map(option => (
            <div 
              key={option.id} 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                userInputs.philosophy && userInputs.philosophy.includes(option.id) 
                  ? 'bg-indigo-50 border border-indigo-300' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCheckboxChange(option.id);
                forceActiveSection();
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={userInputs.philosophy && userInputs.philosophy.includes(option.id)}
                    onChange={() => {
                      handleCheckboxChange(option.id);
                      forceActiveSection();
                    }}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <label 
                  htmlFor={option.id} 
                  className={`ml-3 ${fontSizes.label} text-gray-700 cursor-pointer ${
                    userInputs.philosophy && userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
                  }`}
                >
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={userInputs[section.id] || ''}
          onChange={(e) => {
            handleInputChange(section.id, e.target.value);
            forceActiveSection();
          }}
          onFocus={() => {
            forceActiveSection();
          }}
          onClick={(e) => {
            e.stopPropagation();
            forceActiveSection();
          }}
          onKeyDown={() => {
            forceActiveSection();
          }}
          className={`w-full p-4 border border-gray-200 rounded-lg ${fontSizes.content} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
          rows={6} /* Limit to 6 visible rows maximum */
          placeholder={section.placeholder || "Enter your content here..."}
          style={{ lineHeight: useLargerFonts ? '1.6' : '1.5' }}
        />
      )}
      
      {/* Mark complete button - Always enabled if content has been modified */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFirstVersionFinished();
          }}
          disabled={loading || (!hasUserModifiedContent() && !isCompleted)}
          className={`px-4 py-2 rounded-lg ${fontSizes.button} font-medium ${
            !loading && (hasUserModifiedContent() || isCompleted)
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Processing...' : 'Mark Complete'}
        </button>
      </div>
    </div>
  );
};

export default SectionCard;
