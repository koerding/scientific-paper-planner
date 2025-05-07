// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager';
import { isTouchDevice, setupSwipeHint } from '../../utils/touchDetection';

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
  const previousMode = useRef(uiMode);
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('right');
  
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchMoveX, setTouchMoveX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState(null);
  const [mouseMoveX, setMouseMoveX] = useState(null);
  
  const swipeThreshold = 75;
  const swipeActiveThreshold = 10;
  
  const activeSectionId = currentChatSectionId || activeSection;
  const currentSection = useAppStore((state) => activeSectionId ? state.sections[activeSectionId] : null);
  const sectionTitle = currentSection?.title || "Select a section";
  
  const contentRef = useRef(null);
  const panelsContainerRef = useRef(null);
  const cardContainerRef = useRef(null);
  
  useEffect(() => {
    if (previousMode.current !== uiMode) {
      previousMode.current = uiMode;
    }
  }, [uiMode]);
  
  useEffect(() => {
    if (isTouchDevice()) {
      setupSwipeHint();
    }
  }, []);
  
  useEffect(() => {
    if (cardContainerRef.current) {
      cardContainerRef.current.classList.remove('write-active', 'guide-active');
      cardContainerRef.current.classList.add(`${uiMode}-active`);
    }
  }, [uiMode]);
  
  const handleSwitchToGuide = () => {
    if (isTransitioning) return;
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setTransitionDirection('left');
    setIsTransitioning(true);
    setUiMode('guide');
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };
  
  const handleSwitchToWrite = () => {
    if (isTransitioning) return;
    setTransitionDirection('right');
    setIsTransitioning(true);
    setUiMode('write');
    setTimeout(() => {
      const storedScrollPos = localStorage.getItem('writeScrollPosition');
      if (storedScrollPos && contentRef.current) {
        contentRef.current.scrollTo({ top: parseInt(storedScrollPos, 10), behavior: 'smooth' });
      }
    }, 50);
  };
  
  const handleTransitionEnd = () => setIsTransitioning(false);
  
  const hasParentWithClass = (element, className) => {
    if (!element) return false;
    let parent = element.parentElement;
    while (parent) {
      if (parent.classList?.contains(className)) return true;
      parent = parent.parentElement;
    }
    return false;
  };
  
  const handleTouchStart = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable ||
        e.target.classList.contains('section-editor') || hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchMoveX(e.touches[0].clientX);
    setIsSwiping(false);
    setSwipeDirection(null);
    panelsContainerRef.current?.classList.add('swiping');
  };
  
  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchMoveX(currentX);
    const distance = currentX - touchStartX;
    if (Math.abs(distance) > swipeActiveThreshold) {
      setIsSwiping(true);
      setSwipeDirection(distance > 0 ? 'right' : 'left');
    } else {
      setIsSwiping(false);
      setSwipeDirection(null);
    }
  };
  
  const handleTouchEnd = () => {
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      panelsContainerRef.current.style.transform = `translateX(${uiMode === 'guide' ? '-50%' : '0%'})`;
    }
    if (touchStartX !== null && touchMoveX !== null) {
      const distance = touchMoveX - touchStartX;
      if (Math.abs(distance) > swipeThreshold) {
        if (distance > 0 && uiMode === 'guide') handleSwitchToWrite();
        else if (distance < 0 && uiMode === 'write') handleSwitchToGuide();
      }
    }
    setTouchStartX(null); setTouchMoveX(null); setIsSwiping(false); setSwipeDirection(null);
  };
  
  const handleTouchCancel = () => {
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      panelsContainerRef.current.style.transform = `translateX(${uiMode === 'guide' ? '-50%' : '0%'})`;
    }
    setTouchStartX(null); setTouchMoveX(null); setIsSwiping(false); setSwipeDirection(null);
  };
  
  const handleMouseDown = (e) => {
    console.log('[DEBUG] handleMouseDown: Entry. Target:', e.target.tagName, 'Button:', e.button);
    if (e.button !== 0) {
      console.log('[DEBUG] handleMouseDown: Non-left button.');
      return;
    }
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable ||
        e.target.classList.contains('section-editor') || hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) {
      console.log('[DEBUG] handleMouseDown: Editable content detected.');
      return;
    }
    console.log('[DEBUG] handleMouseDown: Proceeding. ClientX:', e.clientX);
    setMouseDown(true);
    setMouseStartX(e.clientX);
    setMouseMoveX(e.clientX); // Initialize mouseMoveX here
    document.body.style.cursor = 'grab'; 
    document.body.classList.add('mouse-swiping');
    console.log(`[DEBUG] handleMouseDown: State set -> mouseDown: true, mouseStartX: ${e.clientX}, initial mouseMoveX: ${e.clientX}`);
  };
  
  const handleMouseMove = (e) => {
    // This `mouseDown` is from the closure of when the listener was added.
    // For accurate check, it's better if this handler is re-bound or we use a ref for mouseDown.
    // However, the `useEffect` dependency on `mouseDown` should handle re-binding.
    if (!mouseDown || mouseStartX === null) return; 
    
    const currentX = e.clientX;
    console.log(`[DEBUG] handleMouseMove: Entry. ClientX: ${currentX}. Current mouseStartX (from closure/state): ${mouseStartX}`);
    setMouseMoveX(currentX); // This schedules an update.
    // The `mouseMoveX` value available *immediately* here is from the *previous* render.
    // The new value will be available in the *next* render.

    const distance = currentX - (mouseStartX || 0); 
    console.log(`[DEBUG] handleMouseMove: Called setMouseMoveX(${currentX}). Calculated distance: ${distance}. (Note: mouseMoveX state logged here is pre-update)`);

    if (Math.abs(distance) > swipeActiveThreshold) {
      document.body.style.cursor = 'grabbing';
      document.body.setAttribute('data-swipe-direction', distance > 0 ? 'right' : 'left');
      console.log('[DEBUG] handleMouseMove: Cursor is grabbing.');
    } else if (mouseDown) { // Only revert to grab if still in drag sequence
      document.body.style.cursor = 'grab';
      console.log('[DEBUG] handleMouseMove: Cursor is grab.');
    }
  };
  
  const handleMouseUp = (e) => {
    console.log(`[DEBUG] handleMouseUp: Entry. State reads -> mouseDown: ${mouseDown}, mouseStartX: ${mouseStartX}, mouseMoveX (from current render state): ${mouseMoveX}`);
    
    if (!mouseDown && mouseStartX === null) { // If not even started a swipe
      console.log('[DEBUG] handleMouseUp: No active mousedown sequence.');
      // Minimal cleanup if needed, but main state reset is below
      document.body.style.cursor = ''; 
      document.body.classList.remove('mouse-swiping');
      document.body.removeAttribute('data-swipe-direction');
      setMouseDown(false); // Ensure clean state
      setMouseStartX(null);
      setMouseMoveX(null);
      return;
    }

    // Use the `mouseMoveX` state value, which should reflect the last update from `handleMouseMove` after a re-render.
    const finalMoveX = mouseMoveX === null ? (mouseStartX || 0) : mouseMoveX;
    const distance = finalMoveX - (mouseStartX || 0);
    const isSignificant = Math.abs(distance) > swipeThreshold;

    console.log(`[DEBUG] handleMouseUp: finalDistance: ${distance}, IsSignificant: ${isSignificant}, uiMode: ${uiMode}`);
    
    if (isSignificant) {
      if (distance > 0 && uiMode === 'guide') {
        console.log('[DEBUG] handleMouseUp: Switching to Write.');
        handleSwitchToWrite();
      } else if (distance < 0 && uiMode === 'write') {
        console.log('[DEBUG] handleMouseUp: Switching to Guide.');
        handleSwitchToGuide();
      }
    } else {
      console.log('[DEBUG] handleMouseUp: Swipe not significant.');
    }
    
    console.log('[DEBUG] handleMouseUp: Resetting state.');
    setMouseDown(false);
    setMouseStartX(null);
    setMouseMoveX(null); // Crucial to reset this
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  };

  useEffect(() => {
    const boundMouseMove = (e) => handleMouseMove(e);
    const boundMouseUp = (e) => handleMouseUp(e);

    if (mouseDown) {
      console.log(`[DEBUG] useEffect: ADDING listeners. mouseDown: ${mouseDown}, mouseStartX: ${mouseStartX}`);
      document.addEventListener('mousemove', boundMouseMove);
      document.addEventListener('mouseup', boundMouseUp);
    } else {
      // Listeners are removed by the cleanup function from the previous effect run
      // when mouseDown was true.
      // console.log(`[DEBUG] useEffect: mouseDown is false. Cleanup from previous effect should have removed listeners.`);
    }

    return () => {
      console.log(`[DEBUG] useEffect: CLEANUP. REMOVING listeners. mouseDown for this closure: ${mouseDown}, mouseStartX for this closure: ${mouseStartX}`);
      document.removeEventListener('mousemove', boundMouseMove);
      document.removeEventListener('mouseup', boundMouseUp);
    };
  }, [mouseDown, mouseStartX]); // Re-run if mouseDown or mouseStartX changes.
                                // This ensures fresh handlers with correct closures are bound when a drag starts.
  
  useEffect(() => {
    if (!cardContainerRef.current || !isSwiping || !swipeDirection) return;
    cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
    cardContainerRef.current.classList.add(`swiping-${swipeDirection}`);
    return () => cardContainerRef.current?.classList.remove('swiping-left', 'swiping-right');
  }, [isSwiping, swipeDirection]);
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown}
      role="application"
    >
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
            <div className="panel write-panel w-1/2 flex-shrink-0">
              <div className="bg-white rounded-t-lg px-5 py-3 flex items-center min-h-[3.5rem]">
                <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              </div>
              <div className="bg-white px-5 py-4">
                <LeftPanel
                  activeSection={activeSectionId} handleSectionFocus={handleSectionFocus}
                  handleApproachToggle={handleApproachToggle} handleDataMethodToggle={handleDataMethodToggle}
                  handleMagic={handleMagic} proMode={proMode}
                  onRequestFeedback={handleSwitchToGuide} contentRef={contentRef}
                />
              </div>
            </div>
            <div className="panel guide-panel w-1/2 flex-shrink-0">
              <div className="bg-white rounded-t-lg px-5 py-3 flex items-center min-h-[3.5rem]">
                <button onClick={handleSwitchToWrite}
                  className="write-mode-button text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors mr-3"
                  aria-label="Switch to Write mode" title="Switch to Write mode">
                  <span className="text-xl">◀✎</span>
                </button>
                <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              </div>
              <div className="bg-white px-5 py-4">
                <FullHeightInstructionsPanel
                  key={`guide-${activeSectionId}`} activeSectionId={activeSectionId}
                  improveInstructions={handleMagic} loading={isAnyAiLoading}
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
