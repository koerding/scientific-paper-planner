import React from 'react';

/**
 * SectionCard component represents a single editable section in the paper planner
 * Handles displaying content, status indicators, and different input types
 * More compact design with less whitespace
 * Improved focus handling
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
  handleSectionChange
}) => {
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

  // Focus handler - explicitly set focus to this section
  const handleInputFocus = (e) => {
    // Stop event propagation to prevent conflicts
    e.stopPropagation();
    // Update active section
    setActiveSection(section.id);
    handleSectionChange(section.id);
  };

  // Click handler for the textarea
  const handleTextareaClick = (e) => {
    // Stop event propagation to prevent conflicts
    e.stopPropagation();
    // Update active section
    setActiveSection(section.id);
    handleSectionChange(section.id);
  };

  return (
    <div 
      id={section.id}
      ref={sectionRef}
      className={`bg-white rounded-lg shadow-sm p-4 mb-4 
        ${isCompleted ? 'border-2 border-green-500' : isCurrentSection ? 'border-2 border-indigo-500' : 'border border-gray-200'}
        ${isCurrentSection ? 'relative' : ''}
      `}
      onClick={onClick}
    >
      {/* Connection dot for active section */}
      {isCurrentSection && (
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-blue-500 rounded-full transform -translate-y-1/2 z-10"></div>
      )}
      
      {/* Section Header - More compact */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">{section.title}</h2>
        {isCompleted && !isCurrentSection && (
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
            Completed
          </div>
        )}
      </div>
      
      {/* Section content - Philosophy has checkboxes, others have textareas */}
      {section.id === 'philosophy' ? (
        <div className="space-y-2">
          {philosophyOptions.map(option => (
            <div 
              key={option.id} 
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                userInputs.philosophy && userInputs.philosophy.includes(option.id) 
                  ? 'bg-indigo-50 border border-indigo-300' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent onClick
                handleCheckboxChange(option.id);
                // Also set this section as active when clicking a checkbox
                setActiveSection(section.id);
                handleSectionChange(section.id);
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={userInputs.philosophy && userInputs.philosophy.includes(option.id)}
                    onChange={() => {
                      handleCheckboxChange(option.id);
                      // Also set this section as active when changing a checkbox
                      setActiveSection(section.id);
                      handleSectionChange(section.id);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <label 
                  htmlFor={option.id} 
                  className={`ml-2 text-sm text-gray-700 cursor-pointer ${
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
          value={userInputs[section.id] || ''}
          onChange={(e) => {
            handleInputChange(section.id, e.target.value);
            // Also set this section as active when changing text
            setActiveSection(section.id);
            handleSectionChange(section.id);
          }}
          onFocus={handleInputFocus}
          onClick={handleTextareaClick}
          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          rows={6} /* Limit to 6 visible rows maximum */
          placeholder={section.placeholder || "Enter your content here..."}
        />
      )}
      
      {/* Mark complete button - Always enabled if content has been modified */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent onClick
            handleFirstVersionFinished();
          }}
          disabled={loading || (!hasUserModifiedContent() && !isCompleted)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
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
