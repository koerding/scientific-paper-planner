import React from 'react';
import { countWords, formatInstructions } from '../../utils/formatUtils';

/**
 * Renders the input area for a section
 */
const InputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading
}) => {
  // Render instructions with consistent font sizes
  const instructionsElement = (
    <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-gray-700">
      <div className="font-semibold text-lg mb-2">{section.instructions.title}</div>
      <div className="instruction-text text-base whitespace-pre-line">{formatInstructions(section)}</div>
      {section.instructions.workStep.content && (
        <div className="mt-2 instruction-text text-base">{section.instructions.workStep.content}</div>
      )}
    </div>
  );
  
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
              className="mt-1 mr-2"
            />
            <label htmlFor={option.id} className="text-gray-700 text-base">{option.label}</label>
          </div>
        ))}
      </div>
    );
  } else {
    // Get placeholder from the section content
    const placeholder = section.placeholder || `Enter your ${section.title.toLowerCase()} here (max 200 words)`;
    
    inputElement = (
      <textarea
        value={userInputs[section.id] || ''}
        onChange={(e) => handleInputChange(section.id, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded h-64 mt-2 font-mono text-sm"
        placeholder={placeholder}
        maxLength={1200} // Approximately 200 words
      />
    );
  }
  
  // Check if there's content to enable the button
  const hasContent = section.type === 'checklist' 
    ? userInputs.philosophy.length > 0 
    : userInputs[section.id]?.trim().length > 0;
  
  // Return both instructions, input form, and the button
  return (
    <div>
      {instructionsElement}
      {inputElement}
      
      {/* Word Counter */}
      {section.type !== 'checklist' && (
        <div className="text-right text-sm text-gray-600 mt-1">
          {countWords(userInputs[section.id] || '')} / 200 words
        </div>
      )}
      
      {/* First Version Finished Button */}
      <div className="mt-4">
        <button
          onClick={handleFirstVersionFinished}
          disabled={!hasContent || loading}
          className={`px-4 py-2 rounded-md font-medium ${
            hasContent && !loading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'First version finished'
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
