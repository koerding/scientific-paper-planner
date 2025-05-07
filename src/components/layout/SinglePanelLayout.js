// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager'; // Assuming this is used or was planned
import { isTouchDevice, setupSwipeHint } from '../../utils/touchDetection';

/**
 * A single panel layout that handles both write and guide modes with slide animation
 * FIXED: Moved card higher on the page and added direct mouse swipe support
 * FIXED: Ensured consistent title placement between write and guide modes
 */
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
  // Get UI mode and current section ID from the store
  const uiMode = useAppStore((state) => state.uiMode);
  const setUiMode = useAppStore((state) => state.setUiMode);
  const previousMode = useRef(uiMode); // Keep track of previous mode for transition direction
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  
  // Animation state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('right'); // 'left' or 'right'
  
  // Touch swipe gesture state
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchMoveX, setTouchMoveX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
  
  // Mouse swipe gesture state
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState(null);
  const [mouseMoveX, setMouseMoveX] = useState(null);
  
  // Configuration
  const swipeThreshold = 75; // Minimum pixels to consider a swipe
  const swipeActiveThreshold = 10; // Pixels to start showing swipe visual feedback
  
  // Use currentChatSectionId as the source of truth for which section is active
  const activeSectionId = currentChatSectionId || activeSection;
  
  // Get section info for the header (only shown in guide mode)
  const currentSection = useAppStore((state) => activeSectionId ? state.sections[activeSectionId] : null);
  const sectionTitle = currentSection?.title || "Select a section";
  
  // Refs for elements
  const contentRef = useRef(null);
  const panelsContainerRef = useRef(null);
  const cardContainerRef = useRef(null);
  
  // Update previous mode ref when uiMode changes
  useEffect(() => {
    if (previousMode.current !== uiMode) {
      previousMode.current = uiMode;
    }
  }, [uiMode]);
  
  // Setup swipe hint on mount
  useEffect(() => {
    if (isTouchDevice()) {
      setupSwipeHint();
    }
  }, []);
  
  // Add active mode class to card container
  useEffect(() => {
    if (cardContainerRef.current) {
      cardContainerRef.current.classList.remove('write-active', 'guide-active');
      cardContainerRef.current.classList.add(`${uiMode}-active`);
    }
  }, [uiMode]);
  
  // Handlers for switching between write and guide modes
  const handleSwitchToGuide = () => {
    if (isTransitioning) return;
    if (contentRef.current) {
      localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    }
    setTransitionDirection('left');
    setIsTransitioning(true);
    setUiMode('guide');
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };
  
  const handleSwitchToWrite = () => {
    if (isTransitioning) return;
    setTransitionDirection('right');
    setIsTransitioning(true);
    setUiMode('write');
    setTimeout(() => {
      const storedScrollPos = localStorage.getItem('writeScrollPosition');
      if (storedScrollPos && contentRef.current) {
        contentRef.current.scrollTo({ 
          top: parseInt(storedScrollPos, 10), 
          behavior: 'smooth' 
        });
      }
    }, 50);
  };
  
  // Handle animation end
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };
  
  // Helper function to check if element has parent with class
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
  
  // ------- TOUCH GESTURE HANDLERS --------
  const handleTouchStart = (e) => {
    if (e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'INPUT' ||
        e.target.isContentEditable ||
        e.target.classList.contains('section-editor') ||
        hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) { // Added check for ProseMirror editor
      return;
    }
    setTouchStartX(e.touches[0].clientX);
    setTouchMoveX(e.touches[0].clientX);
    setIsSwiping(false);
    setSwipeDirection(null);
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.add('swiping');
    }
  };
  
  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchMoveX(currentX);
    if (touchStartX !== null) {
      const distance = currentX - touchStartX;
      if (Math.abs(distance) > swipeActiveThreshold) {
        setIsSwiping(true);
        setSwipeDirection(distance > 0 ? 'right' : 'left');
      } else {
        setIsSwiping(false); // Reset if not enough movement
        setSwipeDirection(null);
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      const baseTransform = uiMode === 'guide' ? '-50%' : '0%';
      panelsContainerRef.current.style.transform = `translateX(${baseTransform})`;
    }
    if (touchStartX !== null && touchMoveX !== null) {
      const distance = touchMoveX - touchStartX;
      const isSignificantSwipe = Math.abs(distance) > swipeThreshold;
      if (isSignificantSwipe) {
        if (distance > 0) { // Swiped right
          if (uiMode === 'guide') handleSwitchToWrite();
        } else { // Swiped left
          if (uiMode === 'write') handleSwitchToGuide();
        }
      }
    }
    setTouchStartX(null);
    setTouchMoveX(null);
    setIsSwiping(false);
    setSwipeDirection(null);
  };
  
  const handleTouchCancel = () => {
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      const baseTransform = uiMode === 'guide' ? '-50%' : '0%';
      panelsContainerRef.current.style.transform = `translateX(${baseTransform})`;
    }
    setTouchStartX(null);
    setTouchMoveX(null);
    setIsSwiping(false);
    setSwipeDirection(null);
  };
  
  // ------- MOUSE GESTURE HANDLERS --------
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
    setMouseMoveX(e.clientX); // Initialize mouseMoveX
    
    document.body.style.cursor = 'grab'; 
    document.body.classList.add('mouse-swiping');
    console.log('[DEBUG] handleMouseDown: Mouse state set. mouseDown is now true. mouseStartX:', e.clientX);
  };
  
  const handleMouseMove = (e) => {
    if (!mouseDown || mouseStartX === null) {
      // console.log('[DEBUG] handleMouseMove: Bailing: mouseDown=', mouseDown, 'mouseStartX=', mouseStartX); // Can be too verbose
      return;
    }
    
    console.log('[DEBUG] handleMouseMove: Entry. ClientX:', e.clientX); 
    
    const currentMoveX = e.clientX;
    setMouseMoveX(currentMoveX); 
    
    const distance = currentMoveX - (mouseStartX || 0); 
    // Note: The `mouseMoveX` logged directly after `setMouseMoveX` will show the value from the *previous* render.
    // The effect of `setMouseMoveX` will be visible in the next render or subsequent event handlers.
    console.log('[DEBUG] handleMouseMove: Called setMouseMoveX with:', currentMoveX, '. Calculated Distance:', distance);

    if (Math.abs(distance) > swipeActiveThreshold) {
      document.body.style.cursor = 'grabbing';
      document.body.setAttribute('data-swipe-direction', distance > 0 ? 'right' : 'left');
      console.log('[DEBUG] handleMouseMove: Cursor set to grabbing.');
    } else {
       if (mouseDown) { // Check if still dragging
        document.body.style.cursor = 'grab';
        console.log('[DEBUG] handleMouseMove: Cursor reverted to grab.');
       }
    }
  };
  
  const handleMouseUp = (e) => {
    // Check if we even started a swipe. This is a safeguard.
    if (!mouseDown && mouseStartX === null) {
      console.log('[DEBUG] handleMouseUp: MouseUp without an active mousedown sequence. Ignoring.');
      document.body.style.cursor = ''; 
      document.body.classList.remove('mouse-swiping');
      document.body.removeAttribute('data-swipe-direction');
      setMouseDown(false); // Ensure state is reset
      setMouseStartX(null);
      setMouseMoveX(null);
      return;
    }

    console.log('[DEBUG] handleMouseUp: Entry. Current state: mouseDown:', mouseDown, 'mouseStartX:', mouseStartX, 'mouseMoveX:', mouseMoveX);
    
    // Use the state value of mouseMoveX, which should have been updated by handleMouseMove
    const finalCurrentMoveX = mouseMoveX === null ? (mouseStartX || 0) : mouseMoveX; // Fallback if mouseMoveX is still null
    const finalDistance = finalCurrentMoveX - (mouseStartX || 0); 
    const isSignificantSwipe = Math.abs(finalDistance) > swipeThreshold;
    
    console.log('[DEBUG] handleMouseUp: finalDistance:', finalDistance, 'SwipeThreshold:', swipeThreshold, 'IsSignificantSwipe:', isSignificantSwipe, 'Current uiMode:', uiMode);
    
    if (isSignificantSwipe) {
      if (finalDistance > 0) { // Swiped Right
        console.log('[DEBUG] handleMouseUp: Swipe Right detected.');
        if (uiMode === 'guide') {
          console.log('[DEBUG] handleMouseUp: Switching to Write mode.');
          handleSwitchToWrite();
        } else {
          console.log('[DEBUG] handleMouseUp: Already in Write mode or other, no switch for right swipe.');
        }
      } else { // Swiped Left
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
    
    console.log('[DEBUG] handleMouseUp: Resetting state and styles.');
    setMouseDown(false);
    setMouseStartX(null);
    setMouseMoveX(null); 
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  };

  // Setup global mouse event listeners
  useEffect(() => {
    // Define event handlers for add/removeEventListener to ensure the same function reference for removal
    const boundMouseMove = (e) => handleMouseMove(e);
    const boundMouseUp = (e) => handleMouseUp(e);

    if (mouseDown) {
      console.log('[DEBUG] useEffect: Adding document mousemove and mouseup listeners. mouseStartX:', mouseStartX);
      document.addEventListener('mousemove', boundMouseMove);
      document.addEventListener('mouseup', boundMouseUp);
    } else {
      // This branch is hit when mouseDown becomes false, and the cleanup from the *previous* effect call will remove listeners.
      // console.log('[DEBUG] useEffect: mouseDown is false, listeners should be removed by cleanup from previous effect run.');
    }

    return () => {
      console.log('[DEBUG] useEffect: Cleanup. Removing document mousemove and mouseup listeners. mouseDown for this cleanup was:', mouseDown);
      document.removeEventListener('mousemove', boundMouseMove);
      document.removeEventListener('mouseup', boundMouseUp);
    };
  }, [mouseDown, mouseStartX]); // Re-run when mouseDown or mouseStartX changes.
                                // mouseStartX is included because its value is captured in the closure of the effect
                                // when listeners are initially set up. If it could change while mouseDown is true
                                // (not typical in this exact pattern but defensive), this ensures correct context.
                                // For this specific logic, [mouseDown] is often sufficient for the add/remove trigger,
                                // as mouseStartX is set when mouseDown becomes true. Let's keep [mouseDown, mouseStartX] for robustness.

  // Update swipe direction classes for touch (from original file)
  useEffect(() => {
    if (!cardContainerRef.current || !isSwiping || !swipeDirection) return;
    
    cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
    cardContainerRef.current.classList.add(`swiping-${swipeDirection}`);
    
    return () => {
      if (cardContainerRef.current) {
        cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
      }
    };
  }, [isSwiping, swipeDirection]);
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown} // Attach mousedown to the main scrollable area
      role="application"
    >
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20"
        aria-live="polite"
      >
        <div 
          ref={cardContainerRef}
          className="card-container overflow-hidden rounded-lg shadow-sm hover:shadow-md 
                   transition-shadow border border-gray-200" // Static 'write-active' removed, dynamic class is in useEffect
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
              transition: isSwiping || mouseDown ? 'none' : 'transform 200ms ease-in-out', // Disable transition during active swipe/drag
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
