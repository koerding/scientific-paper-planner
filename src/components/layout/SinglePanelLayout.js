// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState, useCallback } from 'react'; 
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

  // --- NEW: Refs for simpler wheel swipe detection ---
  const isWheelSwipeActive = useRef(false); // Flag to debounce triggers
  const wheelSwipeDebounceTimeoutId = useRef(null); 

  // Configuration
  const swipeThreshold = 75; 
  const swipeActiveThreshold = 10; 
  // *** TUNED VALUES ***
  const WHEEL_TRIGGER_THRESHOLD = 5; // Increased sensitivity threshold (was 10, orig 20) - Requires a more distinct initial swipe event
  const WHEEL_DEBOUNCE_TIME = 150; // Keep debounce relatively short (was 300)

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
    console.log('[DEBUG-WHEEL-S2] Initiating switch to Guide'); 
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setIsTransitioning(true);
    setUiMode('guide');
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [isTransitioning, setUiMode]);
  
  const handleSwitchToWrite = useCallback(() => {
    if (isTransitioning) return;
    console.log('[DEBUG-WHEEL-S2] Initiating switch to Write');
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
  
  // --- Touch Handlers ---
  const handleTouchStart = useCallback((e) => {
    if (isTransitioning || mouseDown) return; 
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable ||
        e.target.classList.contains('section-editor') || hasParentWithClass(e.target, 'section-editor') ||
        hasParentWithClass(e.target, 'ProseMirror')) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchMoveX(e.touches[0].clientX);
    setIsSwiping(true); 
    setSwipeDirection(null);
  }, [isTransitioning, mouseDown]);
  
  const handleTouchMove = useCallback((e) => {
    if (touchStartX === null || !isSwiping) return; 
    const currentX = e.touches[0].clientX;
    setTouchMoveX(currentX);
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
  }, [touchStartX, touchMoveX, isSwiping, uiMode, swipeThreshold, handleSwitchToWrite, handleSwitchToGuide]);
  
  const handleTouchCancel = useCallback(() => {
    setTouchStartX(null); setTouchMoveX(null); setIsSwiping(false); setSwipeDirection(null);
  }, []);
  
  // --- Mouse Drag Handlers ---
  const handleMouseDown = useCallback((e) => {
    if (isTransitioning || isSwiping) return; 
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
    if (!mouseDown) return; 

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


  // --- NEW Two-finger Trackpad Swipe Handler (Strategy 2: Immediate Trigger + Debounce) ---
  const handleWheelSwipe = useCallback((event) => {
    if (isWheelSwipeActive.current) return; // Debouncing

    // console.log(`[DEBUG-WHEEL-S2] handleWheelSwipe: ENTERED. deltaX=${event.deltaX}, deltaY=${event.deltaY}`); // Keep commented unless needed

    if (isTransitioning || mouseDown || isSwiping) return; // Other interaction active

    const isHorizontalDominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.5;
    const isSignificantTriggerDelta = Math.abs(event.deltaX) > WHEEL_TRIGGER_THRESHOLD; 

    // console.log(`[DEBUG-WHEEL-S2] isHorizontalDominant: ${isHorizontalDominant}, event.deltaX: ${event.deltaX}, isSignificantTriggerDelta: ${isSignificantTriggerDelta}`); // Keep commented unless needed

    if (isHorizontalDominant && isSignificantTriggerDelta) {
        console.log(`[DEBUG-WHEEL-S2] Significant horizontal swipe event detected (deltaX: ${event.deltaX}). Threshold: ${WHEEL_TRIGGER_THRESHOLD}. Preventing default.`); // Added Threshold to log
        event.preventDefault(); 

        // Determine direction and trigger switch
        if (event.deltaX < 0) { // Swiped fingers left
             console.log(`[DEBUG-WHEEL-S2] Swipe Left determined. Current mode: ${uiMode}`); // Keep this
            if (uiMode === 'write') {
                handleSwitchToGuide(); // Trigger switch
            } else {
                 console.log(`[DEBUG-WHEEL-S2] No action needed for left swipe in mode: ${uiMode}`); // Keep this
            }
        } else { // Swiped fingers right (event.deltaX > 0)
            console.log(`[DEBUG-WHEEL-S2] Swipe Right determined. Current mode: ${uiMode}`); // Keep this
            if (uiMode === 'guide') {
                handleSwitchToWrite(); // Trigger switch
            } else {
                 console.log(`[DEBUG-WHEEL-S2] No action needed for right swipe in mode: ${uiMode}`); // Keep this
            }
        }

        isWheelSwipeActive.current = true;
        console.log(`[DEBUG-WHEEL-S2] Swipe triggered (or check passed), setting debounce flag for ${WHEEL_DEBOUNCE_TIME}ms.`); // Keep this

        if (wheelSwipeDebounceTimeoutId.current) {
            clearTimeout(wheelSwipeDebounceTimeoutId.current);
        }

        wheelSwipeDebounceTimeoutId.current = setTimeout(() => {
            isWheelSwipeActive.current = false;
            console.log('[DEBUG-WHEEL-S2] Debounce timeout finished, allowing next swipe.'); // Keep this
        }, WHEEL_DEBOUNCE_TIME);

    } // else {
      // console.log('[DEBUG-WHEEL-S2] Not a dominant or significant horizontal swipe trigger event.'); // Can be noisy
    //}
  }, [uiMode, isTransitioning, mouseDown, isSwiping, handleSwitchToGuide, handleSwitchToWrite, WHEEL_TRIGGER_THRESHOLD, WHEEL_DEBOUNCE_TIME]); 


  // --- Effects ---
  
  useEffect(() => {
    if (mouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseDown, handleMouseMove, handleMouseUp]); 
  
  useEffect(() => {
    if (!cardContainerRef.current || !isSwiping || !swipeDirection) return;
    cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
    cardContainerRef.current.classList.add(`swiping-${swipeDirection}`);
    return () => cardContainerRef.current?.classList.remove('swiping-left', 'swiping-right');
  }, [isSwiping, swipeDirection]);

  useEffect(() => {
    const currentSwipeArea = contentRef.current; 
    if (!currentSwipeArea) {
        console.error('[DEBUG-WHEEL-S2] ERROR: contentRef.current is NOT available when trying to add wheel listener!');
        return;
    }
    
    // console.log('[DEBUG-WHEEL-S2] Adding wheel event listener to contentRef.'); // Keep commented unless setup fails
    currentSwipeArea.addEventListener('wheel', handleWheelSwipe, { passive: false });
    
    return () => {
        // console.log('[DEBUG-WHEEL-S2] Removing wheel event listener from contentRef.'); // Keep commented unless setup fails
        if (currentSwipeArea) { 
            currentSwipeArea.removeEventListener('wheel', handleWheelSwipe);
        }
        if (wheelSwipeDebounceTimeoutId.current) { 
            clearTimeout(wheelSwipeDebounceTimeoutId.current);
            // console.log('[DEBUG-WHEEL-S2] Cleared wheel swipe debounce timeout on cleanup of wheel listener effect.');
        }
    };
  }, [handleWheelSwipe]); 
  
  // --- JSX Return ---
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-2 pb-12 w-full h-full overflow-y-auto bg-fafafd"
      onMouseDown={handleMouseDown} 
      onTouchStart={handleTouchStart} 
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
                  activeSection={activeSectionId} handleSectionFocus={handleSectionFocus}
                  handleApproachToggle={handleApproachToggle} handleDataMethodToggle={handleDataMethodToggle}
                  handleMagic={handleMagic} proMode={proMode}
                  onRequestFeedback={handleSwitchToGuide} contentRef={contentRef}
                />
              </div>
            </div>
            {/* Guide Mode Panel */}
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
