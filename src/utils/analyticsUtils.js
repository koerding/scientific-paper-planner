// FILE: src/utils/analyticsUtils.js
import ReactGA from 'react-ga';

/**
 * Analytics utility functions to track user interactions
 * across the Scientific Paper Planner
 */

// Track page views when sections change
export const trackPageView = (page) => {
  ReactGA.pageview(page);
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
