// FILE: src/components/modals/SplashScreen.js
// MODIFIED: Added GIF to explain app functionality.
// System is always in pro mode, focus on AI feedback. No new dependencies introduced.
import React from 'react';
import c4rLogo from '../../assets/icons/01_C4R-short.png';

const SplashScreen = ({ onClose, showDontShowAgainOption = true }) => {
  const handleDontShowAgain = () => {
    localStorage.setItem('hideWelcomeSplash', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-80 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh] my-8">
        
        <div className="bg-purple-600 px-4 py-3 flex items-center sticky top-0 z-10">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mr-2 flex-shrink-0">
            <span className="font-bold text-lg text-purple-600">SP</span>
          </div>
          <h1 className="text-white text-lg font-bold">Scientific Project Planner</h1>
        </div>
        
        <div className="px-6 py-5 overflow-y-auto">
          <p className="text-gray-800 text-lg mb-3">
            Welcome! Let's plan your scientific project, step-by-step.
          </p>
          
          {/* Added GIF demonstration - make sure your GIF URL is correct */}
          <div className="mb-5 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <img 
              src="/Explain App.gif" 
              alt="How to use Scientific Project Planner" 
              className="w-full"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
            <div className="bg-gray-50 px-3 py-2 text-sm text-center text-gray-600">
              How the Scientific Project Planner works
            </div>
          </div>
          
          <div className="space-y-3 mb-5">
            <div>
              <h3 className="font-semibold text-gray-800 text-md mb-1">What is this tool?</h3>
              <p className="text-sm text-gray-700">
                This tool guides you in planning a scientific project, from your initial question to a full outline. AI provides feedback to refine your ideas. All sections are available for you to work on from the start.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 text-md mb-2">How it Works</h3>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-sm text-gray-700">
                <li>
                  <strong>Outline Your Project:</strong> Fill in details for each section. The planner provides structure and prompts.
                </li>
                <li>
                  <strong>Get AI Feedback:</strong> Request AI-powered feedback on your written sections to identify areas for improvement and strengthen your arguments.
                </li>
                <li>
                  <strong>Iterate and Refine:</strong> Use the feedback to revise your content.
                </li>
              </ol>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-4 border-t border-gray-200 pt-3 mt-5"> {/* Added mt-5 for spacing */}
             We value your privacy. This application processes data locally in your browser. AI features
             involve sending content to a third-party API (OpenAI). By using these features, you agree
             to their terms. We use cookies to remember your preferences (like hiding this splash screen).
          </div>
          
          <div className="text-center mt-4 sticky bottom-0 bg-white py-3 border-t border-gray-100">
            {showDontShowAgainOption && (
              <div className="mb-3 flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    onChange={handleDontShowAgain}
                  />
                  <span className="ml-2 text-xs text-gray-600">Don't show this again</span>
                </label>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              Get Started
            </button>
            
            <div className="mt-3 text-gray-500 text-xs">
              Built by Konrad @Kordinglab
              in collaboration with <a href="https://c4r.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:underline">
                <img src={c4rLogo} alt="Center for Reproducible Research" className="ml-1" style={{ height: '1em', verticalAlign: 'middle' }} />
              </a>
            </div>
          </div>
        </div>

       {/* Additional tips with horizontal rule separator */}
          <div className="mb-3">
            <h3 className="text-gray-700 font-medium mb-2 text-sm">Need more help?</h3>
            
            <div className="space-y-2">
              {/* PDF Import Tip */}
              <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={iconColors.pdf}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700 text-xs">
                  <span className="font-medium">Feeling stuck?</span> Take a great paper and use the "Pdf→Example" in the menu.
                </p>
              </div>
              
              {/* Review Paper Tip */}
              <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={iconColors.review}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700 text-xs">
                  <span className="font-medium">Want to see the rules in action?</span> Have the AI review an existing paper.
                </p>
              </div>
            </div>
          </div>
     
                
      </div>
    </div>
  );
};

export default SplashScreen;
