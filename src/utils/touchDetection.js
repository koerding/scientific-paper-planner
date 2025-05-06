// FILE: src/utils/touchDetection.js

/**
 * Utility to detect touch devices and add mouse-based swipe support
 * ENHANCED: Now supports swipe simulation via mouse for desktop users
 */

/**
 * Detect if the device supports touch events
 * @returns {boolean} True if touch events are supported
 */
export const isTouchDevice = () => {
  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0)
  );
};

/**
 * Add touch device detection class to HTML element
 * This allows CSS to target touch devices specifically
 */
export const addTouchDetectionClass = () => {
  if (isTouchDevice()) {
    document.documentElement.classList.add('touch-device');
  } else {
    document.documentElement.classList.add('no-touch');
  }
};

/**
 * Setup one-time swipe hint for first-time users
 * Shows a subtle animation to hint at swipe functionality
 */
export const setupSwipeHint = () => {
  // Only show hint once per session
  const hasSeenSwipeHint = sessionStorage.getItem('has-seen-swipe-hint');
  
  if (!hasSeenSwipeHint) {
    // Wait for DOM to be ready
    setTimeout(() => {
      const swipeHintElement = document.querySelector('.swipe-hint');
      if (swipeHintElement) {
        swipeHintElement.classList.add('show');
        
        // Remove after animation completes
        setTimeout(() => {
          swipeHintElement.classList.remove('show');
          sessionStorage.setItem('has-seen-swipe-hint', 'true');
        }, 2000);
      }
    }, 1500);
  }
};

/**
 * Adds mouse support for swipe gestures on desktop
 * This allows users to click and drag to simulate swipes
 */
export const enableMouseSwipeSupport = () => {
  // Only add if not a touch device - we don't want both
  if (!isTouchDevice()) {
    console.log('Enabling mouse swipe support for desktop');
    
    // Add the class to enable swipe styles
    document.documentElement.classList.add('mouse-swipe-enabled');
    
    // We'll add event listeners to the document for delegation
    document.addEventListener('mousedown', handleMouseDown);
  }
  
  // Track mouse state
  let isMouseDown = false;
  let startX = 0;
  let currentElement = null;
  
  // Handle mouse down event
  function handleMouseDown(e) {
    // Check if we're clicking on a swipeable container
    const cardContainer = e.target.closest('.card-container');
    if (!cardContainer) return;
    
    // Record start position
    isMouseDown = true;
    startX = e.clientX;
    currentElement = cardContainer;
    
    // Add move and up listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during swipe
    document.body.style.userSelect = 'none';
    
    // Create and dispatch a simulated touch event
    simulateTouchEvent('touchstart', e, currentElement);
    
    // Change cursor to grabbing
    document.body.style.cursor = 'grabbing';
  }
  
  // Handle mouse move event
  function handleMouseMove(e) {
    if (!isMouseDown || !currentElement) return;
    
    // Create and dispatch a simulated touch event
    simulateTouchEvent('touchmove', e, currentElement);
  }
  
  // Handle mouse up event
  function handleMouseUp(e) {
    if (!isMouseDown || !currentElement) return;
    
    // Create and dispatch a simulated touch event
    simulateTouchEvent('touchend', e, currentElement);
    
    // Reset state
    isMouseDown = false;
    currentElement = null;
    
    // Remove listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Restore text selection
    document.body.style.userSelect = '';
    
    // Reset cursor
    document.body.style.cursor = '';
  }
  
  // Simulate touch events from mouse events
  function simulateTouchEvent(type, mouseEvent, element) {
    // Create a touch-like object
    const touch = {
      identifier: 1,
      target: element,
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
      pageX: mouseEvent.pageX,
      pageY: mouseEvent.pageY,
      screenX: mouseEvent.screenX,
      screenY: mouseEvent.screenY,
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 0,
      force: 1
    };
    
    // Create arrays for the touches
    const touches = type !== 'touchend' ? [touch] : [];
    const targetTouches = type !== 'touchend' ? [touch] : [];
    const changedTouches = [touch];
    
    // Create a custom event
    const event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true
    });
    
    // Add touch lists
    event.touches = touches;
    event.targetTouches = targetTouches;
    event.changedTouches = changedTouches;
    
    // Dispatch the event
    element.dispatchEvent(event);
  }
};

/**
 * Initialize all touch-related features
 * Call this from your App.js or a similar application entry point
 */
export const initializeTouchFeatures = () => {
  addTouchDetectionClass();
  setupSwipeHint();
  enableMouseSwipeSupport(); // Now enable mouse support by default
};

export default {
  isTouchDevice,
  addTouchDetectionClass,
  setupSwipeHint,
  enableMouseSwipeSupport,
  initializeTouchFeatures
};
