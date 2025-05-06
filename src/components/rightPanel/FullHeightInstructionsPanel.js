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
    if (isTransition
