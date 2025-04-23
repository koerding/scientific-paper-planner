// FILE: src/App.js
import React, { useEffect } from 'react';
import PaperPlannerApp from './PaperPlannerApp'; // Uses the wrapper
import useAppStore from './store/appStore'; // Import the zustand store
import { UIProvider } from './contexts/UIContext'; // Keep UI context for modals etc.
import { ChatProvider } from './contexts/ChatContext'; // Keep Chat context for now

// No longer needed: ProjectProvider, SectionProvider, FeedbackProvider

function App() {
  // You can optionally call store actions here on initial load if needed
  // e.g., const initialize = useAppStore(state => state.initialize);
  // useEffect(() => { initialize(); }, [initialize]);

  // Reset function using the store's action
  useEffect(() => {
    window.resetApp = () => {
      console.log("Global app reset triggered via store");
      useAppStore.getState().resetState(); // Call the store's reset action
    };
    return () => { delete window.resetApp; };
  }, []);


  return (
    <div className="App">
      {/* Remove ProjectProvider, SectionProvider, FeedbackProvider */}
      {/* Keep UIProvider and ChatProvider if their state isn't merged */}
      <ChatProvider>
        <UIProvider>
            <PaperPlannerApp />
        </UIProvider>
      </ChatProvider>
    </div>
  );
}

export default App;
