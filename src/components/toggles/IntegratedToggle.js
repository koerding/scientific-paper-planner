// FILE: src/components/toggles/IntegratedToggle.js
import React from 'react';

/**
 * A new toggle component that looks like a tab bar to be integrated 
 * directly with section cards, saving vertical space
 */
const IntegratedToggle = ({ 
  options, 
  activeOption, 
  onChange, 
  title,
  className
}) => {
  // Get classes for a specific option button
  const getButtonClasses = (optionId) => {
    const isActive = activeOption === optionId;
    return `
      px-3 py-1.5 text-sm font-medium transition-colors
      ${isActive 
        ? 'text-white bg-blue-600 rounded-t-md shadow-sm' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
      flex-1 text-center
    `;
  };

  return (
    <div className={`integrated-toggle mb-0 ${className}`}>
      <div className="text-xs text-gray-500 mb-0.5 ml-1">{title}</div>
      <div className="flex border-b border-blue-600">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={getButtonClasses(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntegratedToggle;
