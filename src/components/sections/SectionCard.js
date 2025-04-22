// src/components/sections/SectionCard.js
import React from 'react';
import { useProjectSection } from '../../hooks/useProjectSection';
import SectionHeader from './SectionHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

/**
 * Section card component for displaying and editing a section
 * Refactored to use the new context architecture
 */
const SectionCard = ({ section, isCurrentSection }) => {
  // Use our custom hook to get all data and functionality
  const {
    content,
    setContent,
    placeholder,
    isExpanded,
    toggleSection,
    hasBeenEdited,
    hasFeedback,
    feedbackRating,
    editedSinceFeedback,
    isEditing,
    setIsEditing,
    requestFeedback,
    handleSignificantEdit,
    lastFeedbackTime
  } = useProjectSection(section.id);

  // Handle text changes
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const currentValue = content;
    
    // Set the new content
    setContent(newValue);
    
    // Determine if this is a significant change
    if (Math.abs(newValue.length - currentValue.length) > 15) {
      handleSignificantEdit();
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
    return isExpanded ? 'max-h-[2000px]' : 'max-h-14';
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
    ${isExpanded ? 'expanded' : 'minimized'}
    ${getMaxHeight()}
    overflow-hidden
    relative
    ${isCurrentSection ? 'current-active' : ''}
  `;

  return (
    <div
      className={sectionClasses}
    >
      {/* Header Component */}
      <SectionHeader
        title={section.title}
        isMinimized={!isExpanded}
        hasFeedback={hasFeedback}
        feedbackRating={feedbackRating}
        editedSinceFeedback={editedSinceFeedback}
        isHovered={isEditing}
        isFocused={isEditing}
        toggleMinimized={toggleSection}
      />

      {/* Preview for minimized state */}
      {!isExpanded && (
        <SectionPreview textValue={content} />
      )}

      {/* Editor Component - Only show when not minimized */}
      {isExpanded && (
        <>
          <SectionEditor
            textValue={content}
            placeholder={placeholder}
            maxLength={section.maxLength}
            inputPlaceholder={section.inputPlaceholder}
            isFocused={isEditing}
            setIsFocused={setIsEditing}
            isHovered={isEditing}
            setIsHovered={setIsEditing}
            handleTextChange={handleTextChange}
          />
          
          {/* Feedback Button */}
          <FeedbackButton
            loading={false} // Will be connected to feedback loading state
            hasEditedContent={hasBeenEdited}
            hasFeedback={hasFeedback}
            editedSinceFeedback={editedSinceFeedback}
            feedbackRating={feedbackRating}
            handleFeedbackRequest={requestFeedback}
          />
        </>
      )}
      
      {/* Fade gradient at bottom of minimized cards */}
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-200 to-transparent"></div>
      )}
    </div>
  );
};

export default SectionCard;
