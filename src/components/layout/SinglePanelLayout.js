// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { isTouchDevice, setupSwipeHint } from '../../utils/touchDetection';
// Removed: import { showWelcomeSplash } from '../modals/SplashScreenManager'; // If not used

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
  
  // Mouse swipe gesture state
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState(null);
  const latestMouseMoveXRef = useRef(null); 

  // Configuration
  const swipeThreshold = 75; // Minimum pixels to consider a swipe
  const swipeActiveThreshold = 10; // Pixels to start showing swipe visual feedback
  
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
  
  const handleSwitchToGuide = () => {
    if (isTransitioning) return;
    if (contentRef.current) localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop.toString());
    setIsTransitioning(true); // Transition direction is implicitly handled by CSS transform target
    setUiMode('guide');
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };
  
  const handleSwitchToWrite = () => {
    if (isTransitioning) return;
    setIsTransitioning(true); // Transition direction is implicitly handled by CSS transform target
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
  
  // --- Touch Gesture Handlers ---
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
  
  // --- Mouse Gesture Handlers ---
  const handleMouseDown = (e) => {
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
  };
  
  const handleMouseMove = (e) => {
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
  };
  
  const handleMouseUp = () => {
    const finalMoveX = latestMouseMoveXRef.current; 
    
    if (!mouseDown && mouseStartX === null) { // Should not happen if logic is correct, but a safeguard
      setMouseDown(false); 
      setMouseStartX(null);
      latestMouseMoveXRef.current = null; 
      document.body.style.cursor = '';
      document.body.classList.remove('mouse-swiping');
      document.body.removeAttribute('data-swipe-direction');
      return;
    }

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
  };

  // Effect for global mouse listeners
  useEffect(() => {
    const boundMouseMove = (e) => handleMouseMove(e); // Memoize or define inside if handleMouseMove has dependencies
    const boundMouseUp = (e) => handleMouseUp(e);     // Memoize or define inside if handleMouseUp has dependencies

    if (mouseDown) {
      document.addEventListener('mousemove', boundMouseMove);
      document.addEventListener('mouseup', boundMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', boundMouseMove);
      document.removeEventListener('mouseup', boundMouseUp);
    };
  }, [mouseDown, mouseStartX]); // mouseStartX is included because its value is implicitly part of the drag context
                                // established when mouseDown becomes true.

  // Effect for touch swipe visual feedback
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
