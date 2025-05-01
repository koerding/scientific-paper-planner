// FILE: src/components/sections/SectionCard.js
// Modified to use the EnhancedTooltip component with simplified ToggleHeader

import React, { useState, useCallback, useEffect } from 'react';
import useAppStore from '../../store/appStore';
import SectionHeader from './SectionHeader';
import ToggleHeader from './ToggleHeader';
import SectionPreview from './SectionPreview';
import SectionEditor from './SectionEditor';
import FeedbackButton from './FeedbackButton';
import EnhancedTooltip from '../common/EnhancedTooltip'; // Import the new tooltip component

const SectionCard = ({
  sectionId,
  isCurrentSection,
  onRequestFeedback,
  handleSectionFocus,
  options = null,
  activeOption = null,
  onToggle = null,
  isToggleSection = false,
}) => {

  // Direct prop logging (can be removed later)
  if (isToggleSection) {
    console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Received props -> sectionId='${sectionId}', activeOption='${activeOption}'`);
  }

  // Select State from Zustand Store
  const section = useAppStore((state) => state.sections[sectionId]);
  const updateSectionContent = useAppStore((state) => state.updateSectionContent);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);

  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // For tooltip display
  
  // Track first render for toggle sections to show tooltip initially
  const [isInitialRender, setIsInitialRender] = useState(isToggleSection);

  // Check localStorage to see if we've shown the toggle tooltip before
  const [hasSeenTooltip, setHasSeenTooltip] = useState(() => {
    try {
      return localStorage.getItem(`toggle-tooltip-seen-${sectionId}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Effect to show tooltip briefly after the component mounts
  // but only for toggle sections when they first appear
  useEffect(() => {
    if (isToggleSection && isInitialRender && !hasSeenTooltip) {
      // Show the tooltip for 6 seconds
      setShowTooltip(true);
      
      // Mark as seen in localStorage
      try {
        localStorage.setItem(`toggle-tooltip-seen-${sectionId}`, 'true');
        setHasSeenTooltip(true);
      } catch (e) {
        console.warn('Could not save tooltip preference to localStorage');
      }
      
      // Set a timer to hide the tooltip
      const timer = setTimeout(() => {
        setShowTooltip(false);
        setIsInitialRender(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [isToggleSection, isInitialRender, hasSeenTooltip, sectionId]);

  // Derived State
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

  // --- Styling ---
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  // Define classes based on minimized state
  const minimizedClasses = 'max-h-14 overflow-hidden'; // Classes for minimized state
  const expandedClasses = ''; // No height/overflow constraints for expanded state

  const sectionClasses = `
    section-card rounded-md ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} ${!isMinimized ? 'expanded' : 'minimized'}
    ${isMinimized ? minimizedClasses : expandedClasses} relative {/* Apply correct classes */}
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
         <div className="relative">
           <ToggleHeader
             options={options || []}
             activeOption={activeOption}
             onToggle={onToggle}
             isMinimized={isMinimized}
             isHovered={isHovered || isTextareaFocused}
             isFocused={isCurrentSection}
             toggleMinimized={handleToggleMinimize}
           />
           {/* Use the EnhancedTooltip component for toggle sections */}
           <EnhancedTooltip 
             show={showTooltip} 
             autoDismissAfter={6000} 
             position="bottom"
             className="text-center font-medium"
           >
             Please select one option. This choice affects your research framework.
           </EnhancedTooltip>
         </div>
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

export default SectionCard;// FILE: src/components/sections/SectionCard.js
// MODIFIED: Removed max-height and overflow-hidden for expanded cards

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
}) => {

  // Direct prop logging (can be removed later)
  if (isToggleSection) {
    console.log(`DEBUG [SectionCard RENDER for ${sectionId}]: Received props -> sectionId='${sectionId}', activeOption='${activeOption}'`);
  }

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


  // --- Styling ---
  const getBorderClasses = () => isCurrentSection ? 'border-4 border-blue-500 shadow-md' : 'border-2 border-gray-300';
  const getBackgroundColor = () => isCurrentSection ? 'bg-blue-50' : 'bg-white';
  // *** MODIFIED: Define classes based on minimized state ***
  const minimizedClasses = 'max-h-14 overflow-hidden'; // Classes for minimized state
  const expandedClasses = ''; // No height/overflow constraints for expanded state

  const sectionClasses = `
    section-card rounded-md ${getBackgroundColor()} p-2 mb-2 transition-all
    duration-300 ease-in-out ${getBorderClasses()} ${!isMinimized ? 'expanded' : 'minimized'}
    ${isMinimized ? minimizedClasses : expandedClasses} relative {/* Apply correct classes */}
    ${isCurrentSection ? 'current-active' : ''}
    cursor-pointer ${isMinimized ? 'hover:bg-gray-100' : ''}
    ${isToggleSection ? 'toggle-section' : ''}
  `;
  // *** END MODIFICATION ***

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
