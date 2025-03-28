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
        rows={10}
        className="w-full p-4 border border-gray-300 rounded-md text-base text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Write your answer here..."
        value={userInputs[section.id] || ''}
        onChange={(e) => handleInputChange(section.id, e.target.value)}
        disabled={loading}
      />
    );
  }

  // Render instructions box right above the input field
  const instructionsElement = (
    <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-md shadow-sm text-gray-700">
      <div className="font-semibold text-lg mb-2">{section.instructions.title}</div>
      <div className="instruction-text text-base whitespace-pre-line">{formatInstructions(section)}</div>
      {section.instructions.workStep.content && (
        <div className="mt-2 instruction-text text-base text-blue-800">{section.instructions.workStep.content}</div>
      )}
    </div>
  );

  return (
    <div className="mt-4">
      {/* Section header */}
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{section.title}</h2>
      <p className="text-gray-600 mb-4 text-base">{section.description}</p>

      {/* Instructions right before the input */}
      {instructionsElement}

      {/* Input area */}
      {inputElement}

      {/* Word count */}
      {section.wordLimit && (
        <p className="text-sm text-gray-500 mt-2">
          Word count: {countWords(userInputs[section.id] || '')} / {section.wordLimit}
        </p>
      )}

      {/* First version confirmation */}
      {section.confirmFirstVersion && (
        <button
          className="mt-6 px-5 py-2 bg-green-600 text-white font-medium rounded shadow hover:bg-green-700 transition"
          onClick={handleFirstVersionFinished}
        >
          I’m done with this version
        </button>
      )}
    </div>
  );
};

export default InputArea;
