// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager';
import { isTouchDevice, setupSwipeHint } from '../../utils/touchDetection';

// ... (keep other imports and component setup as is)

const SinglePanelLayout = ({
  activeSection,
  activeApproach,
  activeDataMethod,
  handleSectionFocus,
  handleApproachToggle,
  handleDataMethodToggle,
  proMode,
  handleMagic,
}) => {
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);
  // ... (keep other state and refs as is)

  // Helper function to check if element has parent with class (keep this as is)
  const hasParentWithClass = (element, className) => {
    if (!element) return false;
    let parent = element.parentElement;
    while (parent) {
      if (parent.classList && parent.classList.contains(className)) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  // ... (useEffect hooks and other handlers like handleSwitchToGuide, handleTouchStart etc. remain as is)

  // ------- MOUSE GESTURE HANDLERS --------
  
  const handleMouseDown = (e) => {
    // DEBUG: Log entry and initial state
    console.log('[DEBUG] handleMouseDown: Entry. Target:', e.target, 'Button:', e.button);

    if (e.button !== 0) {
      // DEBUG: Log non-left button click
      console.log('[DEBUG] handleMouseDown: Non-left button, returning.');
      return;
    }
    
    // DEBUG: Log conditions before checking them
    const isTextarea = e.target.tagName === 'TEXTAREA';
    const isInput = e.target.tagName === 'INPUT';
    const isContentEditable = e.target.isContentEditable;
    const hasSectionEditorClass = e.target.classList.contains('section-editor');
    const hasParentSectionEditor = hasParentWithClass(e.target, 'section-editor');
    const hasParentProseMirror = hasParentWithClass(e.target, 'ProseMirror');

    console.log('[DEBUG] handleMouseDown: Conditions:', {
        isTextarea,
        isInput,
        isContentEditable,
        hasSectionEditorClass,
        hasParentSectionEditor,
        hasParentProseMirror,
    });

    if (isTextarea || isInput || isContentEditable || hasSectionEditorClass || hasParentSectionEditor || hasParentProseMirror) {
      // DEBUG: Log reason for returning
      console.log('[DEBUG] handleMouseDown: Editable content detected, returning.');
      return;
    }
    
    // DEBUG: Log before setting state
    console.log('[DEBUG] handleMouseDown: Proceeding to set mouse state. ClientX:', e.clientX);
    setMouseDown(true);
    setMouseStartX(e.clientX);
    setMouseMoveX(e.clientX);
    
    document.body.style.cursor = 'grab'; 
    document.body.classList.add('mouse-swiping');
    // DEBUG: Log after setting state
    console.log('[DEBUG] handleMouseDown: Mouse state set. mouseDown:', true, 'mouseStartX:', e.clientX);
  };
  
  const handleMouseMove = (e) => {
    if (!mouseDown || mouseStartX === null) return;

    // DEBUG: Log entry and current state
    // console.log('[DEBUG] handleMouseMove: Entry. ClientX:', e.clientX, 'Current mouseDown:', mouseDown, 'Current mouseStartX:', mouseStartX);
    
    const currentMouseMoveX = e.clientX;
    setMouseMoveX(currentMouseMoveX);
    
    const distance = currentMouseMoveX - mouseStartX;
    // DEBUG: Log distance
    // console.log('[DEBUG] handleMouseMove: Distance:', distance, 'ActiveThreshold:', swipeActiveThreshold);
    
    if (Math.abs(distance) > swipeActiveThreshold) {
      document.body.style.cursor = 'grabbing';
      document.body.setAttribute('data-swipe-direction', distance > 0 ? 'right' : 'left');
      // DEBUG: Log cursor change to grabbing
      // console.log('[DEBUG] handleMouseMove: Cursor set to grabbing. Direction:', distance > 0 ? 'right' : 'left');
    } else {
       if (mouseDown) {
        document.body.style.cursor = 'grab';
        // console.log('[DEBUG] handleMouseMove: Cursor reverted to grab.');
       }
    }
  };
  
  const handleMouseUp = (e) => {
    // DEBUG: Log entry and current state
    console.log('[DEBUG] handleMouseUp: Entry. mouseDown:', mouseDown, 'mouseStartX:', mouseStartX, 'mouseMoveX:', mouseMoveX);

    if (!mouseDown || mouseStartX === null) {
      console.log('[DEBUG] handleMouseUp: Not a tracked mouse down or mouseStartX is null, cleaning up.');
      setMouseDown(false);
      setMouseStartX(null);
      setMouseMoveX(null);
      document.body.style.cursor = ''; 
      document.body.classList.remove('mouse-swiping');
      document.body.removeAttribute('data-swipe-direction');
      return;
    }
    
    const finalMouseMoveX = mouseMoveX; // Use the state value
    const distance = finalMouseMoveX - mouseStartX;
    const isSignificantSwipe = Math.abs(distance) > swipeThreshold;
    
    // DEBUG: Log distance and swipe decision
    console.log('[DEBUG] handleMouseUp: Distance:', distance, 'SwipeThreshold:', swipeThreshold, 'IsSignificantSwipe:', isSignificantSwipe, 'Current uiMode:', uiMode);
    
    if (isSignificantSwipe) {
      if (distance > 0) {
        console.log('[DEBUG] handleMouseUp: Swipe Right detected.');
        if (uiMode === 'guide') {
          console.log('[DEBUG] handleMouseUp: Switching to Write mode.');
          handleSwitchToWrite();
        } else {
          console.log('[DEBUG] handleMouseUp: Already in Write mode or other, no switch.');
        }
      } else {
        console.log('[DEBUG] handleMouseUp: Swipe Left detected.');
        if (uiMode === 'write') {
          console.log('[DEBUG] handleMouseUp: Switching to Guide mode.');
          handleSwitchToGuide();
        } else {
          console.log('[DEBUG] handleMouseUp: Already in Guide mode or other, no switch.');
        }
      }
    } else {
        console.log('[DEBUG] handleMouseUp: Swipe not significant.');
    }
    
    console.log('[DEBUG] handleMouseUp: Resetting state.');
    setMouseDown(false);
    setMouseStartX(null);
    setMouseMoveX(null);
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  };

  // Ensure the mousemove and mouseup listeners are correctly set up in useEffect
  useEffect(() => {
    // DEBUG: Log effect registration
    // console.log('[DEBUG] useEffect for mouse listeners: Registering. mouseDown:', mouseDown);
    
    // Define handlers within useEffect or ensure they are stable if defined outside
    // The current `handleMouseMove` and `handleMouseUp` rely on state variables like `mouseDown`, `mouseStartX`, `mouseMoveX`
    // which are updated by their respective setters.
    // The functions themselves are stable if not recreated on every render unless their dependencies change.
    // Given they are defined in the component scope, they are recreated on each render.
    // The dependency array [mouseDown, mouseStartX] for this useEffect is key.

    const currentHandleMouseMove = (e) => {
        // This inner function will close over the `mouseDown`, `mouseStartX` etc. from the render it was defined in.
        // This is why the dependency array is important, to re-bind when those values crucial for starting/tracking change.
        // However, setMouseMoveX will schedule a re-render, and the new mouseMoveX value will be available in the *next* render's mouse handlers.
        handleMouseMove(e);
    };

    const currentHandleMouseUp = (e) => {
        handleMouseUp(e);
    };

    if (mouseDown) { // Only add mousemove and mouseup if mouse is actually down
        // console.log('[DEBUG] useEffect for mouse listeners: Actually ADDING mousemove/mouseup to document.');
        document.addEventListener('mousemove', currentHandleMouseMove);
        document.addEventListener('mouseup', currentHandleMouseUp);
    }
    
    return () => {
      // DEBUG: Log effect cleanup
      // console.log('[DEBUG] useEffect for mouse listeners: Cleaning up. Removing mousemove/mouseup from document.');
      document.removeEventListener('mousemove', currentHandleMouseMove);
      document.removeEventListener('mouseup', currentHandleMouseUp);
    };
  // }, [mouseDown, mouseStartX, handleMouseMove, handleMouseUp]); // Original: [mouseDown, mouseStartX]
  // Let's try to make handlers stable with useCallback or simplify dependencies if possible.
  // For now, let's ensure the core logic of adding/removing based on `mouseDown` is the focus.
  // The original [mouseDown, mouseStartX] dependency meant new listeners were added when a drag started.
  // A simpler approach for global listeners is to add them once and let them internally check `mouseDown`.
  // The current `useEffect` approach only adds them when `mouseDown` is true (or `mouseStartX` changes while `mouseDown` is true)
  // Let's revert to a simpler useEffect for adding these listeners once and relying on internal checks
  }, [mouseDown]); // Let's simplify the dependency array to just mouseDown.
                  // When mouseDown becomes true, we add. When it becomes false, this effect *might* not re-run
                  // to remove them immediately if not structured carefully.
                  // The original was fine: [mouseDown, mouseStartX]

  // Reverting to the original useEffect dependency array as it's a common pattern for drag interactions
  // The functions handleMouseMove and handleMouseUp are redefined on each render,
  // so they will use the latest state values if this effect re-runs.
  
  // --- Reinstating original useEffect for listeners to ensure correct closure behavior ---
  useEffect(() => {
    // console.log('[DEBUG] useEffect for mouse listeners: mouseDown is', mouseDown);
    // These listeners are added to the document. They will use the `handleMouseMove` and `handleMouseUp`
    // from the render in which this effect ran.
    // If `mouseDown` is true, we want them active.
    
    // The `handleMouseMove` and `handleMouseUp` functions defined in the component scope
    // are recreated on each render. When this effect re-runs due to `mouseDown` or `mouseStartX` changing,
    // it will use the newest versions of these functions.

    // A common pattern is to add listeners when `mouseDown` becomes true and remove them in cleanup.
    // The original dependency array [mouseDown, mouseStartX] should correctly manage this.

    const eventMouseMove = (e) => handleMouseMove(e);
    const eventMouseUp = (e) => handleMouseUp(e);

    if (mouseDown) {
        // console.log('[DEBUG] useEffect: Adding document mousemove and mouseup listeners because mouseDown is true.');
        document.addEventListener('mousemove', eventMouseMove);
        document.addEventListener('mouseup', eventMouseUp);
    } else {
        // console.log('[DEBUG] useEffect: mouseDown is false. Listeners should be removed if they were added by a previous state.');
        // The cleanup function handles removal.
    }

    return () => {
        // console.log('[DEBUG] useEffect: Cleanup. Removing document mousemove and mouseup listeners.');
        document.removeEventListener('mousemove', eventMouseMove);
        document.removeEventListener('mouseup', eventMouseUp);
    };
}, [mouseDown, mouseStartX]); // This dependency array means the effect re-runs if mouseDown or mouseStartX changes.
                               // When mouseDown goes from false to true, listeners are added.
                               // When mouseDown goes from true to false (in handleMouseUp),
                               // the effect re-runs, `mouseDown` is false, so listeners from *this run* aren't added,
                               // and the cleanup from the *previous run* (where mouseDown was true) removes them. This is correct.


  // ... (rest of the component including the return statement remains as is)
  // Make sure to place the onMouseDown={handleMouseDown} on the correct div as per previous instructions.
  // For this debugging, assuming it's on the `contentRef` div:
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown} // << ENSURE THIS IS ON THE INTENDED SWIPE AREA
      role="application" 
    >
      {/* ... rest of your JSX ... */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20"
        aria-live="polite"
      >
        <div 
          ref={cardContainerRef}
          className="card-container overflow-hidden rounded-lg shadow-sm hover:shadow-md 
                   transition-shadow border border-gray-200 write-active"
          // onMouseDown={handleMouseDown} // << REMOVED FROM HERE
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="region"
          aria-label={`${uiMode} mode panel, swipe to switch modes`}
        >
          {/* ... rest of your panel structure ... */}
          <div 
            ref={panelsContainerRef}
            className="panels-container relative"
            style={{
              display: 'flex',
              transition: 'transform 200ms ease-in-out',
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
