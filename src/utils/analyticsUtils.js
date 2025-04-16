// FILE: src/utils/analyticsUtils.js
import ReactGA from 'react-ga4';

/**
 * Analytics utility functions to track user interactions
 * across the Scientific Paper Planner
 */

// Track page views when sections change
export const trackPageView = (page) => {
  ReactGA.send({ hitType: "pageview", page });
};

// Track user interactions as events
export const trackEvent = (category, action, label = null, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value
  });
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
  trackEvent('Interactions', 'Chat Message', sectionId, messageCount);
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
    trackEvent(
      'Content', 
      'Input Change', 
      sectionId, 
      // Round length to nearest 100 to avoid too many unique values
      Math.round(length / 100) * 100
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
  ReactGA.timing({
    category,
    variable,
    value
  });
};
