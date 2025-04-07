// This file should be placed in your public directory
// It's a simple wrapper around PDF.js worker functionality

// This avoids the ES Module syntax issues
var Module = {};

// The handler that the fake worker will look for
var WorkerMessageHandler = {
  setup: function() {
    console.log("Custom PDF.js worker set up successfully");
    return true;
  },
  
  handleMessage: function(data) {
    // Very basic handler that helps the PDF viewer initialize
    return { 
      isReady: true,
      supportedFeatures: []
    };
  }
};

// Export the handler in a way that doesn't use ES modules
if (typeof window !== 'undefined') {
  window.WorkerMessageHandler = WorkerMessageHandler;
}
if (typeof self !== 'undefined') {
  self.WorkerMessageHandler = WorkerMessageHandler;
}

console.log("PDF.js worker wrapper loaded!");
