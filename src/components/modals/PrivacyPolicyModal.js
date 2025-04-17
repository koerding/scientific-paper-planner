// FILE: src/components/modals/PrivacyPolicyModal.js
import React from 'react';

/**
 * Privacy Policy modal component for Google Analytics compliance
 * UPDATED: Changed "Paper" to "Project" in the title and content
 */
const PrivacyPolicyModal = ({ showModal, onClose }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="prose max-w-none">
          <h3>Scientific Project Planner - Privacy Policy</h3>
          
          <p>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h4>1. Introduction</h4>
          <p>
            This Privacy Policy explains how the Scientific Project Planner ("we", "us", or "our") 
            collects, uses, and shares information about you when you use our web application.
          </p>
          
          <h4>2. Information We Collect</h4>
          <p>
            We use Google Analytics to collect standard internet log information and details of 
            visitor behavior patterns. We do this to track things such as the number of visitors 
            to the various parts of the site, user interactions, and to help us improve the application 
            experience.
          </p>
          
          <p>
            The information collected includes:
          </p>
          <ul>
            <li>Information about your browser, device, and IP address</li>
            <li>Pages you visit within our application</li>
            <li>How you interact with the application (button clicks, feature usage)</li>
            <li>How long you spend on different sections</li>
          </ul>
          
          <h4>3. Cookies</h4>
          <p>
            Google Analytics uses cookies to collect information and report website usage statistics. 
            Cookies are files stored on your browser. You can control or delete these files if you wish.
          </p>
          
          <h4>4. How We Use Your Information</h4>
          <p>
            We use the collected data for the following purposes:
          </p>
          <ul>
            <li>To understand how users interact with our application</li>
            <li>To identify areas for improvement</li>
            <li>To analyze which features are most valuable to users</li>
            <li>To detect and address technical issues</li>
          </ul>
          
          <h4>5. Data Sharing</h4>
          <p>
            We do not share your personal information with third parties except as described in this policy.
            The analytics data we collect is processed by Google Analytics in accordance with their terms of service.
          </p>
          
          <h4>6. Your Choices</h4>
          <p>
            You can prevent Google Analytics from recognizing you on return visits by disabling cookies in your browser.
            You can also use the Google Analytics Opt-Out Browser Add-on available at: 
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              https://tools.google.com/dlpage/gaoptout
            </a>
          </p>
          
          <h4>7. Changes to This Policy</h4>
          <p>
            We may update this privacy policy from time to time to reflect changes in our practices or for other 
            operational, legal, or regulatory reasons.
          </p>
          
          <h4>8. Contact Us</h4>
          <p>
            If you have any questions about this Privacy Policy, please contact us at kording@upenn.edu.
          </p>
        </div>
        
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
