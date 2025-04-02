import React from 'react';
import { countWords, formatInstructions } from '../../utils/formatUtils';

/**
 * Renders the input area for a section with persistent placeholder text
 */
const InputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading,
  setActiveSection,
  handleSectionChange
}) => {
  // Persist placeholder as initial input if empty
  if (section.type !== 'checklist' && !userInputs[section.id] && section.placeholder) {
    handleInputChange(section.id, section.placeholder);
  }

  // Focus handler to update current section
  const handleFocus = () => {
    setActiveSection(section.id);
    handleSectionChange(section.id);
  };

  // Render input form
  let inputElement;
  if (section.type === 'checklist') {
    inputElement = (
      <div className="mt-4">
        {philosophyOptions.map(option => (
          <div key={option.id} className="flex items-start mb-3">
            <input
              type="checkbox"
              id={option.id}
              checked={userInputs.philosophy.includes(option.id)}
              onChange={() => handleCheckboxChange(option.id)}
              className="mt-1 mr-2 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={option.id} className="text-gray-700 text-base">{option.label}</label>
          </div>
        ))}
      </div>
    );
  } else {
    inputElement = (
      <textarea
        rows={6} /* Limit to 6 rows maximum */
        className="w-full p-3 border border-gray-300 rounded-md text-base text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={userInputs[section.id] || ''}
        onChange={(e) => handleInputChange(section.id, e.target.value)}
        onFocus={handleFocus}
        disabled={loading}
      />
    );
  }

  // Check if content has been modified from placeholder
  const hasUserModifiedContent = () => {
    if (section.type === 'checklist') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    
    const content = userInputs[section.id] || '';
    const placeholder = section.placeholder || '';
    
    // If content is empty, it's not completed
    if (!content || content.trim() === '') return false;
    
    // If the length is different or content has been edited in some way
    return content !== placeholder || content.trim() !== placeholder.trim();
  };

  return (
    <div className="mt-3">
      {/* Compact header */}
      <h2 className="text-lg font-bold text-gray-800 mb-1">{section.title}</h2>
      <p className="text-gray-600 mb-3 text-sm">{section.description}</p>

      {/* Input area */}
      {inputElement}

      {/* Word count */}
      {section.wordLimit && (
        <p className="text-xs text-gray-500 mt-1">
          Word count: {countWords(userInputs[section.id] || '')} / {section.wordLimit}
        </p>
      )}

      {/* First version confirmation - Always enabled if any content modification */}
      {section.confirmFirstVersion && (
        <button
          className={`mt-4 px-4 py-2 font-medium rounded shadow transition ${
            hasUserModifiedContent() 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleFirstVersionFinished}
          disabled={!hasUserModifiedContent() || loading}
        >
          {loading ? 'Processing...' : 'Mark Complete'}
        </button>
      )}
    </div>
  );
};

export default InputArea;
