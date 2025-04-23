// FILE: src/App.js
import React, { useEffect } from 'react';
// highlight-start
// Import directly from the component file, not the index file
import PaperPlannerApp from './components/PaperPlanner/VerticalPaperPlannerApp';
// highlight-end
import useAppStore from './store/appStore'; // Import the zustand store
import { UIProvider } from './contexts/UIContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  useEffect(() => {
    window.resetApp = () => {
      useAppStore.getState().resetState();
    };
    return () => { delete window.resetApp; };
  }, []);

  return (
    <div className="App">
      <ChatProvider>
        <UIProvider>
            {/* Render the component directly */}
            <PaperPlannerApp />
        </UIProvider>
      </ChatProvider>
    </div>
  );
}

export default App;
