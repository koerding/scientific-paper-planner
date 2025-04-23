// FILE: src/components/modals/ReviewPaperModal.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { exportReview } from '../../services/paperReviewService'; // Assuming path is correct

const ReviewPaperModal = ({ showModal, onClose, reviewData, handleReviewPaper }) => {
  // --- Component State ---
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // Default to current
  const [pastReviews, setPastReviews] = useState([]);
  const [selectedPastReview, setSelectedPastReview] = useState(null);
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  const fileInputRef = useRef(null); // Ref for file input

  // --- Effects and Handlers ---
  // Load past reviews effect
  useEffect(() => {
    if (showModal) {
      console.log("[ReviewPaperModal] Modal visible. Loading/refreshing past reviews.");
      try {
        const savedReviews = localStorage.getItem('paperReviews');
        const parsed = savedReviews ? JSON.parse(savedReviews) : [];
        console.log(`[ReviewPaperModal] Loaded ${parsed.length} past reviews from localStorage.`);
        setPastReviews(parsed);
        // Reset tab/selection only if necessary or based on logic
        // setActiveTab('current'); // Reconsider resetting tab every time
        // setSelectedPastReview(null); // Reconsider clearing selection
      } catch (error) {
        console.error("[ReviewPaperModal] Error loading past reviews:", error);
        setPastReviews([]);
      }
      // Set active tab based on whether there's current review data
      setActiveTab(reviewData?.review ? 'current' : 'past');
      setSelectedPastReview(null); // Clear selection when modal opens/data changes

    } else {
       console.log("[ReviewPaperModal] Modal hidden.");
    }
  }, [showModal, reviewData]); // Depend on showModal and reviewData

  // Save current review effect (only run when reviewData genuinely changes and is valid)
  useEffect(() => {
    if (reviewData && reviewData.success && reviewData.review) {
       console.log("[ReviewPaperModal] Valid reviewData detected, attempting to save.");
      try {
        const savedReviews = localStorage.getItem('paperReviews') || '[]';
        let parsedReviews = [];
        try {
            parsedReviews = JSON.parse(savedReviews);
            if (!Array.isArray(parsedReviews)) parsedReviews = []; // Ensure it's an array
        } catch (parseError) {
            console.warn("Could not parse existing reviews, starting fresh.", parseError);
            parsedReviews = [];
        }

        // Check if this review (based on timestamp and paper name) already exists
        const existingIndex = parsedReviews.findIndex(
          r => r.timestamp === reviewData.timestamp && r.paperName === reviewData.paperName
        );

        if (existingIndex === -1) {
          console.log("[ReviewPaperModal] Adding new review to saved reviews.");
          const newReview = {
            id: reviewData.timestamp + "_" + (reviewData.paperName || "Unnamed").replace(/\s+/g, '_'), // More unique ID
            paperName: reviewData.paperName || "Unnamed Paper",
            timestamp: reviewData.timestamp || new Date().toISOString(), // Ensure timestamp
            review: reviewData.review,
            preview: (reviewData.review || '').substring(0, 150) + '...' // Safe substring
          };

          // Add to beginning and limit
          const updatedReviews = [newReview, ...parsedReviews].slice(0, 10);
          localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
          setPastReviews(updatedReviews); // Update local state
          console.log("[ReviewPaperModal] Review saved successfully.");
        } else {
          console.log("[ReviewPaperModal] Review already exists in localStorage, not saving duplicate.");
        }
      } catch (error) {
        console.error("[ReviewPaperModal] Error saving review to localStorage:", error);
      }
    } else {
       console.log("[ReviewPaperModal] reviewData changed but is not valid for saving:", reviewData);
    }
  }, [reviewData]); // Rerun only when reviewData changes

  // --- UI Handlers ---
  const handleSelectPastReview = (review) => { setSelectedPastReview(review); };

  const handleExport = async () => {
      setExportLoading(true);
      try {
        const reviewToExport = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
        const paperName = activeTab === 'past' && selectedPastReview ? selectedPastReview.paperName : reviewData?.paperName;
        if (!reviewToExport || reviewToExport.trim() === '') { alert('No review content found to export.'); return; } // Added trim check
        const success = exportReview(reviewToExport, paperName || 'paper-review');
        if (!success) { alert('There was an error initiating the review export.'); }
      } catch (error) { console.error("Error exporting review:", error); alert('Error exporting review: ' + (error.message || 'Unknown error')); }
      finally { setExportLoading(false); }
  };

  const handleCopyToClipboard = async () => {
       try {
         const textToCopy = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
         if (!textToCopy || textToCopy.trim() === '') { alert('No review content found to copy.'); return; } // Added trim check
         await navigator.clipboard.writeText(textToCopy);
         setCopySuccess(true);
         setTimeout(() => setCopySuccess(false), 2000);
       } catch (error) { console.error("Error copying to clipboard:", error); alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error')); }
   };

  const handleFileUpload = async (event) => {
       const file = event.target.files?.[0];
       if (!file || typeof handleReviewPaper !== 'function') return;
       setNewReviewLoading(true);
       setActiveTab('current'); // Switch to current tab for the new review
       setSelectedPastReview(null); // Clear past selection
       try {
          // Call the parent's handler, which should update reviewData via context
          await handleReviewPaper(event); // Pass the event object
       }
       catch (error) { console.error("Error during paper review:", error); alert("Error reviewing paper: " + (error.message || "Unknown error")); }
       finally { setNewReviewLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; } // Reset file input
   };

  const handleDeleteReview = (reviewId) => {
       if (window.confirm("Are you sure you want to delete this review? This cannot be undone.")) {
         try {
           const updatedReviews = pastReviews.filter(r => r.id !== reviewId);
           localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
           setPastReviews(updatedReviews);
           // If the deleted review was selected, clear the selection
           if (selectedPastReview && selectedPastReview.id === reviewId) { setSelectedPastReview(null); }
           console.log(`[ReviewPaperModal] Deleted review ${reviewId}`);
         } catch (error) { console.error("Error deleting review:", error); alert("Failed to delete review."); }
       }
   };

  // --- Conditional Render ---
  if (!showModal) {
    return null;
  }

  // Determine content display more directly
  const currentReviewContent = reviewData?.review || null;
  const pastReviewContent = selectedPastReview?.review || null;
  const displayContent = activeTab === 'past' ? pastReviewContent : currentReviewContent;
  const displayPaperName = activeTab === 'past' ? selectedPastReview?.paperName : reviewData?.paperName;
  const displayTimestamp = activeTab === 'past' ? selectedPastReview?.timestamp : reviewData?.timestamp;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
             <h2 className="text-xl font-bold text-white">Scientific Paper Review</h2>
             <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Close"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> </button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100 border-b border-gray-200 flex flex-shrink-0">
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'current' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => { setActiveTab('current'); setSelectedPastReview(null); }} > Current Review </button>
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'past' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('past')} > Past Reviews ({pastReviews.length}) </button>
             <div className="ml-auto flex items-center px-3">
                <label className={`flex items-center px-4 py-2 rounded ${ newReviewLoading ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700 cursor-pointer' } text-white font-medium text-sm`}>
                    {newReviewLoading ? ( <><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Reviewing... </>) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> New Review </>)}
                   <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={newReviewLoading} />
                </label>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden flex">
            {/* Past Reviews List (only shown when 'past' tab is active) */}
            {activeTab === 'past' && (
              <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto flex-shrink-0">
                 <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10"> <h3 className="font-medium text-gray-700">Past Reviews</h3> <p className="text-xs text-gray-500">Select a review to view</p> </div>
                 {pastReviews.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p>No past reviews found</p></div>
                   ) : (
                     <ul className="divide-y divide-gray-200">
                       {pastReviews.map(review => (
                         <li key={review.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${ selectedPastReview?.id === review.id ? 'bg-teal-50 border-l-4 border-teal-500' : '' }`} onClick={() => handleSelectPastReview(review)}>
                           <div className="p-4">
                             <div className="flex justify-between items-start">
                               <h4 className="font-medium text-sm text-gray-800 mb-1 truncate flex-grow pr-2">{review.paperName}</h4>
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="Delete review"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                             </div>
                             <div className="text-xs text-gray-500 mb-2">{new Date(review.timestamp).toLocaleString()}</div>
                             <p className="text-xs text-gray-600 line-clamp-2">{review.preview}</p>
                           </div>
                         </li>
                       ))}
                     </ul>
                   )}
              </div>
            )}

            {/* Main Content Display Area (Current or Selected Past) */}
            <div className={`overflow-y-auto flex-grow ${activeTab === 'past' ? 'w-full md:w-2/3' : 'w-full'}`}>
              {displayContent ? (
                <div className="h-full flex flex-col">
                   {/* Paper Info Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex-shrink-0">
                       <h3 className="font-medium text-gray-800">{displayPaperName || 'Review Details'}</h3>
                       <p className="text-sm text-gray-500">
                         {activeTab === 'past' ? 'Reviewed on' : 'Generated:'} {displayTimestamp ? new Date(displayTimestamp).toLocaleString() : 'N/A'}
                       </p>
                    </div>
                    {/* Review Content */}
                    <div className="p-6 overflow-y-auto flex-grow">
                         <div className="prose prose-teal max-w-none"><ReactMarkdown>{displayContent}</ReactMarkdown></div>
                    </div>
                </div>
              ) : (
                // Placeholder when no content is available for the active tab
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg mb-2">
                    {activeTab === 'current' ? 'No current review available' : 'No review selected'}
                  </p>
                  <p className="text-base mb-6">
                    {activeTab === 'current' ? "Upload a paper using the 'New Review' button." : 'Select a review from the list on the left.'}
                  </p>
                </div>
              )}
            </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200 flex-shrink-0">
            <div className="text-sm text-gray-600"><p>AI-generated reviews provide supplementary feedback.</p></div>
            <div className="flex space-x-3">
                 {/* Only show actions if there is content to act upon */}
                 {displayContent && (
                    <>
                      <button onClick={handleCopyToClipboard} className={`flex items-center px-4 py-2 rounded text-sm ${ copySuccess ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300' }`} disabled={copySuccess}> {copySuccess ? ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied! </>) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy </>) } </button>
                      <button onClick={handleExport} disabled={exportLoading} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"> {exportLoading ? ( <><svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Exporting... </>) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export </>) } </button>
                    </>
                  )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
