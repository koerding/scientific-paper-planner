// FILE: src/utils/touchDetection.js

/**
 * Touch and swipe detection utilities
 * FIXED: Re-enabled mouse swiping support
 * FIXED: Improved swipe detection for both mouse and touch
 */

// Cache for tracking touch state
const touchState = {
  startX: null,
  startY: null,
  startTarget: null,
  swipeThreshold: 75, // Minimum distance to trigger a swipe
  isFirstVisit: true, // Used to show swipe hint only once
};

// Mouse swipe state
const mouseState = {
  isDown: false,
  startX: null,
  startY: null,
  startTarget: null,
  swipeThreshold: 75, // Minimum distance for mouse swipe
};

/**
 * Detect if the device supports touch events
 * @returns {boolean} True if touch is supported
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Set up a visual hint for swiping functionality on first visit
 */
export const setupSwipeHint = () => {
  if (!touchState.isFirstVisit) return;
  
  const hintShownBefore = localStorage.getItem('swipeHintShown') === 'true';
  if (hintShownBefore) return;
  
  // Create and show the hint
  setTimeout(() => {
    const swipeHints = document.querySelectorAll('.swipe-hint');
    swipeHints.forEach(hint => {
      hint.classList.add('active');
      setTimeout(() => {
        hint.classList.remove('active');
        localStorage.setItem('swipeHintShown', 'true');
        touchState.isFirstVisit = false;
      }, 3000);
    });
  }, 2000);
  
  // Add styles for the hint animation if not already present
  if (!document.getElementById('swipe-hint-styles')) {
    const style = document.createElement('style');
    style.id = 'swipe-hint-styles';
    style.textContent = `
      .swipe-hint {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        transform: translate(-50%, -50%);
        background-color: rgba(124, 58, 237, 0.2);
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 100;
      }
      
      .swipe-hint:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        transform: translate(-50%, -50%);
        background-color: rgba(124, 58, 237, 0.6);
        border-radius: 50%;
      }
      
      .swipe-hint.active {
        opacity: 1;
        animation: swipeHintAnimation 2s ease-in-out;
      }
      
      @keyframes swipeHintAnimation {
        0% { transform: translate(-50%, -50%) translateX(-30px); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translate(-50%, -50%) translateX(30px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * Initialize touch detection and swipe behavior for mode switching
 * FIXED: Re-enabled mouse swipe and improved initialization
 */
export const initializeTouchFeatures = () => {
  // Add a class to indicate touch support
  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
  } else {
    document.body.classList.add('mouse-device');
  }
  
  // Clean up any existing event listeners to prevent duplicates
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
  
  // Set up event listeners for touch events
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
  
  // Set up event listeners for mouse events (re-enabled)
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
  
  // Set up the swipe hint
  setupSwipeHint();
  
  console.log('Touch and mouse swipe features initialized');
};

/**
 * Handle touch start events
 * @param {TouchEvent} event - The touch event
 */
const handleTouchStart = (event) => {
  if (event.touches.length !== 1) return; // Only track single touches
  
  const touch = event.touches[0];
  touchState.startX = touch.clientX;
  touchState.startY = touch.clientY;
  touchState.startTarget = event.target;
  
  // Check if touch started in a text field or inside an element with contenteditable
  const isTextField = event.target.tagName === 'INPUT' || 
                      event.target.tagName === 'TEXTAREA' || 
                      event.target.isContentEditable || 
                      event.target.classList.contains('section-editor') ||
                      hasParentWithClass(event.target, 'section-editor');
  
  // If touch started in a text field, mark it to be ignored
  if (isTextField) {
    touchState.ignoreSwipe = true;
    // Allow default browser behavior for text selection
  } else {
    touchState.ignoreSwipe = false;
  }
};

/**
 * Handle touch end events to detect swipes
 * @param {TouchEvent} event - The touch event
 */
const handleTouchEnd = (event) => {
  // If we're ignoring this swipe (started in text field), reset and return
  if (touchState.ignoreSwipe || !touchState.startX) {
    touchState.startX = null;
    touchState.startY = null;
    touchState.startTarget = null;
    touchState.ignoreSwipe = false;
    return;
  }
  
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchState.startX;
  const deltaY = touch.clientY - touchState.startY;
  
  // Check if it's a horizontal swipe (more horizontal than vertical movement)
  const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
  
  // Check if it meets the distance threshold to be considered a swipe
  const isSwipe = isHorizontalSwipe && Math.abs(deltaX) > touchState.swipeThreshold;
  
  if (isSwipe) {
    handleSwipe(deltaX > 0 ? 'right' : 'left');
  }
  
  // Reset touch state
  touchState.startX = null;
  touchState.startY = null;
  touchState.startTarget = null;
  touchState.ignoreSwipe = false;
};

/**
 * Handle mouse down event to start tracking potential swipe
 * FIXED: Re-enabled mouse swipe functionality
 * @param {MouseEvent} event - The mouse event
 */
const handleMouseDown = (event) => {
  // Only track left mouse button
  if (event.button !== 0) return;
  
  // Check if started in text field
  const isTextField = event.target.tagName === 'INPUT' || 
                    event.target.tagName === 'TEXTAREA' || 
                    event.target.isContentEditable || 
                    event.target.classList.contains('section-editor') ||
                    hasParentWithClass(event.target, 'section-editor');

  // Skip if in a text field
  if (isTextField) {
    mouseState.isDown = false;
    return;
  }
  
  // Store start position
  mouseState.isDown = true;
  mouseState.startX = event.clientX;
  mouseState.startY = event.clientY;
  mouseState.startTarget = event.target;
  
  // Check if we're in a card or panel container - look for these classes or parents
  const isInCardContainer = event.target.classList.contains('card-container') || 
                           hasParentWithClass(event.target, 'card-container') ||
                           hasParentWithClass(event.target, 'panels-container');
  
  if (!isInCardContainer) {
    mouseState.isDown = false;
  } else {
    // Add a visual class to indicate swipeable
    document.body.classList.add('mouse-swipe-enabled');
  }
};

/**
 * Handle mouse move to track swipe progress
 * @param {MouseEvent} event - The mouse event
 */
const handleMouseMove = (event) => {
  if (!mouseState.isDown || mouseState.startX === null) return;
  
  const deltaX = event.clientX - mouseState.startX;
  const deltaY = event.clientY - mouseState.startY;
  
  // Add a data attribute to body for current drag direction
  if (Math.abs(deltaX) > 10) {
    document.body.setAttribute('data-swipe-direction', deltaX > 0 ? 'right' : 'left');
  }
};

/**
 * Handle mouse up to detect completed swipe
 * @param {MouseEvent} event - The mouse event
 */
const handleMouseUp = (event) => {
  if (!mouseState.isDown || mouseState.startX === null) {
    mouseState.isDown = false;
    document.body.classList.remove('mouse-swipe-enabled');
    document.body.removeAttribute('data-swipe-direction');
    return;
  }
  
  const deltaX = event.clientX - mouseState.startX;
  const deltaY = event.clientY - mouseState.startY;
  
  // Check if it's a horizontal swipe
  const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
  
  // Check if it meets the threshold to be considered a swipe
  const isSwipe = isHorizontalSwipe && Math.abs(deltaX) > mouseState.swipeThreshold;
  
  if (isSwipe) {
    handleSwipe(deltaX > 0 ? 'right' : 'left');
  }
  
  // Reset mouse state
  mouseState.isDown = false;
  mouseState.startX = null;
  mouseState.startY = null;
  mouseState.startTarget = null;
  
  // Remove visual indicators
  document.body.classList.remove('mouse-swipe-enabled');
  document.body.removeAttribute('data-swipe-direction');
};

/**
 * Handle swipe gesture by changing mode
 * @param {string} direction - The swipe direction ('left' or 'right')
 */
const handleSwipe = (direction) => {
  // Get the current UI mode
  const store = window.useAppStore?.getState();
  if (!store) return;
  
  const currentMode = store.uiMode;
  
  // Determine the new mode based on swipe direction
  if (direction === 'left' && currentMode === 'write') {
    // Swipe left in write mode -> go to guide mode
    store.setUiMode('guide');
    console.log('Swipe left detected, switching to guide mode');
  } else if (direction === 'right' && currentMode === 'guide') {
    // Swipe right in guide mode -> go to write mode
    store.setUiMode('write');
    console.log('Swipe right detected, switching to write mode');
  }
};

/**
 * Check if an element has a parent with a specific class
 * @param {HTMLElement} element - The element to check
 * @param {string} className - The class name to look for
 * @returns {boolean} - True if the element has a parent with the class
 */
const hasParentWithClass = (element, className) => {
  if (!element || !className) return false;
  
  let current = element;
  while (current) {
    if (current.classList && current.classList.contains(className)) {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
};
