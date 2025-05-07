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

  const accumulatedWheelDeltaX = useRef(0);
  const wheelSwipeTimeoutId = useRef(null);

  const swipeThreshold = 75; 
  const swipeActiveThreshold = 10; 
  const WHEEL_SWIPE_THRESHOLD = 50; 
  const WHEEL_GESTURE_END_TIMEOUT = 200; 

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
    // console.log('[DEBUG-WHEEL] Initiating switch to Guide'); // Keep this if you want to see when switch occurs
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setIsTransitioning(true);
    setUiMode('guide');
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }, [isTransitioning, setUiMode]);
  
  const handleSwitchToWrite = useCallback(() => {
    if (isTransitioning) return;
    // console.log('[DEBUG-WHEEL] Initiating switch to Write'); // Keep this if you want to see when switch occurs
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

  const processWheelSwipe = useCallback(() => {
    // *** ADD LOG IF NOT ALREADY PRESENT OR ENHANCE ***
    console.log('[DEBUG-WHEEL] processWheelSwipe called');
    const delta = accumulatedWheelDeltaX.current;
    accumulatedWheelDeltaX.current = 0; 

    console.log(`[DEBUG-WHEEL] processWheelSwipe - Accumulated Delta: ${delta}, Threshold: ${WHEEL_SWIPE_THRESHOLD}, Transitioning: ${isTransitioning}`);

    if (isTransitioning) {
      console.log('[DEBUG-WHEEL] processWheelSwipe - Bailing: Already transitioning');
      return;
    }

    if (Math.abs(delta) > WHEEL_SWIPE_THRESHOLD) {
      if (delta < 0) { 
        console.log(`[DEBUG-WHEEL] processWheelSwipe - Swipe Left detected. Current mode: ${uiMode}`);
        if (uiMode === 'write') {
          handleSwitchToGuide();
        }
      } else { 
        console.log(`[DEBUG-WHEEL] processWheelSwipe - Swipe Right detected. Current mode: ${uiMode}`);
        if (uiMode === 'guide') {
          handleSwitchToWrite();
        }
      }
    } else {
      console.log('[DEBUG-WHEEL] processWheelSwipe - Swipe not significant enough.');
    }
  }, [uiMode, isTransitioning, handleSwitchToGuide, handleSwitchToWrite, WHEEL_SWIPE_THRESHOLD]);

// In SinglePanelLayout.js

  const handleWheelSwipe = useCallback((event) => {
    console.log(`[DEBUG-WHEEL] handleWheelSwipe: ENTERED. deltaX=${event.deltaX}, deltaY=${event.deltaY}, target=${event.target.className}`);
    console.log(`[DEBUG-WHEEL] Conditions: isTransitioning=${isTransitioning}, mouseDown=${mouseDown}, isSwiping=${isSwiping}`);

    if (isTransitioning || mouseDown || isSwiping) {
      console.log('[DEBUG-WHEEL] handleWheelSwipe - Bailing: Other interaction active.');
      return;
    }

    // Check if it's a horizontal scroll attempt
    // If deltaX is non-zero and more significant than deltaY
    const isHorizontalDominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.5; // Adjusted multiplier slightly, ensure deltaX has *some* value
                                                                                      // Can also use: event.deltaX !== 0 && Math.abs(event.deltaX) > Math.abs(event.deltaY)
    
    // ---- MODIFICATION START ----
    // We will accumulate if it's horizontally dominant, even if individual deltaX is small.
    // The final decision will be based on accumulatedWheelDeltaX.current against WHEEL_SWIPE_THRESHOLD.
    // Remove the `isSignificantDeltaX` check for individual events here.
    // const isSignificantDeltaX = Math.abs(event.deltaX) > 3; 
    console.log(`[DEBUG-WHEEL] isHorizontalDominant: ${isHorizontalDominant}, raw event.deltaX: ${event.deltaX}`);

    // if (isHorizontalDominant && isSignificantDeltaX) { // OLD CONDITION
    if (isHorizontalDominant && event.deltaX !== 0) { // NEW CONDITION: If horizontal and there's any deltaX
    // ---- MODIFICATION END ----
        console.log('[DEBUG-WHEEL] Horizontal swipe component detected. Preventing default.');
        event.preventDefault(); 
        
        accumulatedWheelDeltaX.current += event.deltaX;
        console.log(`[DEBUG-WHEEL] Accumulated deltaX: ${accumulatedWheelDeltaX.current}`);

        if (wheelSwipeTimeoutId.current) {
            clearTimeout(wheelSwipeTimeoutId.current);
            // console.log('[DEBUG-WHEEL] Cleared existing timeout.'); // Can be noisy
        }

        wheelSwipeTimeoutId.current = setTimeout(() => {
            console.log('[DEBUG-WHEEL] Timeout! Calling processWheelSwipe.');
            processWheelSwipe();
        }, WHEEL_GESTURE_END_TIMEOUT);
        // console.log(`[DEBUG-WHEEL] Set new timeout ID: ${wheelSwipeTimeoutId.current}`); // Can be noisy
    } else {
      console.log('[DEBUG-WHEEL] Not a dominant horizontal swipe or deltaX is zero.');
    }
  }, [processWheelSwipe, isTransitioning, mouseDown, isSwiping, WHEEL_GESTURE_END_TIMEOUT]);


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
    // *** THIS LOG IS VERY IMPORTANT FOR SETUP ***
    if (!currentSwipeArea) {
        console.error('[DEBUG-WHEEL] ERROR: contentRef.current is NOT available when trying to add wheel listener!');
        return;
    }
    
    console.log('[DEBUG-WHEEL] Adding wheel event listener to contentRef. Current element:', currentSwipeArea);
    currentSwipeArea.addEventListener('wheel', handleWheelSwipe, { passive: false });
    
    return () => {
        console.log('[DEBUG-WHEEL] Removing wheel event listener from contentRef. Current element:', currentSwipeArea);
        if (currentSwipeArea) { // Check again in case it became null somehow before cleanup
            currentSwipeArea.removeEventListener('wheel', handleWheelSwipe);
        }
        if (wheelSwipeTimeoutId.current) { 
            clearTimeout(wheelSwipeTimeoutId.current);
            console.log('[DEBUG-WHEEL] Cleared wheel swipe timeout on cleanup.');
        }
    };
  }, [handleWheelSwipe]); // handleWheelSwipe is memoized
  
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
