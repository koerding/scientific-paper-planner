// FILE: src/components/sections/SectionCard.js
// UPDATED: Modified to always show expanded content and use new navigation

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore';
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader';
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
    isMinimized = false, // Now always set to false to show expanded content
    aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {};
  const hasFeedback = !!feedbackRating;
  
  // This is what determines if the button should be gray
  const isPlaceholderContent = content === placeholder || content.trim() === '';

  // Callbacks
  const handleTextChange = useCallback((e) => {
    updateSectionContent(sectionId, e.target.value);
  }, [sectionId, updateSectionContent]);

  // Keep this for potential future use
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

  // FIXED: Better event handling for card clicks - now just for section focus
  const handleCardClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (typeof handleSectionFocus === 'function') {
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
  const getBorderClasses = () => isCurrentSection ? 'border-2 border-blue-500 shadow-md' : 'border border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  
  // Always use expanded classes now
  const expandedClasses = ''; // No height/overflow constraints for expanded state

  const sectionClasses = `
    section-card rounded-lg ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} expanded
    ${isCurrentSection ? 'current-active' : ''}
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
          onSwitchToGuide={onSwitchToGuide} // Pass the mode switch function
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
          onSwitchToGuide={onSwitchToGuide} // Pass the mode switch function
        />
      )}

      {/* Always render Editor now */}
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
        hasEditedContent={!isPlaceholderContent}
        hasFeedback={hasFeedback}
        editedSinceFeedback={editedSinceFeedback}
        feedbackRating={feedbackRating}
        handleFeedbackRequest={handleFeedbackRequest}
        sectionId={sectionId}
        isPlaceholderContent={isPlaceholderContent}
        onSwitchToGuide={onSwitchToGuide} // Pass the mode switch function
      />
    </div>
  );
};

export default SectionCard;
