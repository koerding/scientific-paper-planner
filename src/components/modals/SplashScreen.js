// FILE: src/components/modals/SplashScreen.js

import React from 'react';

/**
 * Splash screen component to welcome new users
 * Restructured to show a sequential workflow with consistent icons
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
    feedback: "#059669", // green-600 for feedback
    chat: "#4F46E5", // indigo-600 for chat
    pdf: "#4F46E5", // indigo-600 for pdf import
    review: "#0D9488", // teal-600 for review
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-50" style={{ zIndex: 1000 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header with title and logo */}
        <div className="bg-purple-600 px-6 py-4 flex items-center">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mr-3 flex-shrink-0">
            <span className="font-bold text-xl text-purple-600">SP</span>
          </div>
          <h1 className="text-white text-xl font-bold">Scientific Project Planner</h1>
        </div>
        
        {/* Content area */}
        <div className="px-6 py-5">
          <p className="text-gray-800 font-medium text-lg mb-5">
            Design a scientific project, step-by-step:
          </p>
          
          <div className="space-y-5 mb-6">
            {/* Step 1: Write a good question */}
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full mr-4 flex items-center justify-center text-white font-bold bg-indigo-600 h-8 w-8 flex-shrink-0">1</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke={iconColors.write}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <p className="font-medium text-gray-800">Write a good question</p>
              </div>
            </div>
            
            {/* Step 2: Use the guide */}
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full mr-4 flex items-center justify-center text-white font-bold bg-purple-600 h-8 w-8 flex-shrink-0">2</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke={iconColors.guide}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="font-medium text-gray-800">Use the guide</p>
              </div>
            </div>
            
            {/* Step 3: Get feedback */}
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full mr-4 flex items-center justify-center text-white font-bold bg-green-600 h-8 w-8 flex-shrink-0">3</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke={iconColors.feedback}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-gray-800">Once ready, get feedback</p>
              </div>
            </div>
            
            {/* Step 4: Chat for help */}
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full mr-4 flex items-center justify-center text-white font-bold bg-indigo-600 h-8 w-8 flex-shrink-0">4</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke={iconColors.chat}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="font-medium text-gray-800">Lost? Chat!</p>
              </div>
            </div>
          </div>
          
          {/* Additional tips with horizontal rule separator */}
          <div className="border-t border-gray-200 pt-5 mt-2">
            <h3 className="text-gray-700 font-medium mb-3">Need more help?</h3>
            
            <div className="space-y-3">
              {/* PDF Import Tip */}
              <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={iconColors.pdf}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-medium">Feeling stuck?</span> Take a great paper and use the "Pdf→Example" in the menu.
                </p>
              </div>
              
              {/* Review Paper Tip */}
              <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={iconColors.review}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-medium">Want to see the rules in action?</span> Have the AI review an existing paper.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-7">
            {showDontShowAgainOption && (
              <div className="mb-4 flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    onChange={handleDontShowAgain}
                  />
                  <span className="ml-2 text-sm text-gray-600">Don't show this again</span>
                </label>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium shadow-sm hover:shadow"
            >
              Get Started
            </button>
            
            <div className="mt-4 text-gray-500 text-sm">
              Built with ❤️ by Konrad @Kordinglab
              
              <p className="mt-1">
                By using this software you acknowledge that Dinosaurs are the most awesome animals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
