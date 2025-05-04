// FILE: src/components/sections/SectionCard.js
// FIXED: Simplified placeholder detection to ensure button turns purple

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore';
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

const SectionCard = ({
  sectionId,
  isCurrentSection,
  onRequestFeedback,
  handleSectionFocus,
  options = null,
  activeOption = null,
  onToggle = null,
  isToggleSection = false,
  onSwitchToGuide = null, // Callback to switch to guide mode
}) => {

  // Select State from Zustand Store
  const section = useAppStore((state) => state.sections[sectionId]);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Derived State
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {};
  const hasFeedback = !!feedbackRating;
  
  // SIMPLIFIED checks for placeholder content
  const isDefaultPlaceholderText = (text) => {
    if (!text) return true;
    text = text.trim();
    if (text === '') return true;
    
    // Look for the default placeholder-like content
    if (text.includes('[Clear, focused')) return true;
    
    // Check if it's too short to be meaningful
    return text.length < 15;
  };
  
  // This is what determines if the button should be gray
  const isPlaceholderContent = isDefaultPlaceholderText(content);

  // Callbacks
  const handleTextChange = useCallback((e) => {
    updateSectionContent(sectionId, e.target.value);
  }, [sectionId, updateSectionContent]);

  // FIXED: Better event handling for card clicks
  const handleToggleMinimize = useCallback((e) => {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    toggleMinimize(sectionId);
    
    if (isMinimized && typeof handleSectionFocus === 'function') {
      handleSectionFocus(sectionId);
    }
  }, [sectionId, toggleMinimize, isMinimized, handleSectionFocus]);

  const handleFeedbackRequest = useCallback(() => {
    if (typeof onRequestFeedback === 'function') {
      onRequestFeedback(sectionId);
    }
  }, [sectionId, onRequestFeedback]);

  // FIXED: Better event handling for card clicks
  const handleCardClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isMinimized) {
      handleToggleMinimize(e);
    } else if (typeof handleSectionFocus === 'function') {
      handleSectionFocus(sectionId);
    }
  };

  const handleEditorFocus = useCallback(() => {
    setIsTextareaFocused(true);
    if (typeof handleSectionFocus === 'function') {
      handleSectionFocus(sectionId);
    }
  }, [sectionId, handleSectionFocus]);

  const handleEditorBlur = useCallback(() => {
    setIsTextareaFocused(false);
  }, []);

  // --- Styling ---
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  // Define classes based on minimized state
  const minimizedClasses = 'max-h-14 overflow-hidden'; // Classes for minimized state
  const expandedClasses = ''; // No height/overflow constraints for expanded state

  const sectionClasses = `
    section-card rounded-lg ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} ${!isMinimized ? 'expanded' : 'minimized'}
    ${isMinimized ? minimizedClasses : expandedClasses} relative
    ${isCurrentSection ? 'current-active' : ''}
    cursor-pointer ${isMinimized ? 'hover:bg-gray-100 hover:shadow-sm' : ''}
    ${isToggleSection ? 'toggle-section' : ''}
    hover:shadow
  `;

  return (
    <div
      className={sectionClasses}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`section-${sectionId}`} // Add ID for navigation targeting
    >
      {isToggleSection ? (
        <ToggleHeader
          options={options || []}
          activeOption={activeOption} // Use prop from parent
          onToggle={onToggle}
          isMinimized={isMinimized}
          isHovered={isHovered || isTextareaFocused}
          isFocused={isCurrentSection}
          toggleMinimized={handleToggleMinimize}
        />
      ) : (
        <SectionHeader
          title={title}
          isMinimized={isMinimized}
          hasFeedback={hasFeedback}
          feedbackRating={feedbackRating}
          editedSinceFeedback={editedSinceFeedback}
          isHovered={isHovered || isTextareaFocused}
          isFocused={isCurrentSection}
          toggleMinimized={handleToggleMinimize}
        />
      )}

      {/* Render Preview or Editor based on isMinimized */}
      {isMinimized ?
        ( <SectionPreview textValue={content} /> )
        :
        ( <>
          <SectionEditor
            sectionId={sectionId}
            textValue={content}
            placeholder={placeholder || "Start writing..."}
            maxLength={maxLength}
            onFocus={handleEditorFocus}
            onBlur={handleEditorBlur}
            handleTextChange={handleTextChange}
          />
          <FeedbackButton
            hasEditedContent={!isPlaceholderContent} // Simply the inverse of placeholder content
            hasFeedback={hasFeedback}
            editedSinceFeedback={editedSinceFeedback}
            feedbackRating={feedbackRating}
            handleFeedbackRequest={handleFeedbackRequest}
            sectionId={sectionId}
            isPlaceholderContent={isPlaceholderContent} // Pass the simplified placeholder check
            onSwitchToGuide={onSwitchToGuide} // Pass the mode switch function
          />
        </>
        )
      }

      {/* Gradient overlay for minimized cards */}
      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

export default SectionCard;
