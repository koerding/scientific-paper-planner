// FILE: src/components/sections/SectionCard.js
import React, { useState, useCallback } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import SectionHeader from './SectionHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

// Removed useProjectSection hook import

const SectionCard = ({
  sectionId,
  isCurrentSection, // Is this the currently *focused* section?
  onRequestFeedback, // Callback to trigger feedback request for this section
  handleSectionFocus, // Callback to set this section as focused
}) => {
  // --- Select State from Zustand Store for this specific section ---
  const section = useAppStore(useCallback((state) => state.sections[sectionId], [sectionId]));
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // Local state for hover/focus within the card itself
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false); // Tracks if the textarea has focus

  // --- Derived State ---
  const {
    title = 'Untitled',
    content = '',
    placeholder = 'Start writing...', // Get placeholder from section data if available
    isMinimized = true,
    aiInstructions, // Contains feedback data structure if available
    feedbackRating,
    editedSinceFeedback,
  } = section || {}; // Use default values if section is not found

  const hasFeedback = !!feedbackRating; // Determine if feedback exists based on rating

  // --- Callbacks ---
  const handleTextChange = useCallback((e) => {
    updateSectionContent(sectionId, e.target.value);
  }, [sectionId, updateSectionContent]);

  const handleToggleMinimize = useCallback((e) => {
      if(e) e.stopPropagation();
      toggleMinimize(sectionId);
      // If expanding, set focus to this section
       if (!isMinimized) {
            handleSectionFocus(sectionId);
       }
  }, [sectionId, toggleMinimize, isMinimized, handleSectionFocus]);

  const handleFeedbackRequest = useCallback(() => {
    onRequestFeedback(sectionId); // Call the parent handler with this section's ID
  }, [sectionId, onRequestFeedback]);

   // Set focus when the card area (outside textarea) is clicked
   const handleCardClick = () => {
      if (isMinimized) {
          handleToggleMinimize(); // Expand if minimized
      }
      handleSectionFocus(sectionId); // Set focus in parent
   };

  // --- Styling ---
  const getBorderClasses = () => {
    return isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  };

  const getBackgroundColor = () => {
    return isCurrentSection ? 'bg-blue-50' : 'bg-white';
  };

  const getMaxHeight = () => {
    return !isMinimized ? 'max-h-[2000px]' : 'max-h-14'; // Use !isMinimized for expanded state
  };

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
    ${!isMinimized ? 'expanded' : 'minimized'}
    ${getMaxHeight()}
    overflow-hidden
    relative
    ${isCurrentSection ? 'current-active' : ''}
    cursor-pointer ${isMinimized ? 'hover:bg-gray-100' : ''}
  `;

  // Determine if content is effectively empty (only placeholder or whitespace)
   const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';


  // Loading state would typically come from a central place or context if needed globally
  // For now, assume feedback button handles its own local loading or gets it via props if necessary.
  const isLoadingFeedback = false; // Replace with actual loading state if available

  return (
    <div
        className={sectionClasses}
        onClick={handleCardClick} // Handle clicks on the card area
        onMouseEnter={() => setIsHovered(true)} // Track hover state
        onMouseLeave={() => setIsHovered(false)}
        ref={sectionRefs.current[sectionId]} // Attach ref if needed for scrolling
      >
      {/* Header Component */}
       <SectionHeader
         title={title}
         isMinimized={isMinimized}
         hasFeedback={hasFeedback}
         feedbackRating={feedbackRating}
         editedSinceFeedback={editedSinceFeedback}
         isHovered={isHovered || isFocused} // Show edit icon on hover or focus
         isFocused={isCurrentSection} // Highlight based on parent's focus state
         toggleMinimized={handleToggleMinimize} // Pass the specific toggle function
       />


      {/* Preview for minimized state */}
      {isMinimized && (
        <SectionPreview textValue={content} />
      )}

      {/* Editor Component - Only show when expanded */}
      {!isMinimized && (
        <>
          {/* Prevent card click propagation when clicking inside editor */}
          <div onClick={(e) => e.stopPropagation()}>
              <SectionEditor
                 textValue={content}
                 placeholder={placeholder || "Start writing..."} // Use specific placeholder
                 maxLength={section?.maxLength} // Pass maxLength if defined in section data
                 isFocused={isFocused} // Pass local focus state
                 setIsFocused={setIsFocused} // Allow editor to update local focus state
                 isHovered={isHovered} // Pass local hover state
                 setIsHovered={setIsHovered} // Allow editor to update local hover state
                 handleTextChange={handleTextChange} // Pass text change handler
              />
          </div>

          {/* Feedback Button */}
           <FeedbackButton
             loading={isLoadingFeedback} // Pass loading state if available
             hasEditedContent={!hasOnlyPlaceholder} // Enable if not just placeholder
             hasFeedback={hasFeedback}
             editedSinceFeedback={editedSinceFeedback}
             feedbackRating={feedbackRating}
             handleFeedbackRequest={handleFeedbackRequest} // Pass the request handler
           />
        </>
      )}

      {/* Fade gradient at bottom of minimized cards */}
      {isMinimized && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div>
      )}
    </div>
  );
};

// Dummy ref object for standalone rendering if needed, replace with actual ref logic in parent
const sectionRefs = { current: {} };

export default SectionCard;
