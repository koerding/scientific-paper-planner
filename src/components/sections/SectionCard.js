// FILE: src/components/sections/SectionCard.js
// ADDED: Debug log for activeOption prop when rendering toggle section
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect for logging
import useAppStore from '../../store/appStore'; // Import the Zustand store
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader'; // Import the new ToggleHeader component
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';

const SectionCard = ({
  sectionId,
  isCurrentSection, // Is this the currently *focused* section?
  onRequestFeedback, // Callback to trigger feedback request for this section
  handleSectionFocus, // Callback to set this section as focused in parent
  options = null, // Toggle options (if this is a toggle section)
  activeOption = null, // Current active option (if this is a toggle section)
  onToggle = null, // Toggle callback (if this is a toggle section)
  isToggleSection = false, // Flag to identify if this is a toggle section
}) => {
  // --- Select State from Zustand Store ---
  // Select section data based on the sectionId prop
  const section = useAppStore(useCallback((state) => state.sections[sectionId], [sectionId]));
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // --- ADD THIS LOG ---
  useEffect(() => {
      if (isToggleSection) {
          console.log(`DEBUG [SectionCard for ${sectionId}]: Rendering toggle. Received activeOption = '${activeOption}'`);
      }
  }, [isToggleSection, sectionId, activeOption]);
  // --- END ADD ---

  // Local state for hover/focus within the card itself
  const [isHovered, setIsHovered] = useState(false);
  // Local state for tracking if the *textarea itself* has focus
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // --- Derived State ---
  const {
    title = 'Untitled', content = '', placeholder = 'Start writing...',
    isMinimized = true, aiInstructions, feedbackRating, editedSinceFeedback,
    maxLength
  } = section || {};
  const hasFeedback = !!feedbackRating;
  const hasOnlyPlaceholder = content === (placeholder || '') || content.trim() === '';

  // --- Callbacks ---
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

  // --- Styling ---
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

      {isMinimized && ( <SectionPreview textValue={content} /> )}

      {!isMinimized && (
        <>
           <SectionEditor
              sectionId={sectionId}
              textValue={content}
              placeholder={placeholder || "Start writing..."}
              maxLength={maxLength}
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
              handleTextChange={handleTextChange}
              // Pass hover/focus state if needed by editor styling
              // isHovered={isHovered}
              // isFocused={isTextareaFocused}
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
      )}

      {/* Gradient overlay for minimized cards */}
      {isMinimized && ( <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-100 via-gray-50 to-transparent pointer-events-none"></div> )}
    </div>
  );
};

// Check if SectionCard is memoized unnecessarily - remove if present
// export default React.memo(SectionCard); // If this line exists, remove React.memo
export default SectionCard; // Export normally
