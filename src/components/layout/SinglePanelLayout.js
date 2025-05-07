// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState, useCallback } from 'react'; // Added useCallback
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
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
  const isAnyAiLoading = useAppStore((state) => state.isAnyLoading());
  const currentChatSectionId = useAppStore((state) => state.currentChatSectionId);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Touch swipe gesture state
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchMoveX, setTouchMoveX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  // Mouse drag swipe gesture state
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState(null);
  const latestMouseMoveXRef = useRef(null); 

  // Two-finger trackpad swipe gesture state
  const accumulatedWheelDeltaX = useRef(0);
  const wheelSwipeTimeoutId = useRef(null);

  // Configuration
  const swipeThreshold = 75; 
  const swipeActiveThreshold = 10; 
  const WHEEL_SWIPE_THRESHOLD = 50; // Threshold for trackpad swipe
  const WHEEL_GESTURE_END_TIMEOUT = 200; // ms to wait for more wheel events

  const activeSectionId = currentChatSectionId || activeSection;
  const currentSection = useAppStore((state) => activeSectionId ? state.sections[activeSectionId] : null);
  const sectionTitle = currentSection?.title || "Select a section";
  
  const contentRef = useRef(null);
  const panelsContainerRef = useRef(null);
  const cardContainerRef = useRef(null);
  
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
  
  const handleSwitchToGuide = useCallback(() => {
    if (isTransitioning) return;
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setIsTransitioning(true);
    setUiMode('guide');
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [isTransitioning, setUiMode]);
  
  const handleSwitchToWrite = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setUiMode('write');
    setTimeout(() => {
      const storedScrollPos = localStorage.getItem('writeScrollPosition');
      if (storedScrollPos && contentRef.current) {
        contentRef.current.scrollTo({ top: parseInt(storedScrollPos, 10), behavior: 'smooth' });
      }
    }, 50);
  }, [isTransitioning, setUiMode]);
  
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
  
  // --- Touch Gesture Handlers ---
  const handleTouchStart = useCallback((e) => {
    if (isTransitioning || mouseDown) return; // Prevent touch during other interactions
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable ||
        e.target.classList.contains('section-editor') || hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchMoveX(e.touches[0].clientX);
    setIsSwiping(true); // Indicate potential swipe early for transition disabling
    setSwipeDirection(null);
    // panelsContainerRef.current?.classList.add('swiping'); // Class for visual feedback if needed
  }, [isTransitioning, mouseDown]);
  
  const handleTouchMove = useCallback((e) => {
    if (touchStartX === null || !isSwiping) return; // Only process if actively swiping
    const currentX = e.touches[0].clientX;
    setTouchMoveX(currentX);
    const distance = currentX - touchStartX;
    // Determine direction for visual feedback if any (already handled by isSwiping for transition)
    // setSwipeDirection(distance > 0 ? 'right' : 'left');
  }, [touchStartX, isSwiping]);
  
  const handleTouchEnd = useCallback(() => {
    if (touchStartX !== null && touchMoveX !== null && isSwiping) {
      const distance = touchMoveX - touchStartX;
      if (Math.abs(distance) > swipeThreshold) {
        if (distance > 0 && uiMode === 'guide') handleSwitchToWrite();
        else if (distance < 0 && uiMode === 'write') handleSwitchToGuide();
      }
    }
    setTouchStartX(null); setTouchMoveX(null); setIsSwiping(false); setSwipeDirection(null);
    // panelsContainerRef.current?.classList.remove('swiping');
  }, [touchStartX, touchMoveX, isSwiping, uiMode, swipeThreshold, handleSwitchToWrite, handleSwitchToGuide]);
  
  const handleTouchCancel = useCallback(() => {
    setTouchStartX(null); setTouchMoveX(null); setIsSwiping(false); setSwipeDirection(null);
    // panelsContainerRef.current?.classList.remove('swiping');
  }, []);
  
  // --- Mouse Drag Swipe Gesture Handlers ---
  const handleMouseDown = useCallback((e) => {
    if (isTransitioning || isSwiping) return; // Prevent mouse drag during other interactions
    if (e.button !== 0) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable ||
        e.target.classList.contains('section-editor') || hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) {
      return;
    }
    setMouseDown(true);
    setMouseStartX(e.clientX);
    latestMouseMoveXRef.current = e.clientX; 
    document.body.style.cursor = 'grab'; 
    document.body.classList.add('mouse-swiping');
  }, [isTransitioning, isSwiping]);
  
  const handleMouseMove = useCallback((e) => {
    if (!mouseDown || mouseStartX === null) return; 
    const currentX = e.clientX;
    latestMouseMoveXRef.current = currentX; 
    const distance = currentX - (mouseStartX || 0); 
    if (Math.abs(distance) > swipeActiveThreshold) {
      document.body.style.cursor = 'grabbing';
      document.body.setAttribute('data-swipe-direction', distance > 0 ? 'right' : 'left');
    } else if (mouseDown) { 
      document.body.style.cursor = 'grab';
    }
  }, [mouseDown, mouseStartX, swipeActiveThreshold]);
  
  const handleMouseUp = useCallback(() => {
    if (!mouseDown) return; // Only process if mouse was down

    const finalMoveX = latestMouseMoveXRef.current; 
    const startXVal = mouseStartX === null ? 0 : mouseStartX;
    const moveXVal = finalMoveX === null ? startXVal : finalMoveX; 
    const distance = moveXVal - startXVal;
    const isSignificant = Math.abs(distance) > swipeThreshold;
    
    if (isSignificant) {
      if (distance > 0 && uiMode === 'guide') handleSwitchToWrite();
      else if (distance < 0 && uiMode === 'write') handleSwitchToGuide();
    }
    
    setMouseDown(false);
    setMouseStartX(null);
    latestMouseMoveXRef.current = null; 
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  }, [mouseDown, mouseStartX, uiMode, swipeThreshold, handleSwitchToWrite, handleSwitchToGuide]);

  // --- Two-finger Trackpad Swipe Gesture Handlers ---
  const processWheelSwipe = useCallback(() => {
    const delta = accumulatedWheelDeltaX.current;
    accumulatedWheelDeltaX.current = 0; // Reset for the next distinct gesture

    if (isTransitioning) return; // Don't process if already changing modes

    if (Math.abs(delta) > WHEEL_SWIPE_THRESHOLD) {
      // Typical trackpad: swipe fingers LEFT (content moves left, new content from right) -> deltaX is NEGATIVE
      // Typical trackpad: swipe fingers RIGHT (content moves right, new content from left) -> deltaX is POSITIVE
      if (delta < 0) { // Swiped fingers left
        if (uiMode === 'write') {
          handleSwitchToGuide();
        }
      } else { // Swiped fingers right
        if (uiMode === 'guide') {
          handleSwitchToWrite();
        }
      }
    }
  }, [uiMode, isTransitioning, handleSwitchToGuide, handleSwitchToWrite, WHEEL_SWIPE_THRESHOLD]);

  const handleWheelSwipe = useCallback((event) => {
    // Don't interfere with other gestures or if not a clear horizontal swipe
    if (isTransitioning || mouseDown || isSwiping) return;

    // Heuristic: deltaX is dominant and not tiny. Adjust multiplier as needed.
    // Allow for some minor unintentional vertical movement.
    const isHorizontalDominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.75;
    const isSignificantDeltaX = Math.abs(event.deltaX) > 3; // Ignore tiny movements

    if (isHorizontalDominant && isSignificantDeltaX) {
        event.preventDefault(); // Prevent default browser scroll for handled horizontal swipes
        
        accumulatedWheelDeltaX.current += event.deltaX;

        if (wheelSwipeTimeoutId.current) {
            clearTimeout(wheelSwipeTimeoutId.current);
        }

        wheelSwipeTimeoutId.current = setTimeout(() => {
            processWheelSwipe();
        }, WHEEL_GESTURE_END_TIMEOUT);
    }
  }, [processWheelSwipe, isTransitioning, mouseDown, isSwiping, WHEEL_GESTURE_END_TIMEOUT]);


  // Effect for global mouse listeners (for mouse drag swipe)
  useEffect(() => {
    if (mouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseDown, handleMouseMove, handleMouseUp]); // handleMouseMove/Up are memoized

  // Effect for touch swipe visual feedback (panel class)
  useEffect(() => {
    if (!cardContainerRef.current || !isSwiping || !swipeDirection) return;
    // This effect was for adding 'swiping-left'/'swiping-right' classes to cardContainerRef.
    // If direct transform manipulation or other feedback is preferred, adjust here.
    // For now, let's assume this class-based feedback is still desired.
    cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
    cardContainerRef.current.classList.add(`swiping-${swipeDirection}`);
    return () => cardContainerRef.current?.classList.remove('swiping-left', 'swiping-right');
  }, [isSwiping, swipeDirection]);

  // Effect for wheel swipe listener
  useEffect(() => {
    const currentSwipeArea = contentRef.current; 
    if (currentSwipeArea) {
        currentSwipeArea.addEventListener('wheel', handleWheelSwipe, { passive: false });
        return () => {
            currentSwipeArea.removeEventListener('wheel', handleWheelSwipe);
            if (wheelSwipeTimeoutId.current) { // Clear timeout on unmount/cleanup
                clearTimeout(wheelSwipeTimeoutId.current);
            }
        };
    }
  }, [handleWheelSwipe]); // handleWheelSwipe is memoized
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown} // Mouse drag init
      onTouchStart={handleTouchStart} // Touch init
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
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
          // Note: Touch handlers are on the parent (contentRef) now for broader area.
          // If you want touch only on the card, move them back here.
          role="region"
          aria-label={`${uiMode} mode panel, swipe to switch modes`}
        >
          <div 
            ref={panelsContainerRef}
            className="panels-container relative"
            style={{
              display: 'flex',
              // Disable CSS transition during any active swipe/drag to prevent lag
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
