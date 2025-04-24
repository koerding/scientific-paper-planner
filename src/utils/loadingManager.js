// FILE: src/utils/loadingManager.js
// A simple global event-based loading manager that doesn't rely on store states

// Create a simple event system for loading state
const loadingListeners = [];
let globalLoadingState = false;

// Main functions
export const setGlobalLoading = (isLoading) => {
  globalLoadingState = isLoading;
  // Notify all listeners
  loadingListeners.forEach(listener => listener(isLoading));
};

export const isGlobalLoading = () => {
  return globalLoadingState;
};

export const addLoadingListener = (listener) => {
  if (typeof listener === 'function') {
    loadingListeners.push(listener);
  }
  return () => removeLoadingListener(listener); // return cleanup function
};

export const removeLoadingListener = (listener) => {
  const index = loadingListeners.indexOf(listener);
  if (index > -1) {
    loadingListeners.splice(index, 1);
  }
};
