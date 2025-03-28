import React, { useEffect } from 'react';
import { countWords } from '../../utils/formatUtils';

/**
 * Enhanced input area component designed for the 1/3-2/3 layout
 * Simplified version of the ModernInputArea with a focus on the essential inputs
 */
const EnhancedInputArea = ({ 
  section, 
  userInputs, 
  philosophyOptions,
  handleInputChange,
  handleCheckboxChange,
  handleFirstVersionFinished,
  loading,
  researchApproach // Research approach parameter
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
  }, [section.id, section.type, userInputs, handleInputChange]);

  // Function to check if the user has actually added content beyond the placeholder
  const hasUserContent = (section, userInput) => {
    // If it's the checklist type, just check if there are selected items
    if (section.type === 'checklist') {
      return userInput.philosophy && userInput.philosophy.length > 0;
    }
    
    // For text inputs, check if the content differs from the placeholder
    const input = userInput[section.id] || '';
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
  
  // Render input form with appropriate styling for enhanced layout
  let inputElement;
  if (section.type === 'checklist') {
    inputElement = (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Research Philosophy</h3>
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
    // For enhanced layout, provide a cleaner, more focused textarea
    inputElement = (
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{section.title}</h3>
        
        <textarea
          value={userInputs[section.id] || ''}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          rows={16}
          maxLength={2000}
          placeholder="Start writing here..."
        />
        
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <div>
            {userInputs[section.id] ? countWords(userInputs[section.id]) : 0} words
          </div>
          <div>
            {userInputs[section.id] ? 2000 - userInputs[section.id].length : 2000} characters remaining
          </div>
        </div>
      </div>
    );
  }
  
  // Check if there's actual user content to enable the button
  const hasContent = hasUserContent(section, userInputs);
  
  return (
    <div className="space-y-6">
      {inputElement}
      
      {/* Completion Checklist for enhanced layout */}
      <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
        <h4 className="font-semibold text-amber-800 mb-2">COMPLETION CHECKLIST:</h4>
        <ul className="space-y-2">
          {section.id === 'question' && (
            <>
              <li className={`flex items-start ${userInputs.question && userInputs.question.includes('Research Question:') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.question && userInputs.question.includes('Research Question:') ? '✓' : '□'}</span>
                Write a clear research question
              </li>
              <li className={`flex items-start ${userInputs.question && userInputs.question.includes('Why this question matters') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.question && userInputs.question.includes('Why this question matters') ? '✓' : '□'}</span>
                Explain why this question matters
              </li>
              <li className={`flex items-start ${userInputs.question && userInputs.question.includes('Scientists who would care') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.question && userInputs.question.includes('Scientists who would care') ? '✓' : '□'}</span>
                List scientists who would care about this question
              </li>
            </>
          )}
          
          {section.id === 'hypothesis' && (
            <>
              <li className={`flex items-start ${userInputs.hypothesis && userInputs.hypothesis.includes('Hypothesis 1:') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.hypothesis && userInputs.hypothesis.includes('Hypothesis 1:') ? '✓' : '□'}</span>
                Write first hypothesis
              </li>
              <li className={`flex items-start ${userInputs.hypothesis && userInputs.hypothesis.includes('Hypothesis 2:') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.hypothesis && userInputs.hypothesis.includes('Hypothesis 2:') ? '✓' : '□'}</span>
                Write second hypothesis
              </li>
              <li className={`flex items-start ${userInputs.hypothesis && userInputs.hypothesis.includes('Why distinguishing these hypotheses matters') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.hypothesis && userInputs.hypothesis.includes('Why distinguishing these hypotheses matters') ? '✓' : '□'}</span>
                Explain why distinguishing these hypotheses matters
              </li>
              <li className={`flex items-start ${userInputs.hypothesis && userInputs.hypothesis.includes('Most similar papers') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.hypothesis && userInputs.hypothesis.includes('Most similar papers') ? '✓' : '□'}</span>
                List similar papers that test related hypotheses
              </li>
            </>
          )}
          
          {section.id === 'philosophy' && (
            <li className={`flex items-start ${userInputs.philosophy && userInputs.philosophy.length > 0 ? 'text-green-700' : 'text-amber-700'}`}>
              <span className="mr-2">{userInputs.philosophy && userInputs.philosophy.length > 0 ? '✓' : '□'}</span>
              Select at least one research philosophy
            </li>
          )}
          
          {section.id === 'experiment' && (
            <>
              <li className={`flex items-start ${userInputs.experiment && userInputs.experiment.includes('Experimental Design:') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.experiment && userInputs.experiment.includes('Experimental Design:') ? '✓' : '□'}</span>
                Describe experimental design
              </li>
              <li className={`flex items-start ${userInputs.experiment && userInputs.experiment.includes('Predicted Results:') ? 'text-green-700' : 'text-amber-700'}`}>
                <span className="mr-2">{userInputs.experiment && userInputs.experiment.includes('Predicted Results:') ? '✓' : '□'}</span>
                Specify predicted results for each hypothesis
              </li>
            </>
          )}
          
          {/* Default checklist items for other sections */}
          {!['question', 'hypothesis', 'philosophy', 'experiment'].includes(section.id) && (
            <li className={`flex items-start ${hasContent ? 'text-green-700' : 'text-amber-700'}`}>
              <span className="mr-2">{hasContent ? '✓' : '□'}</span>
              Complete this section
            </li>
          )}
        </ul>
      </div>
      
      {/* Mark Complete Button */}
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
              MARK COMPLETE
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

export default EnhancedInputArea;
