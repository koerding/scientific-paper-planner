// FILE: src/components/common/EnhancedTooltip.js
// A reusable, enhanced tooltip component

import React, { useState, useEffect } from 'react';

/**
 * An enhanced tooltip component that can be shown temporarily or on hover
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display in the tooltip
 * @param {boolean} props.show - Whether to force showing the tooltip
 * @param {number} props.autoDismissAfter - Time in ms after which to hide the tooltip (0 = don't auto-dismiss)
 * @param {string} props.position - Position of tooltip (top, bottom, left, right)
 * @param {string} props.className - Additional CSS classes for tooltip
 * @returns {React.ReactElement} The tooltip component
 */
const EnhancedTooltip = ({ 
  children, 
  show = false, 
  autoDismissAfter = 0,
  position = 'bottom',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(show);
  
  // Effect to handle auto-dismiss
  useEffect(() => {
    setIsVisible(show);
    
    if (show && autoDismissAfter > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoDismissAfter);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoDismissAfter]);
  
  if (!isVisible) return null;
  
  // Generate position classes based on the position prop
  let positionClasses = '';
  let arrowClasses = '';
  
  switch (position) {
    case 'top':
      positionClasses = 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      arrowClasses = 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent';
      break;
    case 'right':
      positionClasses = 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      arrowClasses = 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent';
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      arrowClasses = 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent';
      break;
    case 'bottom':
    default:
      positionClasses = 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      arrowClasses = 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent';
      break;
  }
  
  return (
    <div className={`absolute ${positionClasses} bg-gray-800 text-white text-xs rounded py-2 px-3 z-10 w-auto max-w-xs shadow-lg ${className}`}>
      {children}
      <div className={`absolute ${arrowClasses} border-8 border-transparent`}></div>
    </div>
  );
};

export default EnhancedTooltip;
