import React, { useEffect } from 'react';
import { countWords } from '../../utils/formatUtils';

/**
 * Modern input area component with pre-filled templates that are fully editable
 * and improved content detection
 */
const ModernInputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading
}) => {
  // Pre-fill template on first visit to a section
  useEffect(() => {
    // Only pre-fill if the section is empty and has a placeholder
    if (section.type !== 'checklist' && 
        section.placeholder && 
        (!userInputs[section.id] || userInputs[section.id].trim() === '')) {
      handleInputChange(section.id, section.placeholder);
    }
  }, [section.id, section.placeholder, section.type, userInputs, handleInputChange]);

  // Format instructions for display
  const formatInstructions = (section) => {
    return section.instructions.description;
  };

  // Function to check if the user has actually added content beyond the placeholder
  const hasUserContent = (section, userInput) => {
    // If it's the checklist type, just check if there are selected items
    if (section.type === 'checklist') {
      return userInput.philosophy && userInput.philosophy.length > 0;
    }
    
    // For text inputs, check if the content differs from the placeholder
    const input = userInput[section.id] || '';
    const placeholder = section.placeholder || '';
    
    // If input is exactly the placeholder, or completely empty, return false
    if (!input.trim() || input === placeholder) {
      return false;
    }
    
    // More sophisticated check to detect if user has actually added content 
    // beyond the template structure
    
    // Split both into lines and compare
    const inputLines = input.split('\n');
    const placeholderLines = placeholder.split('\n');
    
    // First check: If user added more lines than the placeholder has
    if (inputLines.length > placeholderLines.length) {
      return true;
    }
    
    // Second check: Look for lines that differ from the placeholder
    let hasChanges = false;
    for (let i = 0; i < inputLines.length; i++) {
      // If placeholder doesn't have this line, or line is different
      // and not just an empty line or just placeholders like "- " or "1. "
      const inputLine = inputLines[i].trim();
      const placeholderLine = i < placeholderLines.length ? placeholderLines[i].trim() : '';
      
      if (inputLine && 
          inputLine !== placeholderLine && 
          !placeholderLine.includes(inputLine) &&
          inputLine !== '-' && 
          !inputLine.match(/^\d+\.$/) && 
          inputLine !== '- ') {
        hasChanges = true;
        break;
      }
    }
    
    return hasChanges;
  };

  // Render instructions with card design
  const instructionsElement = (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
      <div className="font-semibold text-xl mb-2">{section.instructions.title}</div>
      <div className="instruction-text text-gray-600 mb-4 leading-relaxed">{formatInstructions(section)}</div>
      {section.instructions.workStep.content && (
        <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="text-sm text-indigo-700 leading-relaxed">{section.instructions.workStep.content}</div>
        </div>
      )}
    </div>
  );
  
  // Render input form with modern styling
  let inputElement;
  if (section.type === 'checklist') {
    inputElement = (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Research Philosophy</h3>
        <div className="space-y-3">
          {philosophyOptions.map(option => (
            <div 
              key={option.id} 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                userInputs.philosophy.includes(option.id) 
                  ? 'bg-indigo-50 border-2 border-indigo-300' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleCheckboxChange(option.id)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={userInputs.philosophy.includes(option.id)}
                    onChange={() => handleCheckboxChange(option.id)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <label 
                  htmlFor={option.id} 
                  className={`ml-3 text-gray-700 cursor-pointer ${
                    userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
                  }`}
                >
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    inputElement = (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your {section.title}</h3>
        
        {/* Simple textarea with pre-filled content that's fully editable */}
        <textarea
          value={userInputs[section.id] || ''}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-lg font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          rows={12}
          maxLength={1200}
        />
        
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <div>
            {userInputs[section.id] ? countWords(userInputs[section.id]) : 0} / 200 words
          </div>
          <div>
            {userInputs[section.id] ? 1200 - userInputs[section.id].length : 1200} characters remaining
          </div>
        </div>
      </div>
    );
  }
  
  // Check if there's actual user content to enable the button
  const hasContent = hasUserContent(section, userInputs);
  
  return (
    <div className="space-y-6">
      {instructionsElement}
      {inputElement}
      
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleFirstVersionFinished}
          disabled={!hasContent || loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            hasContent && !loading
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Mark First Version Complete
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModernInputArea;
