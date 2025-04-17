// FILE: src/utils/analyticsUtils.js
import ReactGA from 'react-ga4';

/**
 * Analytics utility functions to track user interactions
 * across the Scientific Paper Planner
 * FIXED: Ensured all value parameters are valid numbers
 */

// Track page views when sections change
export const trackPageView = (page) => {
  try {
    ReactGA.send({ hitType: "pageview", page });
    console.log(`GA4 Pageview tracked: ${page}`);
  } catch (error) {
    console.error('Error tracking pageview:', error);
  }
};

// Track user interactions as events with proper type checking
export const trackEvent = (category, action, label = null, value = null) => {
  try {
    // Ensure value is a valid number or null
    let numericValue = null;
    if (value !== null) {
      if (typeof value === 'number' && !isNaN(value)) {
        numericValue = value;
      } else if (typeof value === 'string') {
        // Try to convert string to number
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          numericValue = parsedValue;
        }
      }
    }
    
    // Only include value in the event if it's a valid number
    const eventParams = {
      category,
      action,
      label
    };
    
    if (numericValue !== null) {
      eventParams.value = numericValue;
    }
    
    ReactGA.event(eventParams);
    console.log(`GA4 Event tracked: ${category} - ${action} - ${label || 'no label'}${numericValue !== null ? ` - value: ${numericValue}` : ''}`);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Common event tracking functions for the Paper Planner
export const trackSectionChange = (sectionId, sectionTitle) => {
  trackEvent('Navigation', 'Section Change', `${sectionTitle} (${sectionId})`);
  // Also track as a pageview for better analytics
  trackPageView(`/section/${sectionId}`);
};

export const trackInstructionImprovement = (sectionId) => {
  trackEvent('Interactions', 'Improve Instructions', sectionId);
};

export const trackChatInteraction = (sectionId, messageCount) => {
  // Ensure messageCount is a number
  const count = typeof messageCount === 'number' ? messageCount : 0;
  trackEvent('Interactions', 'Chat Message', sectionId, count);
};

export const trackExport = (format) => {
  trackEvent('Document Actions', 'Export', format);
};

export const trackSave = () => {
  trackEvent('Document Actions', 'Save Project');
};

export const trackApproachToggle = (approach) => {
  trackEvent('Research Method', 'Toggle Approach', approach);
};

export const trackDataMethodToggle = (method) => {
  trackEvent('Research Method', 'Toggle Data Method', method);
};

// Track form input changes (debounced to reduce event frequency)
let inputTrackingTimeout = null;
export const trackInputChange = (sectionId, length) => {
  // Clear any existing timeout
  if (inputTrackingTimeout) {
    clearTimeout(inputTrackingTimeout);
  }
  
  // Set a new timeout to track the input change after 2 seconds of inactivity
  inputTrackingTimeout = setTimeout(() => {
    // Ensure length is a valid number
    const numericLength = typeof length === 'number' && !isNaN(length) ? length : 0;
    
    trackEvent(
      'Content', 
      'Input Change', 
      sectionId, 
      // Round length to nearest 100 to avoid too many unique values
      Math.round(numericLength / 100) * 100
    );
  }, 2000);
};

// Track errors for debugging
export const trackError = (errorType, errorMessage, componentName) => {
  trackEvent('Errors', errorType, `${componentName}: ${errorMessage}`);
};

// Track feature usage that might be candidates for improvement
export const trackFeatureUsage = (feature, action) => {
  trackEvent('Features', action, feature);
};

// Helper function to measure app performance
export const trackTiming = (category, variable, value) => {
  // Ensure value is a number
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  try {
    ReactGA.timing({
      category,
      variable,
      value: numericValue
    });
    console.log(`GA4 Timing tracked: ${category} - ${variable} - ${numericValue}ms`);
  } catch (error) {
    console.error('Error tracking timing:', error);
  }
};
