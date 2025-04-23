// FILE: src/components/sections/SectionCard.js
import React, { useState, useCallback } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import SectionHeader from './SectionHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

const SectionCard = ({
  sectionId,
  isCurrentSection, // Is this the currently *focused* section?
  onRequestFeedback, // Callback to trigger feedback request for this section
  handleSectionFocus, // Callback to set this section as focused in parent
}) => {
  // --- Select State from Zustand Store ---
  const section = useAppStore(useCallback((state) => state.sections[sectionId], [sectionId]));
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // Local state for hover/focus within the card itself
  const [isHovered, setIsHovered] = useState(false);
  // Local state for tracking if the *textarea itself* has focus
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // --- Derived State ---
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength // Get maxLength if needed for editor
  } = section || {};
  const hasFeedback = !!feedbackRating;
  const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';
  const isLoadingFeedback = false; // Placeholder for actual loading state

  // --- Callbacks ---
  const handleTextChange = useCallback((e) => {
    updateSectionContent(sectionId, e.target.value);
  }, [sectionId, updateSectionContent]);

  const handleToggleMinimize = useCallback((e) => {
      if(e) e.stopPropagation();
      toggleMinimize(sectionId);
      // If expanding, set focus to this section in parent
       if (isMinimized && typeof handleSectionFocus === 'function') { // check isMinimized before toggle
            handleSectionFocus(sectionId);
       }
  }, [sectionId, toggleMinimize, isMinimized, handleSectionFocus]);

  const handleFeedbackRequest = useCallback(() => {
    if (typeof onRequestFeedback === 'function') {
        onRequestFeedback(sectionId);
    }
  }, [sectionId, onRequestFeedback]);

   // Set focus in parent when the card area (outside textarea) is clicked
   const handleCardClick = () => {
      if (isMinimized) {
          handleToggleMinimize(); // This already handles focus when expanding
      } else if (typeof handleSectionFocus === 'function') {
        // If already expanded, just set focus
        handleSectionFocus(sectionId);
      }
   };

   // Callback for when the SectionEditor's textarea gains focus
   const handleEditorFocus = useCallback(() => {
       setIsTextareaFocused(true);
       // Also trigger the parent's focus handler
       if (typeof handleSectionFocus === 'function') {
           handleSectionFocus(sectionId);
       }
   }, [sectionId, handleSectionFocus]);

   // Callback for when the SectionEditor's textarea loses focus
   const handleEditorBlur = useCallback(() => {
       setIsTextareaFocused(false);
   }, []);


  // --- Styling ---
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  const getMaxHeight = () => !isMinimized ? 'max-h-[2000px]' : 'max-h-14';

  const sectionClasses = `
    section-card rounded-md ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} ${!isMinimized ? 'expanded' : 'minimized'}
    ${getMaxHeight()} overflow-hidden relative
    ${isCurrentSection ? 'current-active' : ''}
    cursor-pointer ${isMinimized ? 'hover:bg-gray-100' : ''}
  `;

  return (
    <div
        className={sectionClasses}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // ref is removed as it wasn't used and caused potential errors
      >
      {/* Pass parent focus state (isCurrentSection) for header highlight */}
       <SectionHeader
         title={title}
         isMinimized={isMinimized}
         hasFeedback={hasFeedback}
         feedbackRating={feedbackRating}
         editedSinceFeedback={editedSinceFeedback}
         isHovered={isHovered || isTextareaFocused} // Show edit icon on hover or if textarea focused
         isFocused={isCurrentSection} // Highlight based on parent's focus state
         toggleMinimized={handleToggleMinimize}
       />

      {/* Preview for minimized state */}
      {isMinimized && ( <SectionPreview textValue={content} /> )}

      {/* Editor Component - Only show when expanded */}
      {!isMinimized && (
        <>
          {/* Remove the stopPropagation wrapper div */}
          {/* <div onClick={(e) => e.stopPropagation()}> */}
              <SectionEditor
                 sectionId={sectionId} // Pass sectionId for context if needed
                 textValue={content}
                 placeholder={placeholder || "Start writing..."}
                 maxLength={maxLength}
                 // --- Pass focus handlers down ---
                 onFocus={handleEditorFocus}
                 onBlur={handleEditorBlur}
                 // Pass other props for consistency, though not used by editor directly here
                 isHovered={isHovered}
                 handleTextChange={handleTextChange}
              />
          {/* </div> */}

          <FeedbackButton
             loading={isLoadingFeedback}
             hasEditedContent={!hasOnlyPlaceholder}
             hasFeedback={hasFeedback}
             editedSinceFeedback={editedSinceFeedback}
             feedbackRating={feedbackRating}
             handleFeedbackRequest={handleFeedbackRequest}
           />
        </>
      )}

      {/* Fade gradient at bottom of minimized cards */}
      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

export default SectionCard;
