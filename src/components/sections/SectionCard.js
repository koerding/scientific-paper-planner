// FILE: src/components/sections/SectionCard.js
// MODIFIED: Removed useCallback from selector, added direct prop logging
import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
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
  activeOption = null, // Prop we are tracking
  onToggle = null,
  isToggleSection = false,
}) => {

  // --- ADD DIRECT PROP LOGGING ---
  if (isToggleSection) {
    console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Received props -> sectionId='${sectionId}', activeOption='${activeOption}'`);
  }
  // --- END ADD ---


  // --- Select State from Zustand Store ---
  // MODIFIED: Removed useCallback from selector
  const section = useAppStore((state) => state.sections[sectionId]);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // --- Keep useEffect Log for comparison ---
  useEffect(() => {
      if (isToggleSection) {
          console.log(`DEBUG [SectionCard EFFECT for ${sectionId}]: Effect ran. Received activeOption = '${activeOption}'`);
      }
      // Ensure dependencies are correct if sectionId/activeOption might change together
  }, [isToggleSection, sectionId, activeOption]);
  // ---

  // Local state for hover/focus within the card itself
  const [isHovered, setIsHovered] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // --- Derived State ---
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {}; // Use section state selected above
  const hasFeedback = !!feedbackRating;
  const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';

  // --- Callbacks (remain the same) ---
  const handleTextChange = useCallback((e) => { /* ... */ }, [sectionId, updateSectionContent]);
  const handleToggleMinimize = useCallback((e) => { /* ... */ }, [sectionId, toggleMinimize, isMinimized, handleSectionFocus]);
  const handleFeedbackRequest = useCallback(() => { /* ... */ }, [sectionId, onRequestFeedback]);
  const handleCardClick = () => { /* ... */ };
  const handleEditorFocus = useCallback(() => { /* ... */ }, [sectionId, handleSectionFocus]);
  const handleEditorBlur = useCallback(() => { /* ... */ }, []);

  // --- Styling (remains the same) ---
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  const getMaxHeight = () => !isMinimized ? 'max-h-[2000px]' : 'max-h-14'; // Adjust max-height if needed

  const sectionClasses = `
    section-card rounded-md ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} ${!isMinimized ? 'expanded' : 'minimized'}
    ${getMaxHeight()} overflow-hidden relative
    ${isCurrentSection ? 'current-active' : ''}
    cursor-pointer ${isMinimized ? 'hover:bg-gray-100' : ''}
    ${isToggleSection ? 'toggle-section' : ''}
  `;

  return (
    <div
        className={sectionClasses}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
       {isToggleSection ? (
         // Use the ToggleHeader for toggle sections
         <ToggleHeader
           options={options || []}
           activeOption={activeOption} // Pass the prop down
           onToggle={onToggle}
           isMinimized={isMinimized}
           isHovered={isHovered || isTextareaFocused}
           isFocused={isCurrentSection}
           toggleMinimized={handleToggleMinimize}
         />
       ) : (
         // Use the regular SectionHeader for standard sections
         <SectionHeader
           title={title} // Derived from selected section state
           isMinimized={isMinimized} // Derived from selected section state
           hasFeedback={hasFeedback}
           feedbackRating={feedbackRating}
           editedSinceFeedback={editedSinceFeedback}
           isHovered={isHovered || isTextareaFocused}
           isFocused={isCurrentSection}
           toggleMinimized={handleToggleMinimize}
         />
       )}

      {isMinimized && ( <SectionPreview textValue={content /* Derived */} /> )}

      {!isMinimized && (
        <>
           <SectionEditor
              sectionId={sectionId}
              textValue={content /* Derived */}
              placeholder={placeholder || "Start writing..." /* Derived */}
              maxLength={maxLength /* Derived */}
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
              handleTextChange={handleTextChange}
           />

           <FeedbackButton
              hasEditedContent={!hasOnlyPlaceholder}
              hasFeedback={hasFeedback}
              editedSinceFeedback={editedSinceFeedback} // Derived
              feedbackRating={feedbackRating} // Derived
              handleFeedbackRequest={handleFeedbackRequest}
              sectionId={sectionId}
            />
        </>
      )}

      {/* Gradient overlay for minimized cards */}
      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

export default SectionCard;
