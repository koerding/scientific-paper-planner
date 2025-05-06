// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager';
import { isTouchDevice, setupSwipeHint } from '../../utils/touchDetection';

/**
 * A single panel layout that handles both write and guide modes with slide animation
 * ENHANCED: Added horizontal slide animation between write and guide modes
 * ENHANCED: Added swipe gestures for mode switching with visual feedback
 * UPDATED: Added write mode icon to the left of the title in Guide mode header
 * FIXED: Corrected animation to properly show guide content
 * FIXED: Now correctly manages scroll position when switching modes
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
  
  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchMoveX, setTouchMoveX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
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
      // Remove previous classes
      cardContainerRef.current.classList.remove('write-active', 'guide-active');
      // Add current mode class
      cardContainerRef.current.classList.add(`${uiMode}-active`);
    }
  }, [uiMode]);
  
  // Update swipe direction classes
  useEffect(() => {
    if (!cardContainerRef.current || !isSwiping || !swipeDirection) return;
    
    // Remove previous classes
    cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
    
    // Add current direction class
    cardContainerRef.current.classList.add(`swiping-${swipeDirection}`);
    
    return () => {
      // Clean up
      if (cardContainerRef.current) {
        cardContainerRef.current.classList.remove('swiping-left', 'swiping-right');
      }
    };
  }, [isSwiping, swipeDirection]);
  
  // Handlers for switching between write and guide modes
  const handleSwitchToGuide = () => {
    // Prevent switching during transition
    if (isTransitioning) return;
    
    // Store current scroll position before switching to guide mode
    if (contentRef && contentRef.current) {
      localStorage.setItem('writeScrollPosition', contentRef.current.scrollTop);
      console.log(`[SinglePanelLayout] Stored write scroll position: ${contentRef.current.scrollTop}px`);
    }
    
    // Set transition direction and state
    setTransitionDirection('left');
    setIsTransitioning(true);
    
    // Switch to guide mode
    setUiMode('guide');
    
    // Scroll to top after a short delay to ensure UI has updated
    setTimeout(() => {
      if (contentRef && contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[SinglePanelLayout] Scrolled to top for guide mode');
      }
    }, 50);
  };
  
  const handleSwitchToWrite = () => {
    // Prevent switching during transition
    if (isTransitioning) return;
    
    // Set transition direction and state
    setTransitionDirection('right');
    setIsTransitioning(true);
    
    // Switch to write mode
    setUiMode('write');
    
    // Restore previous scroll position after a short delay
    setTimeout(() => {
      const storedScrollPos = localStorage.getItem('writeScrollPosition');
      if (storedScrollPos && contentRef && contentRef.current) {
        contentRef.current.scrollTo({ 
          top: parseInt(storedScrollPos, 10), 
          behavior: 'smooth' 
        });
        console.log(`[SinglePanelLayout] Restored write scroll position: ${storedScrollPos}px`);
      }
    }, 50);
  };
  
  // Handle animation end
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };
  
  // ------- SWIPE GESTURE HANDLERS --------
  
  // Handle touch start
  const handleTouchStart = (e) => {
    // Store initial touch position
    setTouchStartX(e.touches[0].clientX);
    setTouchMoveX(e.touches[0].clientX);
    setIsSwiping(false);
    setSwipeDirection(null);
    
    // Add swiping class to disable transitions during active swipe
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.add('swiping');
    }
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    // Update current touch position
    const currentX = e.touches[0].clientX;
    setTouchMoveX(currentX);
    
    // Calculate distance from start
    if (touchStartX !== null) {
      const distance = currentX - touchStartX;
      
      // Check if we've moved enough to consider it a swipe attempt
      if (Math.abs(distance) > swipeActiveThreshold) {
        setIsSwiping(true);
        setSwipeDirection(distance > 0 ? 'right' : 'left');
        
        // Optional: Add live panning effect - uncommenting this will make the panel follow finger
        // For smoother animation, consider moving this to requestAnimationFrame
        /*
        if (panelsContainerRef.current) {
          const baseOffset = uiMode === 'guide' ? -50 : 0;
          const maxPan = 15; // Max percentage to pan
          const panAmount = Math.min(Math.abs(distance) / 5, maxPan); // Calculate pan amount
          
          // Apply pan transformation, limited to maxPan
          const transform = `translateX(${baseOffset + (distance > 0 ? panAmount : -panAmount)}%)`;
          panelsContainerRef.current.style.transform = transform;
        }
        */
      }
    }
  };
  
  // Handle touch end - determine if swipe was completed
  const handleTouchEnd = () => {
    // Remove swiping class to re-enable transitions
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      // Reset any manual transform
      const baseTransform = uiMode === 'guide' ? '-50%' : '0%';
      panelsContainerRef.current.style.transform = `translateX(${baseTransform})`;
    }
    
    // Calculate final swipe distance
    if (touchStartX !== null && touchMoveX !== null) {
      const distance = touchMoveX - touchStartX;
      const isSignificantSwipe = Math.abs(distance) > swipeThreshold;
      
      if (isSignificantSwipe) {
        // Determine swipe direction and execute appropriate action
        if (distance > 0) {
          // Swiped right
          if (uiMode === 'guide') {
            // In guide mode, swiping right goes to write mode
            handleSwitchToWrite();
          }
        } else {
          // Swiped left
          if (uiMode === 'write') {
            // In write mode, swiping left goes to guide mode
            handleSwitchToGuide();
          }
        }
      }
    }
    
    // Reset touch tracking
    setTouchStartX(null);
    setTouchMoveX(null);
    setIsSwiping(false);
    setSwipeDirection(null);
  };
  
  // Handle touch cancel - just cleanup state
  const handleTouchCancel = () => {
    // Same cleanup as touch end, but don't trigger actions
    if (panelsContainerRef.current) {
      panelsContainerRef.current.classList.remove('swiping');
      // Reset any manual transform
      const baseTransform = uiMode === 'guide' ? '-50%' : '0%';
      panelsContainerRef.current.style.transform = `translateX(${baseTransform})`;
    }
    
    // Reset touch tracking
    setTouchStartX(null);
    setTouchMoveX(null);
    setIsSwiping(false);
    setSwipeDirection(null);
  };
  
  // ------- END SWIPE GESTURE HANDLERS --------
  
  return (
    <div 
      ref={contentRef}
      className="flex flex-col items-center pt-10 pb-12 w-full h-full overflow-y-auto bg-fafafd">
      
      {/* Main content panel with card design */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-visible z-30 relative mx-auto mb-20" /* Added bottom margin for mobile */
        aria-live="polite"
      >
        {/* Wrap everything in a common container with touch handlers */}
        <div 
          ref={cardContainerRef}
          className={`card-container overflow-hidden rounded-lg shadow-sm hover:shadow-md 
                     transition-shadow border border-gray-200 ${uiMode}-active`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="region"
          aria-label={`${uiMode} mode panel, swipe to switch modes`}
        >
          {/* Animation container for sliding panels */}
          <div 
            ref={panelsContainerRef}
            className="panels-container relative"
            style={{
              display: 'flex',
              transition: 'transform 200ms ease-in-out',
              transform: `translateX(${uiMode === 'guide' ? '-50%' : '0%'})`,
              width: '200%', // Double width to hold both panels
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Write Mode Panel (with Header) */}
            <div className="panel write-panel w-1/2 flex-shrink-0">
              {/* Write Mode Header */}
              <div className="bg-white rounded-t-lg px-5 py-3 border-b border-gray-200">
                <div></div> {/* Empty for write mode */}
              </div>
              
              {/* Write Mode Content */}
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
            
            {/* Guide Mode Panel (with Header) */}
            <div className="panel guide-panel w-1/2 flex-shrink-0">
              {/* Guide Mode Header with Write mode icon to the left */}
              <div className="bg-white rounded-t-lg px-5 py-3 border-b border-gray-200 flex items-center">
                {/* Write Mode Icon Button - positioned to the left of the title */}
                <button
                  onClick={handleSwitchToWrite}
                  className="write-mode-button text-indigo-600 hover:text-indigo-800 focus:outline-none transition-colors mr-3"
                  aria-label="Switch to Write mode"
                  title="Switch to Write mode"
                >
                  <span className="text-xl">◀✎</span>
                </button>
                
                {/* Section Title */}
                <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              </div>
              
              {/* Guide Mode Content */}
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
          
          {/* Swipe hint element for first-time users */}
          <div className="swipe-hint"></div>
        </div>
      </div>
    </div>
  );
};

export default SinglePanelLayout;
