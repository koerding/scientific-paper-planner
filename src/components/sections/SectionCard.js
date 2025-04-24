// FILE: src/components/sections/SectionCard.js
// MODIFIED: Directly select active toggle state from store when rendering ToggleHeader

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore'; // Import the Zustand store
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';
import { getApproachSectionIds, getDataMethodSectionIds } from '../../utils/sectionOrderUtils'; // Import utils

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

  // Direct prop logging (can be removed later)
  if (isToggleSection) {
    console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Received props -> sectionId='${sectionId}', activeOption='${activeOption}' (Prop from Parent)`);
  }

  // Select section data based on the current sectionId prop
  const section = useAppStore((state) => state.sections[sectionId]);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // --- Directly select the activeToggles state from the store ---
  const currentActiveToggles = useAppStore((state) => state.activeToggles);

  // --- Determine the CURRENT active option directly from the store ---
  let currentActiveOptionFromStore = activeOption; // Default to prop
  if (isToggleSection) {
      const approachIds = getApproachSectionIds();
      const dataMethodIds = getDataMethodSectionIds();
      if (approachIds.includes(sectionId)) { // Check if this card represents an approach toggle
          currentActiveOptionFromStore = currentActiveToggles.approach;
          console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Determined group 'approach'. Active from store = '${currentActiveOptionFromStore}'`);
      } else if (dataMethodIds.includes(sectionId)) { // Check if this card represents a data method toggle
          currentActiveOptionFromStore = currentActiveToggles.dataMethod;
           console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Determined group 'dataMethod'. Active from store = '${currentActiveOptionFromStore}'`);
      }
  }
  // --- End Direct State Selection ---

  // useEffect Log (can be removed later)
  useEffect(() => {
      if (isToggleSection) {
          console.log(`DEBUG [SectionCard EFFECT for ${sectionId}]: Effect ran. Received activeOption prop = '${activeOption}', Active from store = '${currentActiveOptionFromStore}'`);
      }
  }, [isToggleSection, sectionId, activeOption, currentActiveOptionFromStore]);


  // Local state for hover/focus
  const [isHovered, setIsHovered] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Derived State from the selected section data
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {}; // Use section state selected based on sectionId prop
  const hasFeedback = !!feedbackRating;
  const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';

  // --- Callbacks ---
   const handleTextChange = useCallback((e) => {
       updateSectionContent(sectionId, e.target.value);
   }, [sectionId, updateSectionContent]);

   const handleToggleMinimize = useCallback((e) => {
       if(e) e.stopPropagation();
       toggleMinimize(sectionId);
       // Focus the card if expanding
       if (isMinimized && typeof handleSectionFocus === 'function') {
            handleSectionFocus(sectionId);
       }
   }, [sectionId, toggleMinimize, isMinimized, handleSectionFocus]); // Added missing deps

   const handleFeedbackRequest = useCallback(() => {
       if (typeof onRequestFeedback === 'function') {
           onRequestFeedback(sectionId);
       }
   }, [sectionId, onRequestFeedback]);

   const handleCardClick = () => {
       // Expand if minimized, otherwise ensure it's focused
       if (isMinimized) {
           handleToggleMinimize(); // This already calls handleSectionFocus if needed
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
           // *** MODIFIED: Use the value read directly from the store ***
           activeOption={currentActiveOptionFromStore}
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

      {/* Gradient overlay for minimized cards */}
      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

export default SectionCard;
