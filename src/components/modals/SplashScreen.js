// FILE: src/components/modals/SplashScreen.js

import React from 'react';

/**
 * Splash screen component to welcome new users
 * Explains key features of the Scientific Project Planner
 * UPDATED: Changed "Paper" to "Project" throughout
 * UPDATED: Adjusted icon colors to match actual app interface elements
 * ADDED: "Feeling stuck" section about PDF import feature
 * UPDATED: Increased z-index to appear above chat button
 */
const SplashScreen = ({ onClose, showDontShowAgainOption = true }) => {
  const handleDontShowAgain = () => {
    // Store preference in localStorage
    localStorage.setItem('hideWelcomeSplash', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-50" style={{ zIndex: 1000 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header with title and logo - FIXED: Changed "Paper" to "Project" */}
        <div className="bg-purple-600 px-6 py-4 flex items-center">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mr-3 flex-shrink-0">
            <span className="font-bold text-xl text-purple-600">SP</span>
          </div>
          <h1 className="text-white text-xl font-bold">Scientific Project Planner</h1>
        </div>
        
        {/* Content area */}
        <div className="px-6 py-5">
          <p className="text-gray-800 font-medium text-lg mb-4">
            Design a scientific project, step-by-step. Structured for clarity, enhanced by AI.
          </p>
          
          <div className="space-y-4 mb-6">
            {/* Fill out sections systematically - light blue to match section UI */}
            <div className="flex items-start">
              <div className="bg-blue-50 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Fill out each section systematically</p>
                <p className="text-gray-600 text-sm">The app guides you through all essential components of a scientific project</p>
              </div>
            </div>
            
            {/* AI Chat - solid blue to match chat button */}
            <div className="flex items-start">
              <div className="bg-indigo-600 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Get AI assistance anytime</p>
                <p className="text-gray-600 text-sm">Click the indigo "Let's talk about this" button in the bottom right to discuss your current section</p>
              </div>
            </div>
            
            {/* Magic Button - solid purple to match improve instructions button */}
            <div className="flex items-start">
              <div className="bg-purple-600 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Get adaptive guidance as you work</p>
                <p className="text-gray-600 text-sm">The "Improve Instructions" button analyzes your progress and tailors the guidance to your specific needs</p>
              </div>
            </div>
            
            {/* Save/Export - gray to match header buttons */}
            <div className="flex items-start">
              <div className="bg-gray-200 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a2 2 0 011.44.6l2.41 2.7A1 1 0 0017 14v1a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H10a2.5 2.5 0 01-4.9 0H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v2.784a2 2 0 01-.47 1.282l-2.7 3.13a2 2 0 01-1.44.804H15V9a1 1 0 00-1-1H4a1 1 0 000 2h9a1 1 0 110 2H5a1 1 0 000 2h7a1 1 0 001-1v-1h1.596a1 1 0 00.67-.248l1.042-2.5A.993.993 0 0017 8.226V7a1 1 0 00-1-1h-3.5V4a1 1 0 00-1-1H3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Save, export, and share</p>
                <p className="text-gray-600 text-sm">Use the header buttons to save your work, load examples, or export to PDF/DOCX/MD</p>
              </div>
            </div>
            
            {/* PDF/Doc import - same blue as the import button */}
            <div className="flex items-start">
              <div className="bg-indigo-600 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Feeling stuck? Try the PDF import</p>
                <p className="text-gray-600 text-sm">Upload your favorite paper and let the AI create an example project structure based on it</p>
              </div>
            </div>
            
            {/* Paper Review Button - add this back */}
            <div className="flex items-start">
              <div className="bg-green-600 p-2 rounded-full mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Review existing papers</p>
                <p className="text-gray-600 text-sm">Use paper review to see checks for the issues you work on here in other papers</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
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
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Get Started
            </button>
            
            <div className="mt-4 text-gray-500 text-sm">
              Built with ❤️ for researchers by Konrad @Kordinglab
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
