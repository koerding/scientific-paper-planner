import React, { useRef } from 'react';

/**
 * SectionCard component with buttons that hover over the edit area
 * UPDATED: Removed checklist/philosophy special handling
 */
const SectionCard = ({
  section,
  isCurrentSection,
  isCompleted,
  userInputs,
  handleInputChange,
  handleFirstVersionFinished,
  loading,
  sectionRef,
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
  
  // Check if content has been modified from placeholder
  const hasUserModifiedContent = () => {
    // Get the content for this section
    const content = userInputs[section.id];
    
    // Safety check - ensure the content is a string before calling trim()
    if (content === undefined || content === null) return false;
    
    // Handle non-string content
    if (typeof content !== 'string') {
      return false;
    }
    
    const placeholder = section.placeholder || '';
    
    // Now we know content is a string and can safely call trim()
    return content.trim() !== '' && content !== placeholder;
  };

  // Only set active section when user explicitly interacts with inputs
  const handleDirectInteraction = () => {
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
    >
      {/* Connection dot for active section */}
      {isCurrentSection && (
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-blue-500 rounded-full transform -translate-y-1/2 z-10"></div>
      )}
      
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-bold ${fontSizes.title}`}>
          {section.title}
        </h2>
        {isCompleted && !isCurrentSection && (
          <div className="bg-green-100 text-green-800 text-base font-medium px-3 py-1 rounded">
            Completed
          </div>
        )}
      </div>
      
      {/* Section content with positioned complete button */}
      <div className="relative">
        {/* Text area for all sections - REMOVED checklist special case */}
        <textarea
          ref={textareaRef}
          value={typeof userInputs[section.id] === 'string' ? userInputs[section.id] : ''}
          onChange={(e) => {
            handleInputChange(section.id, e.target.value);
          }}
          onFocus={() => {
            handleDirectInteraction();
          }}
          onClick={() => {
            handleDirectInteraction();
          }}
          className={`w-full p-4 border border-gray-200 rounded-lg ${fontSizes.content} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
          rows={6} /* Limit to 6 visible rows maximum */
          placeholder={section.placeholder || "Enter your content here..."}
          style={{ lineHeight: useLargerFonts ? '1.6' : '1.5' }}
        />
        
        {/* Mark complete button that hovers at the bottom right */}
        <div className="absolute bottom-3 right-3">
          <button
            onClick={() => handleFirstVersionFinished()}
            disabled={loading || (!hasUserModifiedContent() && !isCompleted)}
            className={`px-4 py-2 rounded-lg ${fontSizes.button} font-medium shadow-md hover:shadow-lg transition-shadow ${
              !loading && (hasUserModifiedContent() || isCompleted)
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
