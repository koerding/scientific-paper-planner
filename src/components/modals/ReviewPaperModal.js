// FILE: src/components/modals/ReviewPaperModal.js

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { exportReview } from '../../services/paperReviewService';

/**
 * Enhanced modal component for displaying paper review results
 * - Added past reviews storage and access
 * - Improved UI with tabs for past/current reviews
 * - Added file uploader for new reviews directly in the modal
 */
const ReviewPaperModal = ({ showModal, onClose, reviewData, handleReviewPaper }) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [pastReviews, setPastReviews] = useState([]);
  const [selectedPastReview, setSelectedPastReview] = useState(null);
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  
  // Load past reviews from localStorage when modal opens
  useEffect(() => {
    if (showModal) {
      try {
        const savedReviews = localStorage.getItem('paperReviews');
        if (savedReviews) {
          const parsedReviews = JSON.parse(savedReviews);
          setPastReviews(parsedReviews);
        }
      } catch (error) {
        console.error("Error loading past reviews:", error);
      }
    }
  }, [showModal]);
  
  // Save current review to localStorage when received
  useEffect(() => {
    if (reviewData && reviewData.success && reviewData.review) {
      try {
        // Get existing reviews
        const savedReviews = localStorage.getItem('paperReviews') || '[]';
        const parsedReviews = JSON.parse(savedReviews);
        
        // Check if this review already exists (by timestamp)
        const existingIndex = parsedReviews.findIndex(r => r.timestamp === reviewData.timestamp);
        
        // If it doesn't exist, add it to the list
        if (existingIndex === -1) {
          const updatedReviews = [
            {
              id: Date.now().toString(),
              paperName: reviewData.paperName,
              timestamp: reviewData.timestamp,
              review: reviewData.review,
              preview: reviewData.review.substring(0, 150) + '...'
            },
            ...parsedReviews
          ].slice(0, 10); // Keep only the 10 most recent reviews
          
          localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
          setPastReviews(updatedReviews);
        }
      } catch (error) {
        console.error("Error saving review:", error);
      }
    }
  }, [reviewData]);
  
  // Handle selecting a past review
  const handleSelectPastReview = (review) => {
    setSelectedPastReview(review);
  };
  
  // Handle export of selected review
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const reviewToExport = activeTab === 'past' && selectedPastReview 
        ? selectedPastReview.review
        : reviewData.review;
        
      const paperName = activeTab === 'past' && selectedPastReview 
        ? selectedPastReview.paperName
        : reviewData.paperName;
        
      const success = exportReview(reviewToExport, paperName);
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
      const textToCopy = activeTab === 'past' && selectedPastReview 
        ? selectedPastReview.review
        : reviewData.review;
        
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Handle new review file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setNewReviewLoading(true);
    // Set to current tab to see the new review when it's done
    setActiveTab('current');
    
    try {
      await handleReviewPaper({ target: { files: [file] } });
    } catch (error) {
      console.error("Error during paper review:", error);
      alert("Error reviewing paper: " + (error.message || "Unknown error"));
    } finally {
      setNewReviewLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };
  
  // Delete a past review
  const handleDeleteReview = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        const updatedReviews = pastReviews.filter(r => r.id !== reviewId);
        localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
        setPastReviews(updatedReviews);
        
        // If the deleted review was selected, clear selection
        if (selectedPastReview && selectedPastReview.id === reviewId) {
          setSelectedPastReview(null);
        }
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };
  
  if (!showModal) return null;
  
  // Determine what content to show based on active tab
  const showCurrentReview = activeTab === 'current' && reviewData?.review;
  const showPastReviewList = activeTab === 'past' && pastReviews.length > 0;
  const showPastReviewContent = activeTab === 'past' && selectedPastReview;
  const showEmptyPastReviews = activeTab === 'past' && pastReviews.length === 0;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
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
        
        {/* Tabs Navigation */}
        <div className="bg-gray-100 border-b border-gray-200 flex">
          <button
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'current' 
                ? 'bg-white text-teal-700 border-t-2 border-teal-500' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Current Review
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'past' 
                ? 'bg-white text-teal-700 border-t-2 border-teal-500' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past Reviews
          </button>
          
          {/* New Review Button - Always visible */}
          <div className="ml-auto flex items-center px-3">
            <label
              className={`flex items-center px-4 py-2 rounded ${
                newReviewLoading
                  ? 'bg-teal-400 cursor-wait'
                  : 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
              } text-white font-medium text-sm`}
            >
              {newReviewLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reviewing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New Review
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc" 
                onChange={handleFileUpload}
                disabled={newReviewLoading} 
              />
            </label>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow h-full overflow-hidden flex">
          {/* Current Review Tab Content */}
          {activeTab === 'current' && (
            <div className="w-full flex flex-col">
              {/* Paper info if we have reviewData */}
              {reviewData && (
                <div className="bg-gray-50 px-6 py-2 border-b border-gray-200">
                  <p className="text-gray-700">
                    <span className="font-medium">Paper: </span>
                    {reviewData.paperName || 'Untitled document'}
                  </p>
                  <p className="text-gray-700 text-sm">
                    <span className="font-medium">Review generated: </span>
                    {new Date(reviewData.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
              
              {/* Current Review Content */}
              <div className="px-6 py-4 overflow-y-auto flex-grow">
                {showCurrentReview ? (
                  <div className="prose prose-teal max-w-none">
                    <ReactMarkdown>{reviewData.review}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg mb-2">No current review</p>
                    <p className="text-base mb-6">Upload a paper to get a critical review of its scientific quality.</p>
                    
                    <label className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded cursor-pointer inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Paper for Review
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.docx,.doc" 
                        onChange={handleFileUpload} 
                        disabled={newReviewLoading} 
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Past Reviews Tab Content */}
          {activeTab === 'past' && (
            <div className="w-full flex flex-col md:flex-row">
              {/* Past Reviews List - Left sidebar */}
              <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto max-h-[calc(90vh-9rem)]">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700">Past Reviews</h3>
                  <p className="text-xs text-gray-500">Select a review to view</p>
                </div>
                
                {showEmptyPastReviews ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>No past reviews found</p>
                    <p className="text-sm mt-2">Reviews will be saved here after you generate them</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pastReviews.map(review => (
                      <li 
                        key={review.id} 
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedPastReview?.id === review.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                        }`}
                        onClick={() => handleSelectPastReview(review)}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm text-gray-800 mb-1 truncate flex-grow">{review.paperName}</h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReview(review.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete review"
                              aria-label="Delete review"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {new Date(review.timestamp).toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{review.preview}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Selected Past Review Content - Right side */}
              <div className="w-full md:w-2/3 overflow-y-auto max-h-[calc(90vh-9rem)]">
                {selectedPastReview ? (
                  <div className="h-full flex flex-col">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800">{selectedPastReview.paperName}</h3>
                      <p className="text-sm text-gray-500">
                        Reviewed on {new Date(selectedPastReview.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow">
                      <div className="prose prose-teal max-w-none">
                        <ReactMarkdown>{selectedPastReview.review}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {pastReviews.length > 0 ? (
                      <p>Select a review from the list to view it here</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>These reviews are AI-generated and should be considered as supplementary feedback only.</p>
          </div>
          <div className="flex space-x-3">
            {/* Show buttons only if we have content to act on */}
            {(showCurrentReview || showPastReviewContent) && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
