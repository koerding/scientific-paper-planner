// FILE: src/components/modals/ReviewPaperModal.js

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { exportReview } from '../../services/paperReviewService';

/**
 * Modal component for displaying paper review results
 * FIXED: Improved error handling and added more robust feedback
 */
const ReviewPaperModal = ({ showModal, onClose, reviewData }) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!showModal || !reviewData) return null;
  
  // Handle exporting the review as a text file
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const success = exportReview(reviewData.review, reviewData.paperName);
      if (!success) {
        alert('There was an error exporting the review. Please try again.');
      }
    } catch (error) {
      console.error("Error exporting review:", error);
      alert('There was an error exporting the review: ' + (error.message || 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };
  
  // Handle copying to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reviewData.review);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error'));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Scientific Paper Review</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Paper info */}
        <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
          <p className="text-gray-700">
            <span className="font-medium">Paper: </span>
            {reviewData.paperName || 'Untitled document'}
          </p>
          <p className="text-gray-700 text-sm">
            <span className="font-medium">Review generated: </span>
            {new Date(reviewData.timestamp).toLocaleString()}
          </p>
        </div>
        
        {/* Review content */}
        <div className="px-6 py-4 overflow-y-auto flex-grow">
          {reviewData.review ? (
            <div className="prose prose-teal max-w-none">
              <ReactMarkdown>{reviewData.review}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No review content available.</p>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>This review was generated using AI and should be considered as supplementary feedback.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleCopyToClipboard}
              className={`flex items-center px-4 py-2 rounded ${
                copySuccess ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={copySuccess}
            >
              {copySuccess ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
            
            <button 
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              {exportLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export as Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
