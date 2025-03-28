import React, { useState, useEffect } from 'react';
import ClassicPaperPlannerApp from './ClassicPaperPlannerApp';
import ModernPaperPlannerApp from './ModernPaperPlannerApp';
import './PaperPlanner.css';

/**
 * Main Paper Planner component with UI theme selection capability
 */
const PaperPlannerApp = () => {
  // Check for saved theme preference
  const [uiVersion, setUiVersion] = useState(() => {
    const savedVersion = localStorage.getItem('paperPlannerUIVersion');
    return savedVersion || 'modern'; // Default to modern UI
  });
  
  // Save theme preference when changed
  useEffect(() => {
    localStorage.setItem('paperPlannerUIVersion', uiVersion);
  }, [uiVersion]);

  // Floating UI switcher
  const ThemeSwitcher = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg p-2 flex items-center">
        <button
          onClick={() => setUiVersion('classic')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            uiVersion === 'classic' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Classic UI
        </button>
        <button
          onClick={() => setUiVersion('modern')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            uiVersion === 'modern' 
              ? 'bg-indigo-600 text-white' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Modern UI
        </button>
      </div>
    </div>
  );

  return (
    <>
      {uiVersion === 'classic' ? <ClassicPaperPlannerApp /> : <ModernPaperPlannerApp />}
      <ThemeSwitcher />
    </>
  );
};

export default PaperPlannerApp;
