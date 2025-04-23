// FILE: src/App.js
import React, { useEffect } from 'react';
import PaperPlannerApp from './components/PaperPlanner/VerticalPaperPlannerApp';
import useAppStore from './store/appStore';
// import { UIProvider } from './contexts/UIContext'; // REMOVED
import { ChatProvider } from './contexts/ChatContext'; // Keep ChatProvider if still used

function App() {
  useEffect(() => {
    window.resetApp = () => {
      useAppStore.getState().resetState();
    };
    // Initialize onboarding check after store potentially hydrates
    // useAppStore.getState()._initializeOnboarding(); // Moved to store onRehydrate

    return () => { delete window.resetApp; };
  }, []);

  return (
    <div className="App">
      {/* Keep ChatProvider if chat state is separate */}
      <ChatProvider>
         {/* <UIProvider> REMOVED */}
            <PaperPlannerApp />
         {/* </UIProvider> REMOVED */}
      </ChatProvider>
    </div>
  );
}

export default App;
