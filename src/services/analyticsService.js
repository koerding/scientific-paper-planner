// Add to a new file: src/services/analyticsService.js
export const trackEvent = (eventName, properties = {}) => {
  try {
    // Only log if user has opted in (stored in localStorage)
    const hasOptedIn = localStorage.getItem('analyticsOptIn') === 'true';
    if (!hasOptedIn) return;
    
    // Add timestamp and session ID (anonymous)
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      sessionId: getOrCreateSessionId()
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`ANALYTICS: ${eventName}`, enrichedProperties);
    }
    
    // Send to your preferred analytics service
    // You could use a simple endpoint of your own or services like Plausible, SimpleAnalytics, etc.
    fetch('https://your-analytics-endpoint.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, properties: enrichedProperties }),
      // Send as non-blocking request
      keepalive: true
    }).catch(err => console.error('Analytics error:', err));
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Helper to maintain consistent session ID
const getOrCreateSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};
