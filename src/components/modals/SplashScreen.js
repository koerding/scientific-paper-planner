// FILE: src/components/modals/SplashScreen.js

import React from 'react';
import c4rLogo from '../../assets/icons/01_C4R-short.png'; // Import the C4R logo

/**
 * Splash screen component to welcome new users
 * REDESIGNED: Integrated the app guide content from gray card
 * FIXED: Better mobile positioning and scrollable content
 * MODIFIED: Added C4R logo and attribution link
 */
const SplashScreen = ({ onClose, showDontShowAgainOption = true }) => {
  const handleDontShowAgain = () => {
    // Store preference in localStorage
    localStorage.setItem('hideWelcomeSplash', 'true');
    onClose();
  };

  // Define icon colors to match app's color scheme
  const iconColors = {
    write: "#4F46E5", // indigo-600 for write/question
    guide: "#7C3AED", // purple-600 for guide
    feedback: "#7C3AED", // purple-600 for feedback
    chat: "#4F46E5", // indigo-600 for chat
    pdf: "#4F46E5", // indigo-600 for pdf import
    review: "#0D9488", // teal-600 for review
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-80 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
      {/* Added p-4 padding and changed items-center to items-start on mobile */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh] my-8">
        {/* Added max-h-[90vh] and my-8 margin to ensure visibility */}
        
        {/* Header with title and logo */}
        <div className="bg-purple-600 px-4 py-3 flex items-center sticky top-0 z-10">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mr-2 flex-shrink-0">
            <span className="font-bold text-lg text-purple-600">SP</span>
          </div>
          <h1 className="text-white text-lg font-bold">Scientific Project Planner</h1>
        </div>
        
        {/* Content area - now scrollable if needed */}
        <div className="px-4 py-3 overflow-y-auto">
          <p className="text-gray-800 font-medium mb-3">
            Design a scientific project (or improve an existing one), step-by-step:
          </p>
          
          <div className="space-y-2 mb-4">
            {/* Step 1: Write a good question */}
            <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
              <div className="rounded-full mr-3 flex items-center justify-center text-white font-bold bg-indigo-600 h-6 w-6 flex-shrink-0 text-xs">1</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke={iconColors.write}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <p className="font-medium text-gray-800 text-sm">Write a good question</p>
              </div>
            </div>
            
            {/* Step 2: Use the guide */}
            <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
              <div className="rounded-full mr-3 flex items-center justify-center text-white font-bold bg-gray-600 h-6 w-6 flex-shrink-0 text-xs">2</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke={iconColors.guide}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="font-medium text-gray-800 text-sm">Use the guide</p>
              </div>
            </div>
            
            {/* Step 3: Get feedback */}
            <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
              <div className="rounded-full mr-3 flex items-center justify-center text-white font-bold bg-purple-600 h-6 w-6 flex-shrink-0 text-xs">3</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke={iconColors.feedback}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-gray-800 text-sm">Once ready, get feedback</p>
              </div>
            </div>
            
            {/* Step 4: Chat for help */}
            <div className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm">
              <div className="rounded-full mr-3 flex items-center justify-center text-white font-bold bg-indigo-600 h-6 w-6 flex-shrink-0 text-xs">4</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke={iconColors.chat}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="font-medium text-gray-800 text-sm">Lost? Chat!</p>
              </div>
            </div>
          </div>
          
          {/* Integrated App Guide Content */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4">
            <h3 className="text-gray-800 font-medium mb-2 text-sm">How it works</h3>
            <ul className="list-disc pl-5 mb-2">
              <li className="text-gray-700 text-sm">New sections (Hypotheses, Audience, etc.) unlock once you score ≥ 6 on the previous step.</li>
              <li className="text-gray-700 text-sm">Turn on <strong>Pro Mode</strong> to reveal all sections at once.</li>
            </ul>
            <p className="text-sm text-gray-700 font-bold mt-2">
              This app guides you through the steps of planning your research. This is key to successfully publishing your papers and to avoid wasting time. Spending 8 hours on this is not a waste. Start by editing the question. And then section by section.
            </p>
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
          
          {/* Footer with action buttons - ensure this is always visible */}
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
              className="px-6 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              Get Started
            </button>
            
            <div className="mt-3 text-gray-500 text-xs">
              Built with ❤️ by Konrad @Kordinglab
              <br />
              in collaboration with com <a href="https://c4r.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:underline">
                <img src={c4rLogo} alt="Center for Reproducible Research" className="h-4 ml-1" style={{ height: '1em', verticalAlign: 'middle' }} />
              </a>
              <br />
              By using this software you acknowledge that Dinosaurs are the most awesome animals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
