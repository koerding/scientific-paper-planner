// src/components/sections/SectionEditor.js
import React, { useRef, useEffect } from 'react';

const SectionEditor = ({ 
  textValue, 
  placeholder, 
  maxLength, 
  inputPlaceholder,
  isFocused, 
  setIsFocused, 
  isHovered, 
  setIsHovered,
  handleTextChange
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Adjust on initial render and when text changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [textValue]);

  useEffect(() => {
    const timer = setTimeout(adjustTextareaHeight, 10);
    return () => clearTimeout(timer);
  }, []);

  const getTextareaClasses = () => {
    const baseClasses = `w-full py-1 px-2 border-0 rounded focus:ring-1 focus:ring-blue-300 outline-none resize-none overflow-hidden text-base leading-relaxed bg-inherit font-normal`;
    
    if (isFocused) {
      return `${baseClasses} edit-mode-focused`;
    } else if (isHovered) {
      return `${baseClasses} edit-mode-hover`;
    }
    
    return baseClasses;
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual edit indicator for empty textareas */}
      {textValue.trim() === '' && !isFocused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm italic">
          Click to edit...
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        className={getTextareaClasses()}
        value={textValue}
        onChange={handleTextChange}
        onInput={adjustTextareaHeight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows="1"
        maxLength={maxLength}
        placeholder={inputPlaceholder || "Start writing..."}
        style={{ 
          minHeight: '2rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          cursor: 'text'
        }}
      />
    </div>
  );
};

export default SectionEditor;
