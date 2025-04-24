// FILE: src/components/modals/ReviewPaperModal.js
// FIXED: Added robust date checking for past review display

import React, { useState, useEffect } from 'react';
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

  // --- Effects and Handlers ---
  // Load past reviews effect
  useEffect(() => {
      if (showModal) {
        try {
          const savedReviews = localStorage.getItem('paperReviews');
          if (savedReviews) {
            const parsed = JSON.parse(savedReviews);
            setPastReviews(parsed);
          } else {
            setPastReviews([]);
          }
          // Reset to current tab and clear selection when modal opens
          setActiveTab('current');
          setSelectedPastReview(null);
        } catch (error) {
          console.error("[ReviewPaperModal] Error loading past reviews:", error);
          setPastReviews([]); // Set to empty on error
        }
      }
  }, [showModal]);

  // Save current review effect
  useEffect(() => {
      if (reviewData && reviewData.success && reviewData.review) {
        try {
          const savedReviews = localStorage.getItem('paperReviews') || '[]';
          const parsedReviews = JSON.parse(savedReviews);
          const existingIndex = parsedReviews.findIndex(r => r.timestamp === reviewData.timestamp);

          if (existingIndex === -1) {
            const newReview = {
              id: reviewData.timestamp, // Use timestamp as ID
              paperName: reviewData.paperName || "Untitled Review",
              preview: reviewData.review.substring(0, 100) + (reviewData.review.length > 100 ? '...' : ''),
              timestamp: reviewData.timestamp, // Full timestamp string
              review: reviewData.review // Full review text
            };
            const updatedReviews = [newReview, ...parsedReviews].slice(0, 10); // Limits to 10 most recent
            localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
            setPastReviews(updatedReviews); // Update state
          }
        } catch (error) {
          console.error("[ReviewPaperModal] Error saving review:", error);
        }
      }
  }, [reviewData]); // Re-run when new reviewData arrives

  const handleSelectPastReview = (review) => { setSelectedPastReview(review); };

  const handleExport = async () => {
      setExportLoading(true);
      try {
        const reviewToExport = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
        const paperName = activeTab === 'past' && selectedPastReview ? selectedPastReview.paperName : reviewData?.paperName;
        if (!reviewToExport) { alert('No review content found to export.'); return; }
        const success = exportReview(reviewToExport, paperName || 'paper-review');
        if (!success) { alert('There was an error exporting the review.'); }
      } catch (error) { console.error("Error exporting review:", error); alert('Error exporting review: ' + (error.message || 'Unknown error')); }
      finally { setExportLoading(false); }
  };

  const handleCopyToClipboard = async () => {
       try {
         const textToCopy = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
         if (!textToCopy) { alert('No review content found to copy.'); return; }
         await navigator.clipboard.writeText(textToCopy);
         setCopySuccess(true);
         setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
       } catch (error) { console.error("Error copying to clipboard:", error); alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error')); }
   };

  const handleFileUpload = async (event) => {
       const file = event.target.files?.[0];
       if (!file || typeof handleReviewPaper !== 'function') return;
       setNewReviewLoading(true); setActiveTab('current'); // Switch to current tab when reviewing
       try { await handleReviewPaper({ target: { files: [file] } }); }
       catch (error) { console.error("Error during paper review:", error); alert("Error reviewing paper: " + (error.message || "Unknown error")); }
       finally { setNewReviewLoading(false); event.target.value = ''; /* Reset file input */ }
   };

  const handleDeleteReview = (reviewId) => {
       // Add confirmation dialog
       if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
         try {
           const updatedReviews = pastReviews.filter(r => r.id !== reviewId);
           localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
           setPastReviews(updatedReviews);
           // Clear selection if the deleted review was selected
           if (selectedPastReview && selectedPastReview.id === reviewId) { setSelectedPastReview(null); }
         } catch (error) { console.error("Error deleting review:", error); alert("Failed to delete review."); }
       }
   };

  // --- Render Logic ---
  // Conditional Render based on prop
  if (!showModal) {
    return null;
  }

  // Determine content based on active tab
  const showCurrentReview = activeTab === 'current' && reviewData && reviewData.success && reviewData.review;
  const showPastReviewList = activeTab === 'past' && pastReviews && pastReviews.length > 0;
  const showPastReviewContent = activeTab === 'past' && selectedPastReview;
  const showEmptyPastReviews = activeTab === 'past' && (!pastReviews || pastReviews.length === 0);
  const showCurrentError = activeTab === 'current' && reviewData && !reviewData.success;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4"> {/* Added padding */}
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-auto max-h-[90vh] flex flex-col"> {/* Removed my-8, use padding on outer div */}
        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
             <h2 className="text-xl font-bold text-white">Scientific Paper Review</h2>
             <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Close">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100 border-b border-gray-200 flex flex-shrink-0">
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'current' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('current')} > Current Review </button>
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'past' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('past')} > Past Reviews </button>
             <div className="ml-auto flex items-center px-3">
                <label className={`flex items-center px-4 py-1.5 rounded ${ newReviewLoading ? 'bg-teal-400 cursor-wait opacity-70' : 'bg-teal-600 hover:bg-teal-700 cursor-pointer' } text-white font-medium text-xs transition-colors`}>
                    {newReviewLoading ? ( <><svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Reviewing... </>) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> New Review </>)}
                   <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={newReviewLoading} />
                </label>
             </div>
        </div>

        {/* Content Area - Use flex-grow and overflow */}
        <div className="flex-grow overflow-hidden flex">
            {/* Current Review Content Area */}
            {activeTab === 'current' && (
                <div className="w-full flex flex-col overflow-hidden">
                    {reviewData && (
                       <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex-shrink-0">
                           <p className="text-gray-700 text-sm truncate"><span className="font-medium">Paper: </span>{reviewData.paperName || 'Untitled document'}</p>
                           <p className="text-gray-500 text-xs"><span className="font-medium">Generated: </span>{ isNaN(new Date(reviewData.timestamp).getTime()) ? 'Invalid Date' : new Date(reviewData.timestamp).toLocaleString() }</p>
                       </div>
                     )}
                     <div className="px-6 py-4 overflow-y-auto flex-grow">
                       {showCurrentReview ? (
                         <div className="prose prose-sm prose-teal max-w-none">
                           <ReactMarkdown>{reviewData.review}</ReactMarkdown>
                         </div>
                       ) : showCurrentError ? (
                          <div className="flex flex-col items-center justify-center h-full text-red-600 text-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               <p className="text-lg mb-2 font-medium">Review Failed</p>
                               <p className="text-base mb-6">{reviewData.error || "An unknown error occurred."}</p>
                               <p className="text-sm text-gray-500">Try uploading the paper again using the 'New Review' button.</p>
                           </div>
                       ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                               <p className="text-lg mb-2">No current review</p>
                               <p className="text-base mb-6">Upload a paper using the 'New Review' button above.</p>
                           </div>
                       )}
                     </div>
                 </div>
             )}
             {/* Past Reviews Content Area */}
             {activeTab === 'past' && (
                <div className="w-full flex flex-col md:flex-row overflow-hidden"> {/* Use overflow-hidden here */}
                     {/* Past Reviews List */}
                     <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto flex-shrink-0"> {/* Allow this to scroll */}
                         <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10"> <h3 className="font-medium text-gray-700">Past Reviews</h3> <p className="text-xs text-gray-500">Select a review to view ({pastReviews.length} saved)</p> </div>
                         {showEmptyPastReviews ? ( <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg><p>No past reviews found</p></div> ) :
                         ( <ul className="divide-y divide-gray-200">
                            {pastReviews.map(review => (
                               <li key={review.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${ selectedPastReview?.id === review.id ? 'bg-teal-50 border-l-4 border-teal-500' : '' }`} onClick={() => handleSelectPastReview(review)}>
                                   <div className="p-4">
                                       <div className="flex justify-between items-start">
                                          <h4 className="font-medium text-sm text-gray-800 mb-1 truncate flex-grow mr-2">{review.paperName}</h4>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 -mr-1 -mt-1" title="Delete review">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                       </div>
                                       {/* --- DATE FIX APPLIED HERE --- */}
                                       <div className="text-xs text-gray-500 mb-2">
                                          {
                                            isNaN(new Date(review.timestamp).getTime())
                                              ? 'Invalid Date' // Explicitly show "Invalid Date" if parsing fails
                                              : new Date(review.timestamp).toLocaleString() // Format only if valid
                                          }
                                       </div>
                                       {/* --- END DATE FIX --- */}
                                       <p className="text-xs text-gray-600 line-clamp-2">{review.preview}</p>
                                   </div>
                               </li>
                             ))}
                           </ul>
                         )}
                     </div>
                     {/* Selected Past Review Content */}
                     <div className="w-full md:w-2/3 overflow-y-auto flex-grow"> {/* Allow this to scroll */}
                         {selectedPastReview ? ( <div className="h-full flex flex-col"> <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex-shrink-0 sticky top-0 z-10"> <h3 className="font-medium text-gray-800 truncate">{selectedPastReview.paperName}</h3> <p className="text-sm text-gray-500">Reviewed on { isNaN(new Date(selectedPastReview.timestamp).getTime()) ? 'Invalid Date' : new Date(selectedPastReview.timestamp).toLocaleString() }</p> </div> <div className="p-6 overflow-y-auto flex-grow"> <div className="prose prose-sm prose-teal max-w-none"><ReactMarkdown>{selectedPastReview.review}</ReactMarkdown></div> </div> </div> ) :
                         ( <div className="flex items-center justify-center h-full text-gray-500 p-6 text-center"><p>{pastReviews.length > 0 ? 'Select a review from the list to view its content.' : 'No past reviews available.'}</p></div> )}
                     </div>
                 </div>
             )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200 flex-shrink-0">
            <div className="text-xs text-gray-600">
              <p>AI reviews are supplemental; consult human experts for final decisions.</p>
            </div>
            <div className="flex space-x-3">
                 {(showCurrentReview || showPastReviewContent) && (
                    <>
                      <button onClick={handleCopyToClipboard} className={`flex items-center px-3 py-1.5 rounded text-xs font-medium transition-colors ${ copySuccess ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300' }`} disabled={copySuccess}>
                        {copySuccess ? ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Copied! </> ) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy </> ) }
                      </button>
                      <button onClick={handleExport} disabled={exportLoading} className="flex items-center px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 text-xs font-medium transition-colors">
                        {exportLoading ? ( <><svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Exporting... </> ) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export </> ) }
                      </button>
                    </>
                  )}
                  <button onClick={onClose} className="flex items-center px-3 py-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs font-medium transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Close
                  </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
