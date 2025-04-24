// FILE: src/components/sections/SectionCard.js
// REVERTED: Removed direct store selection, relying on activeOption prop again.
// Kept direct render log for props.

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';
// Removed import for getApproachSectionIds, getDataMethodSectionIds

const SectionCard = ({
  sectionId,
  isCurrentSection,
  onRequestFeedback,
  handleSectionFocus,
  options = null,
  activeOption = null, // Prop received from parent (potentially stale)
  onToggle = null,
  isToggleSection = false,
}) => {

  // Log props received during render
  if (isToggleSection) {
    console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Received props -> sectionId='${sectionId}', activeOption='${activeOption}'`);
  }

  // Select section data based on the sectionId prop
  const section = useAppStore((state) => state.sections[sectionId]);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // Local state for hover/focus
  const [isHovered, setIsHovered] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Derived State from the selected section data
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {};
  const hasFeedback = !!feedbackRating;
  const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';

  // Callbacks
  const handleTextChange = useCallback((e) => {
       updateSectionContent(sectionId, e.target.value);
   }, [sectionId, updateSectionContent]);

   const handleToggleMinimize = useCallback((e) => {
       if(e) e.stopPropagation();
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

   const handleCardClick = () => {
       if (isMinimized) {
           handleToggleMinimize();
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


  // Styling
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  const getMaxHeight = () => !isMinimized ? 'max-h-[2000px]' : 'max-h-14';

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
         <ToggleHeader
           options={options || []}
           activeOption={activeOption} // Pass the potentially stale prop
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
                 hasEditedContent={!hasOnlyPlaceholder}
                 hasFeedback={hasFeedback}
                 editedSinceFeedback={editedSinceFeedback}
                 feedbackRating={feedbackRating}
                 handleFeedbackRequest={handleFeedbackRequest}
                 sectionId={sectionId}
               />
            </>
          )
      }

      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

export default SectionCard;
