// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
// ... other imports

const SinglePanelLayout = ({
  // ... props
}) => {
  // ... state variables (mouseDown, setMouseDown, mouseStartX, setMouseStartX, mouseMoveX, setMouseMoveX, etc.)
  // ... other refs and constants (swipeThreshold, swipeActiveThreshold)
  // ... other functions (handleSwitchToGuide, handleSwitchToWrite, hasParentWithClass, touch handlers)

  const handleMouseDown = (e) => {
    console.log('[DEBUG] handleMouseDown: Entry. Target:', e.target, 'Button:', e.button);
    if (e.button !== 0) {
      console.log('[DEBUG] handleMouseDown: Non-left button, returning.');
      return;
    }
    
    const isTextarea = e.target.tagName === 'TEXTAREA';
    const isInput = e.target.tagName === 'INPUT';
    const isContentEditable = e.target.isContentEditable;
    const hasSectionEditorClass = e.target.classList.contains('section-editor');
    const hasParentSectionEditor = hasParentWithClass(e.target, 'section-editor');
    const hasParentProseMirror = hasParentWithClass(e.target, 'ProseMirror');

    console.log('[DEBUG] handleMouseDown: Conditions:', {
        isTextarea, isInput, isContentEditable, hasSectionEditorClass,
        hasParentSectionEditor, hasParentProseMirror,
    });

    if (isTextarea || isInput || isContentEditable || hasSectionEditorClass || hasParentSectionEditor || hasParentProseMirror) {
      console.log('[DEBUG] handleMouseDown: Editable content detected, returning.');
      return;
    }
    
    console.log('[DEBUG] handleMouseDown: Proceeding to set mouse state. ClientX:', e.clientX);
    setMouseDown(true);
    setMouseStartX(e.clientX);
    setMouseMoveX(e.clientX); 
    
    document.body.style.cursor = 'grab'; 
    document.body.classList.add('mouse-swiping');
    console.log('[DEBUG] handleMouseDown: Mouse state set. mouseDown:', true, 'mouseStartX:', e.clientX);
  };
  
  const handleMouseMove = (e) => {
    // Check if we should be processing mouse move
    if (!mouseDown || mouseStartX === null) {
      // It's possible this fires once if mouseup happens before this, and mouseDown is already false.
      // console.log('[DEBUG] handleMouseMove: Bailing early. mouseDown:', mouseDown, 'mouseStartX:', mouseStartX);
      return;
    }
    
    // ***** UNCOMMENT/ADD THE FOLLOWING LOGS *****
    console.log('[DEBUG] handleMouseMove: Entry. ClientX:', e.clientX, 'Current mouseDown:', mouseDown, 'Current mouseStartX:', mouseStartX); 
    
    const currentMoveX = e.clientX;
    setMouseMoveX(currentMoveX); // This is the crucial line
    
    const distance = currentMoveX - (mouseStartX || 0); // Ensure mouseStartX is not null for calculation
    console.log('[DEBUG] handleMouseMove: Set mouseMoveX to:', currentMoveX, '. New state mouseMoveX (after set*):', mouseMoveX, 'Calculated Distance:', distance, 'ActiveThreshold:', swipeActiveThreshold); 
    // Note: `mouseMoveX` in the log above will show the value from the *previous* render due to state closure. 
    // Check the next `handleMouseUp` or subsequent `handleMouseMove` for the updated value if it re-renders.

    if (Math.abs(distance) > swipeActiveThreshold) {
      document.body.style.cursor = 'grabbing';
      document.body.setAttribute('data-swipe-direction', distance > 0 ? 'right' : 'left');
      console.log('[DEBUG] handleMouseMove: Cursor set to grabbing. Direction:', distance > 0 ? 'right' : 'left');
    } else {
       if (mouseDown) { 
        document.body.style.cursor = 'grab';
        console.log('[DEBUG] handleMouseMove: Cursor reverted to grab.');
       }
    }
  };
  
  const handleMouseUp = (e) => {
    // It's good practice to check mouseDown status at the beginning of event handlers like mouseup
    if (!mouseDown && mouseStartX === null) { // Check if we even started a swipe
        console.log('[DEBUG] handleMouseUp: Mouseup without an active mousedown sequence or mouseStartX. Ignoring.');
        // Reset any lingering global styles just in case
        document.body.style.cursor = ''; 
        document.body.classList.remove('mouse-swiping');
        document.body.removeAttribute('data-swipe-direction');
        // Ensure state is fully reset if it somehow got partially set
        setMouseDown(false);
        setMouseStartX(null);
        setMouseMoveX(null);
        return;
    }

    console.log('[DEBUG] handleMouseUp: Entry. Current mouseDown:', mouseDown, 'mouseStartX:', mouseStartX, 'current state mouseMoveX:', mouseMoveX);
    
    // Fallback for mouseMoveX if it somehow remained null, though it's initialized in handleMouseDown
    const currentMouseMoveX = mouseMoveX === null ? (mouseStartX || 0) : mouseMoveX;
    const finalDistance = currentMouseMoveX - (mouseStartX || 0); // Ensure mouseStartX is not null
    const isSignificantSwipe = Math.abs(finalDistance) > swipeThreshold;
    
    console.log('[DEBUG] handleMouseUp: finalDistance:', finalDistance, 'SwipeThreshold:', swipeThreshold, 'IsSignificantSwipe:', isSignificantSwipe, 'Current uiMode:', uiMode);
    
    if (isSignificantSwipe) {
      if (finalDistance > 0) {
        console.log('[DEBUG] handleMouseUp: Swipe Right detected.');
        if (uiMode === 'guide') {
          console.log('[DEBUG] handleMouseUp: Switching to Write mode.');
          handleSwitchToWrite();
        } else {
          console.log('[DEBUG] handleMouseUp: Already in Write mode or other, no switch for right swipe.');
        }
      } else { 
        console.log('[DEBUG] handleMouseUp: Swipe Left detected.');
        if (uiMode === 'write') {
          console.log('[DEBUG] handleMouseUp: Switching to Guide mode.');
          handleSwitchToGuide();
        } else {
          console.log('[DEBUG] handleMouseUp: Already in Guide mode or other, no switch for left swipe.');
        }
      }
    } else {
        console.log('[DEBUG] handleMouseUp: Swipe not significant.');
    }
    
    console.log('[DEBUG] handleMouseUp: Resetting state.');
    setMouseDown(false);
    setMouseStartX(null);
    setMouseMoveX(null); // Explicitly reset mouseMoveX
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  };

  useEffect(() => {
    const boundMouseMove = (e) => handleMouseMove(e);
    const boundMouseUp = (e) => handleMouseUp(e);

    if (mouseDown) {
      // ***** ADD THIS LOG *****
      console.log('[DEBUG] useEffect: Adding document mousemove and mouseup listeners because mouseDown is true. mouseStartX:', mouseStartX);
      document.addEventListener('mousemove', boundMouseMove);
      document.addEventListener('mouseup', boundMouseUp);
    } else {
      // This block is important for understanding if listeners are NOT added when mouseDown becomes false.
      // The actual removal happens in the cleanup function.
      // console.log('[DEBUG] useEffect: mouseDown is false. Listeners will be (or have been) removed by cleanup.');
    }

    return () => {
      // ***** ADD THIS LOG *****
      console.log('[DEBUG] useEffect: Cleanup. Removing document mousemove and mouseup listeners. The mouseDown state for *this* effect closure was:', mouseDown);
      document.removeEventListener('mousemove', boundMouseMove);
      document.removeEventListener('mouseup', boundMouseUp);
    };
  }, [mouseDown, mouseStartX]); // Added mouseStartX to dependencies, as it's crucial for starting the drag.
                                // This ensures if mouseStartX changes for any reason while mouseDown is true, listeners are correctly bound with new context.
                                // However, simpler [mouseDown] is often sufficient if mouseStartX is only set when mouseDown becomes true.
                                // Let's stick to [mouseDown, mouseStartX] for robustness given the current issue.

  // ... rest of the component including return statement
  // Ensure all functions like handleSwitchToWrite, handleSwitchToGuide, etc. are defined
  // Ensure all state variables like uiMode, swipeThreshold etc. are defined

  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown}
      role="application" 
    >
      {/* ... rest of your JSX from the previous correct version ... */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20"
        aria-live="polite"
      >
        <div 
          ref={cardContainerRef}
          className="card-container overflow-hidden rounded-lg shadow-sm hover:shadow-md 
                   transition-shadow border border-gray-200"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="region"
          aria-label={`${uiMode} mode panel, swipe to switch modes`}
        >
          <div 
            ref={panelsContainerRef}
            className="panels-container relative"
            style={{
              display: 'flex',
              transition: isSwiping || mouseDown ? 'none' : 'transform 200ms ease-in-out',
              transform: `translateX(${uiMode === 'guide' ? '-50%' : '0%'})`,
              width: '200%',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Write Mode Panel */}
            <div className="panel write-panel w-1/2 flex-shrink-0">
              <div className="bg-white rounded-t-lg px-5 py-3 flex items-center min-h-[3.5rem]">
                <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              </div>
              <div className="bg-white px-5 py-4">
                <LeftPanel
                  activeSection={activeSectionId}
                  handleSectionFocus={handleSectionFocus}
                  handleApproachToggle={handleApproachToggle}
                  handleDataMethodToggle={handleDataMethodToggle}
                  handleMagic={handleMagic}
                  proMode={proMode}
                  onRequestFeedback={handleSwitchToGuide}
                  contentRef={contentRef}
                />
              </div>
            </div>
            
            {/* Guide Mode Panel */}
            <div className="panel guide-panel w-1/2 flex-shrink-0">
              <div className="bg-white rounded-t-lg px-5 py-3 flex items-center min-h-[3.5rem]">
                <button
                  onClick={handleSwitchToWrite}
                  className="write-mode-button text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors mr-3"
                  aria-label="Switch to Write mode"
                  title="Switch to Write mode"
                >
                  <span className="text-xl">◀✎</span>
                </button>
                <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              </div>
              <div className="bg-white px-5 py-4">
                <FullHeightInstructionsPanel
                  key={`guide-${activeSectionId}`}
                  activeSectionId={activeSectionId}
                  improveInstructions={handleMagic}
                  loading={isAnyAiLoading}
                  onRequestWrite={handleSwitchToWrite}
                />
              </div>
            </div>
          </div>
          <div className="swipe-hint"></div>
        </div>
      </div>
    </div>
  );
};

export default SinglePanelLayout;
