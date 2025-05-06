// FILE: src/components/layout/SinglePanelLayout.js
import React, { useEffect, useRef, useState } from 'react';
import LeftPanel from './LeftPanel';
import FullHeightInstructionsPanel from '../rightPanel/FullHeightInstructionsPanel';
import useAppStore from '../../store/appStore';
import { showWelcomeSplash } from '../modals/SplashScreenManager';

/**
 * A single panel layout that handles both write and guide modes with slide animation
 * ENHANCED: Added horizontal slide animation between write and guide modes
 * ENHANCED: Added swipe gestures for mode switching
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
  const [touchEndX, setTouchEndX] = useState(null);
  const swipeThreshold = 100; // Minimum pixels to consider a swipe
  
  // Use currentChatSectionId as the source of truth for which section is active
  const activeSectionId = currentChatSectionId || activeSection;
  
  // Get section info for the header (only shown in guide mode)
  const currentSection = useAppStore((state) => activeSectionId ? state.sections[activeSectionId] : null);
  const sectionTitle = currentSection?.title || "Select a section";
  
  // Ref for scrolling to sections
  const contentRef = useRef(null);
  const panelsContainerRef = useRef(null);
  
  // Update previous mode ref when uiMode changes
  useEffect(() => {
    if (previousMode.current !== uiMode) {
      previousMode.current = uiMode;
    }
  }, [uiMode]);
  
  // Handlers for switching between write and guide modes
  const handleSwitchToGuide = () => {
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
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(null); // Reset end position
  };
  
  // Handle touch move
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };
  
  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchEndX - touchStartX;
    const isSignificantSwipe = Math.abs(distance) > swipeThreshold;
    
    if (!isSignificantSwipe) {
      // Not a significant swipe, ignore
      setTouchStartX(null);
      setTouchEndX(null);
      return;
    }
    
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
    
    // Reset touch positions
    setTouchStartX(null);
    setTouchEndX(null);
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
        {/* Wrap everything in a common container */}
        <div 
          className="card-container overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label={`${uiMode} mode panel`}
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
              {/* Guide Mode Header */}
              <div className="bg-white rounded-t-lg px-5 py-3 border-b border-gray-200">
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
          
          {/* Optional: Swipe hint indicator (shows briefly on first load) */}
          <div className="swipe-hint"></div>
        </div>
      </div>
    </div>
  );
};

export default SinglePanelLayout;
