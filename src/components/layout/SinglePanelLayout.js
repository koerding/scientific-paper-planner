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
  
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchMoveX, setTouchMoveX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false); 
  const [swipeDirection, setSwipeDirection] = useState(null); 
  
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState(null);
  const latestMouseMoveXRef = useRef(null); 

  const isWheelSwipeActive = useRef(false); 
  const wheelSwipeDebounceTimeoutId = useRef(null); 

  const swipeThreshold = 75; 
  const swipeActiveThreshold = 10; 
  const WHEEL_TRIGGER_THRESHOLD = 5; // User preferred value
  const WHEEL_DEBOUNCE_TIME = 150; 

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
    console.log(`[DEBUG-WHEEL-S4] Initiating switch to Guide. Current uiMode was: ${uiMode}`); 
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setIsTransitioning(true);
    setUiMode('guide'); 
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [isTransitioning, uiMode, setUiMode]); 
  
  const handleSwitchToWrite = useCallback(() => {
    if (isTransitioning) return;
    console.log(`[DEBUG-WHEEL-S4] Initiating switch to Write. Current uiMode was: ${uiMode}`);
    setIsTransitioning(true);
    setUiMode('write'); 
    setTimeout(() => {
      const storedScrollPos = localStorage.getItem('writeScrollPosition');
      if (storedScrollPos && contentRef.current) {
        contentRef.current.scrollTo({ top: parseInt(storedScrollPos, 10), behavior: 'smooth' });
      }
    }, 50);
  }, [isTransitioning, uiMode, setUiMode]); 
  
  const handleTransitionEnd = () => {
      console.log("[DEBUG] Transition Ended. Setting isTransitioning=false");
      setIsTransitioning(false);
  }
  
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
        // Standard direction: Left brings Guide, Right brings Write
        if (distance < 0 && uiMode === 'write') handleSwitchToGuide(); // Swipe Left
        else if (distance > 0 && uiMode === 'guide') handleSwitchToWrite(); // Swipe Right
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
    
    // Standard direction: Left brings Guide, Right brings Write
    if (isSignificant) {
        if (distance < 0 && uiMode === 'write') handleSwitchToGuide(); // Swipe Left
        else if (distance > 0 && uiMode === 'guide') handleSwitchToWrite(); // Swipe Right
    }
    
    setMouseDown(false);
    setMouseStartX(null);
    latestMouseMoveXRef.current = null; 
    document.body.style.cursor = '';
    document.body.classList.remove('mouse-swiping');
    document.body.removeAttribute('data-swipe-direction');
  }, [mouseDown, mouseStartX, uiMode, swipeThreshold, handleSwitchToWrite, handleSwitchToGuide]);


  // --- Two-finger Trackpad Swipe Handler (Strategy 4: Corrected Direction + Refined Debounce) ---
  const handleWheelSwipe = useCallback((event) => {
    if (isWheelSwipeActive.current) {
        // console.log('[DEBUG-WHEEL-S4] Ignoring event, debounce active.');
        return;
    }

    // console.log(`[DEBUG-WHEEL-S4] handleWheelSwipe: ENTERED. deltaX=${event.deltaX.toFixed(2)}, uiMode (at event time): ${uiMode}`);

    if (isTransitioning || mouseDown || isSwiping) {
      // console.log(`[DEBUG-WHEEL-S4] handleWheelSwipe - Bailing: Interaction active (T:${isTransitioning}, MD:${mouseDown}, S:${isSwiping})`);
      return;
    }

    const isHorizontalDominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.5;
    const isSignificantTriggerDelta = Math.abs(event.deltaX) > WHEEL_TRIGGER_THRESHOLD; 

    if (isHorizontalDominant && isSignificantTriggerDelta) {
        console.log(`[DEBUG-WHEEL-S4] Significant horizontal swipe event detected (deltaX: ${event.deltaX.toFixed(2)}). Threshold: ${WHEEL_TRIGGER_THRESHOLD}. Preventing default.`);
        event.preventDefault(); 

        let switchTriggered = false;

        // *** CORRECTED DIRECTION LOGIC TO MATCH USER EXPECTATION & STANDARD BEHAVIOR ***
        if (event.deltaX < 0) { // Swiped fingers left (Negative deltaX) -> Show content to the Right (Guide)
             console.log(`[DEBUG-WHEEL-S4] Swipe Left determined. Mode check: ${uiMode}`);
            if (uiMode === 'write') { 
                handleSwitchToGuide(); 
                switchTriggered = true;
            } else {
                 console.log(`[DEBUG-WHEEL-S4] No action needed for left swipe in mode: ${uiMode}`);
            }
        } else { // Swiped fingers right (Positive deltaX) -> Show content to the Left (Write)
            console.log(`[DEBUG-WHEEL-S4] Swipe Right determined. Mode check: ${uiMode}`);
            if (uiMode === 'guide') { 
                handleSwitchToWrite(); 
                switchTriggered = true;
            } else {
                 console.log(`[DEBUG-WHEEL-S4] No action needed for right swipe in mode: ${uiMode}`);
            }
        }

        // Only set debounce if a switch was actually initiated
        if (switchTriggered) {
            isWheelSwipeActive.current = true;
            console.log(`[DEBUG-WHEEL-S4] Mode switch initiated, setting debounce flag for ${WHEEL_DEBOUNCE_TIME}ms.`);

            // Clear previous timeout just in case (though unlikely needed with this flag logic)
            if (wheelSwipeDebounceTimeoutId.current) {
                clearTimeout(wheelSwipeDebounceTimeoutId.current);
            }

            wheelSwipeDebounceTimeoutId.current = setTimeout(() => {
                console.log('[DEBUG-WHEEL-S4] Debounce setTimeout CALLED. Resetting isWheelSwipeActive=false.'); 
                isWheelSwipeActive.current = false;
            }, WHEEL_DEBOUNCE_TIME);
        } else {
             console.log('[DEBUG-WHEEL-S4] Significant swipe detected, but no mode switch needed for current mode/direction.');
        }

    } // else {
      // console.log('[DEBUG-WHEEL-S4] Not a dominant or significant horizontal swipe trigger event.');
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

  // Effect for wheel swipe listener
  useEffect(() => {
    const currentSwipeArea = contentRef.current; 
    if (!currentSwipeArea) {
        console.error('[DEBUG-WHEEL-S4] ERROR: contentRef.current is NOT available when trying to add wheel listener!');
        return;
    }
    
    // console.log(`[DEBUG-WHEEL-S4] Adding wheel listener. handleWheelSwipe dependency uiMode is currently: ${uiMode}`); 
    currentSwipeArea.addEventListener('wheel', handleWheelSwipe, { passive: false });
    
    return () => {
        // console.log('[DEBUG-WHEEL-S4] Removing wheel listener.'); 
        if (currentSwipeArea) { 
            currentSwipeArea.removeEventListener('wheel', handleWheelSwipe);
        }
        // *** DO NOT CLEAR THE DEBOUNCE TIMER HERE ***
        // The timeout needs to run its course to reset the isWheelSwipeActive ref,
        // even if the component re-renders or the listener is removed/re-added.
        // if (wheelSwipeDebounceTimeoutId.current) { 
        //     clearTimeout(wheelSwipeDebounceTimeoutId.current);
        //     console.log('[DEBUG-WHEEL-S4] Cleared wheel swipe debounce timeout on cleanup of wheel listener effect.'); // REMOVED THIS LINE
        // }
    };
  }, [handleWheelSwipe]); // handleWheelSwipe is memoized, depends on uiMode
  
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
