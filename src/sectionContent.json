// src/components/SectionContent.js
// Refactored to fully separate content from form

import React, { useEffect } from 'react';
import { countWords } from '../utils/formatUtils';

/**
 * Reusable component for rendering the left side content area
 * All content and validation logic comes from the section config JSON
 */
const SectionContent = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading,
  researchApproach 
}) => {
  // Get approach-specific placeholder if available
  const getPlaceholder = () => {
    if (!section.placeholders || !researchApproach) {
      return section.placeholder || '';
    }
    
    return section.placeholders[researchApproach] || section.placeholder || '';
  };
  
  // Pre-fill template on first visit to a section
  useEffect(() => {
    // Only pre-fill if the section is empty and has a placeholder
    if (section.type !== 'checklist' && 
        getPlaceholder() && 
        (!userInputs[section.id] || userInputs[section.id].trim() === '')) {
      handleInputChange(section.id, getPlaceholder());
    }
  }, [section.id, section.type, userInputs, handleInputChange, getPlaceholder]);

  // Function to check if the user has actually added content beyond the placeholder
  const hasUserContent = () => {
    // If it's the checklist type, just check if there are selected items
    if (section.type === 'checklist') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    
    // For text inputs, check if the content differs from the placeholder
    const input = userInputs[section.id] || '';
    const placeholder = getPlaceholder();
    
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
  
  // Generate completion checklist items from JSON config
  const renderCompletionChecklist = () => {
    if (!section.completionChecklist) return null;
    
    return (
      <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
        <h4 className="font-semibold text-amber-800 mb-2">{section.completionChecklist.title || "COMPLETION CHECKLIST:"}</h4>
        <ul className="space-y-2">
          {section.completionChecklist.items.map((item, index) => {
            const isComplete = item.checkPattern ? 
              (userInputs[section.id] && userInputs[section.id].includes(item.checkPattern)) : 
              hasUserContent();
            
            return (
              <li key={index} className={`flex items-start ${isComplete ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{isComplete ? '✓' : '□'}</span>
                {item.text}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  
  // Render input form based on section type
  const renderInputElement = () => {
    if (section.type === 'checklist') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{section.title}</h3>
          <div className="space-y-3">
            {philosophyOptions.map(option => (
              <div 
                key={option.id} 
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  userInputs.philosophy && userInputs.philosophy.includes(option.id) 
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
                      checked={userInputs.philosophy && userInputs.philosophy.includes(option.id)}
                      onChange={() => handleCheckboxChange(option.id)}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <label 
                    htmlFor={option.id} 
                    className={`ml-3 text-gray-700 cursor-pointer ${
                      userInputs.philosophy && userInputs.philosophy.includes(option.id) ? 'font-medium' : ''
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
      return (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{section.title}</h3>
          
          <textarea
            value={userInputs[section.id] || ''}
            onChange={(e) => handleInputChange(section.id, e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            rows={16}
            maxLength={section.maxLength || 2000}
            placeholder={section.inputPlaceholder || "Start writing here..."}
          />
          
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <div>
              {userInputs[section.id] ? countWords(userInputs[section.id]) : 0} words
            </div>
            <div>
              {userInputs[section.id] ? (section.maxLength || 2000) - userInputs[section.id].length : (section.maxLength || 2000)} characters remaining
            </div>
          </div>
        </div>
      );
    }
  };
  
  // Check if there's actual user content to enable the button
  const hasContent = hasUserContent();
  
  return (
    <div className="space-y-6">
      {renderInputElement()}
      
      {/* Completion Checklist generated from JSON config */}
      {renderCompletionChecklist()}
      
      {/* Mark Complete Button - Text from config */}
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
              {section.loadingButtonText || "Processing..."}
            </span>
          ) : (
            <span className="flex items-center">
              {section.completeButtonText || "MARK COMPLETE"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SectionContent;
