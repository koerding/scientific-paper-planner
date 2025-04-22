// FILE: src/components/sections/SectionCard.js
import React, { useEffect } from 'react';
import useSectionState from '../../hooks/useSectionState';
import { isPlaceholderContent } from '../../utils/sectionUtils';
import SectionHeader from './SectionHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

/**
 * Section card component for displaying and editing a section
 * Refactored to use smaller components for better maintainability
 * FIXED: Restored functionality to detect edits after feedback
 */
const SectionCard = ({
  section,
  isCurrentSection,
  userInputs,
  handleInputChange,
  loading,
  sectionRef,
  onClick,
  onEdit,
  onSignificantEdit,
  onRequestFeedback,
  hasFeedback,
  feedbackRating,
  lastFeedbackTime = 0
}) => {
  // Get the actual value stored in userInputs
  const textValue = userInputs[section.id] || '';
  
  // Check if the content is just the placeholder
  const hasOnlyPlaceholder = isPlaceholderContent(textValue, section.placeholder || '');
  
  // Determine if the content has been meaningfully edited
  const hasEditedContent = !hasOnlyPlaceholder;
  
  // Use our custom hook for section state management
  const { 
    isMinimized, 
    isFocused, 
    setIsFocused,
    isHovered, 
    setIsHovered,
    lastEditTimestamp, 
    setLastEditTimestamp,
    editedSinceFeedback,
    setEditedSinceFeedback,
    toggleMinimized
  } = useSectionState(section.id, { lastFeedbackTime });

  // Effect to update editedSinceFeedback when appropriate
  useEffect(() => {
    if (lastEditTimestamp && lastFeedbackTime && lastEditTimestamp > lastFeedbackTime) {
      setEditedSinceFeedback(true);
    } else if (!lastEditTimestamp || !lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastEditTimestamp, lastFeedbackTime, setEditedSinceFeedback]);
  
  // Reset editedSinceFeedback when new feedback is received
  useEffect(() => {
    if (lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastFeedbackTime, setEditedSinceFeedback]);
  
  // Handle input change with tracking for improvement reminder
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const currentValue = textValue;
    
    // Call the parent's input change handler
    handleInputChange(section.id, newValue);
    
    // Track edit timestamp for significant changes
    const now = Date.now();
    
    // Determine if this is a significant change
    if (Math.abs(newValue.length - currentValue.length) > 15) {
      setLastEditTimestamp(now);
      
      // Emit significant edit event to parent component
      if (typeof onSignificantEdit === 'function') {
        onSignificantEdit(section.id, now);
      }
      
      // Important: Set editedSinceFeedback to true when there's a significant edit after feedback
      if (hasFeedback && lastFeedbackTime) {
        setEditedSinceFeedback(true);
      }
    }
    // Update timestamp periodically even for smaller changes
    else if (!lastEditTimestamp || (now - lastEditTimestamp) > 30000) { // 30 seconds
      setLastEditTimestamp(now);
      
      // Emit regular edit event to parent component
      if (typeof onEdit === 'function') {
        onEdit(section.id, now);
      }
      
      // Also mark edited since feedback for any edits when feedback exists
      if (hasFeedback && lastFeedbackTime) {
        setEditedSinceFeedback(true);
      }
    }
  };
  
  // Handle feedback button click
  const handleFeedbackRequest = (e) => {
    e.stopPropagation(); // Prevent other actions
    
    // Only allow feedback if the content has been edited
    if (hasEditedContent && onRequestFeedback && typeof onRequestFeedback === 'function') {
      onRequestFeedback(section.id);
    }
  };
  
  // Modified click handler
  const handleCardClick = (e) => {
    // Let's find out if the click was on the header or toggle button
    const header = e.currentTarget.querySelector('.section-header');
    
    // Check if the click was inside the header area
    const isHeaderClick = header && header.contains(e.target) && 
                         !e.target.closest('.minimize-toggle-btn') &&
                         !e.target.closest('.feedback-button');
    
    if (isHeaderClick) {
      // If clicked on the header, toggle minimized state
      toggleMinimized(e);
    } else if (!isMinimized) {
      // If expanded and clicked elsewhere, use the normal onClick behavior
      onClick(e);
    } else {
      // If minimized and clicked anywhere on the card (except toggle button),
      // expand the card first
      toggleMinimized(e);
    }
  };
  
  // Determine border class for the current selection
  const getBorderClasses = () => {
    return isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  };

  // Determine background color for the card
  const getBackgroundColor = () => {
    return isCurrentSection ? 'bg-blue-50' : 'bg-white';
  };

  // Calculate max height for minimized cards
  const getMaxHeight = () => {
    return isMinimized ? 'max-h-14' : 'max-h-[2000px]';
  };

  // Combine all the classes
  const sectionClasses = `
    section-card 
    rounded-md 
    ${getBackgroundColor()}
    p-2
    mb-2
    transition-all 
    duration-300 
    ease-in-out 
    ${getBorderClasses()}
    ${isMinimized ? 'minimized' : 'expanded'}
    ${getMaxHeight()}
    overflow-hidden
    relative
    ${isCurrentSection ? 'current-active' : ''}
  `;

  return (
    <div
      ref={sectionRef}
      className={sectionClasses}
      onClick={handleCardClick}
    >
      {/* Header Component */}
      <SectionHeader
        title={section.title}
        isMinimized={isMinimized}
        hasFeedback={hasFeedback}
        feedbackRating={feedbackRating}
        editedSinceFeedback={editedSinceFeedback}
        isHovered={isHovered}
        isFocused={isFocused}
        toggleMinimized={toggleMinimized}
      />

      {/* Preview for minimized state */}
      {isMinimized && (
        <SectionPreview textValue={textValue} />
      )}

      {/* Editor Component - Only show when not minimized */}
      {!isMinimized && (
        <>
          <SectionEditor
            textValue={textValue}
            placeholder={section.placeholder}
            maxLength={section.maxLength}
            inputPlaceholder={section.inputPlaceholder}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            handleTextChange={handleTextChange}
          />
          
          {/* Feedback Button */}
          <FeedbackButton
            loading={loading}
            hasEditedContent={hasEditedContent}
            hasFeedback={hasFeedback}
            editedSinceFeedback={editedSinceFeedback}
            feedbackRating={feedbackRating}
            handleFeedbackRequest={handleFeedbackRequest}
          />
        </>
      )}
      
      {/* Fade gradient at bottom of minimized cards */}
      {isMinimized && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-200 to-transparent"></div>
      )}
    </div>
  );
};

export default SectionCard;
