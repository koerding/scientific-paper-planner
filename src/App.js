// src/App.js
import React, { useEffect } from 'react';
import PaperPlannerApp from './PaperPlannerApp';
import { resetAllState } from './services/resetService';

// Import all context providers
import { ProjectProvider } from './contexts/ProjectContext';
import { SectionProvider } from './contexts/SectionContext';
import { UIProvider } from './contexts/UIContext';
import { ChatProvider } from './contexts/ChatContext';
import { FeedbackProvider } from './contexts/FeedbackContext';

// Import section data to get the section IDs
import sectionContent from './data/sectionContent.json';

function App() {
  // Get all section IDs for the SectionProvider
  const allSectionIds = sectionContent.sections.map(section => section.id);

  // Initialize app and set up any global listeners
  useEffect(() => {
    // Set up a global handler for handling reset commands from anywhere in the app
    window.resetApp = () => {
      console.log("Global app reset triggered");
      resetAllState();
    };

    // Clean up on unmount
    return () => {
      delete window.resetApp;
    };
  }, []);

  return (
    <div className="App">
      {/* Wrap the entire app with all context providers */}
      <ProjectProvider>
        <SectionProvider sectionIds={allSectionIds}>
          <FeedbackProvider>
            <ChatProvider>
              <UIProvider>
                <PaperPlannerApp />
              </UIProvider>
            </ChatProvider>
          </FeedbackProvider>
        </SectionProvider>
      </ProjectProvider>
    </div>
  );
}

export default App;
