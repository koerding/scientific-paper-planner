// FILE: src/App.js
import React, { useEffect } from 'react';
import PaperPlannerApp from './components/PaperPlanner/VerticalPaperPlannerApp';
import useAppStore from './store/appStore';
// import { ChatProvider } from './contexts/ChatContext'; // REMOVED

function App() {
  useEffect(() => {
    window.resetApp = () => {
      useAppStore.getState().resetState();
    };
    return () => { delete window.resetApp; };
  }, []);

  return (
    <div className="App">
      {/* <ChatProvider> REMOVED */}
         <PaperPlannerApp />
      {/* </ChatProvider> REMOVED */}
    </div>
  );
}

export default App;
