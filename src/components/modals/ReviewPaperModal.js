// FILE: src/components/modals/ReviewPaperModal.js
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

  // --- ADDED LOG ---
  console.log(`[ReviewPaperModal] Rendering with showModal: ${showModal}`);
  // --- END ADDED LOG ---


  // --- Effects and Handlers ---
  // Load past reviews effect
  useEffect(() => {
      if (showModal) {
        try {
          const savedReviews = localStorage.getItem('paperReviews');
          if (savedReviews) { setPastReviews(JSON.parse(savedReviews)); }
          else { setPastReviews([]); } // Ensure it's an empty array if nothing is stored
          setActiveTab('current'); // Default to current tab when opening
          setSelectedPastReview(null); // Clear selection when opening
        } catch (error) { console.error("Error loading past reviews:", error); setPastReviews([]); }
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
            const updatedReviews = [ { id: Date.now().toString(), paperName: reviewData.paperName, timestamp: reviewData.timestamp, review: reviewData.review, preview: reviewData.review.substring(0, 150) + '...' }, ...parsedReviews ].slice(0, 10);
            localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
            setPastReviews(updatedReviews); // Update local state as well
          }
        } catch (error) { console.error("Error saving review:", error); }
      }
  }, [reviewData]);

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
         setTimeout(() => setCopySuccess(false), 2000);
       } catch (error) { console.error("Error copying to clipboard:", error); alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error')); }
   };
  const handleFileUpload = async (event) => {
       const file = event.target.files?.[0];
       if (!file || typeof handleReviewPaper !== 'function') return;
       setNewReviewLoading(true); setActiveTab('current'); // Switch to current tab
       try { await handleReviewPaper({ target: { files: [file] } }); }
       catch (error) { console.error("Error during paper review:", error); alert("Error reviewing paper: " + (error.message || "Unknown error")); }
       finally { setNewReviewLoading(false); event.target.value = ''; }
   };
  const handleDeleteReview = (reviewId) => {
       if (window.confirm("Are you sure you want to delete this review?")) {
         try {
           const updatedReviews = pastReviews.filter(r => r.id !== reviewId);
           localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
           setPastReviews(updatedReviews);
           if (selectedPastReview && selectedPastReview.id === reviewId) { setSelectedPastReview(null); }
         } catch (error) { console.error("Error deleting review:", error); }
       }
   };

  // Conditional Render based on prop
  if (!showModal) {
    return null;
  }

  // Determine content based on active tab (keep as is)
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
             <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Close"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> </button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100 border-b border-gray-200 flex">
             {/* Current Review Tab Button */}
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'current' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('current')} > Current Review </button>
             {/* Past Reviews Tab Button */}
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'past' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('past')} > Past Reviews </button>
             {/* New Review Button (file upload) */}
             <div className="ml-auto flex items-center px-3">
                <label className={`flex items-center px-4 py-2 rounded ${ newReviewLoading ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700 cursor-pointer' } text-white font-medium text-sm`}>
                    {newReviewLoading ? ( <><svg className="animate-spin h-4 w-4 mr-2" /*...*/></svg> Reviewing... </>) : ( <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" /*...*/></svg> New Review </>)}
                   <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={newReviewLoading} />
                </label>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow h-full overflow-y-auto flex">
            {/* Current Review Content Area */}
            {activeTab === 'current' && (
                <div className="w-full flex flex-col">
                    {/* Paper Info */}
                    {reviewData && (
                       <div className="bg-gray-50 px-6 py-2 border-b border-gray-200">
                           <p className="text-gray-700"><span className="font-medium">Paper: </span>{reviewData.paperName || 'Untitled document'}</p>
                           <p className="text-gray-700 text-sm"><span className="font-medium">Review generated: </span>{new Date(reviewData.timestamp).toLocaleString()}</p>
                       </div>
                     )}
                     {/* Review Content */}
                     <div className="px-6 py-4 overflow-y-auto flex-grow">
                       {showCurrentReview ? (
                         <div className="prose prose-teal max-w-none"><ReactMarkdown>{reviewData.review}</ReactMarkdown></div>
                       ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                               <p className="text-lg mb-2">No current review</p>
                               <p className="text-base mb-6">Upload a paper using the 'New Review' button above.</p>
                           </div>
                       )}
                     </div>
                 </div>
             )}
             {/* Past Reviews Content Area */}
             {activeTab === 'past' && (
                <div className="w-full flex flex-col md:flex-row">
                    {/* Past Reviews List */}
                     <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto max-h-[calc(90vh-9rem)]">
                         <div className="p-4 bg-gray-50 border-b border-gray-200"> <h3 className="font-medium text-gray-700">Past Reviews</h3> <p className="text-xs text-gray-500">Select a review to view</p> </div>
                         {showEmptyPastReviews ? ( <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" /*...*/></svg><p>No past reviews found</p></div> ) :
                         ( <ul className="divide-y divide-gray-200"> {pastReviews.map(review => ( <li key={review.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${ selectedPastReview?.id === review.id ? 'bg-teal-50 border-l-4 border-teal-500' : '' }`} onClick={() => handleSelectPastReview(review)}> <div className="p-4"> <div className="flex justify-between items-start"> <h4 className="font-medium text-sm text-gray-800 mb-1 truncate flex-grow">{review.paperName}</h4> <button onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete review"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" /*...*/></svg></button> </div> <div className="text-xs text-gray-500 mb-2">{new Date(review.timestamp).toLocaleString()}</div> <p className="text-xs text-gray-600 line-clamp-2">{review.preview}</p> </div> </li> ))} </ul> )}
                     </div>
                     {/* Selected Past Review Content */}
                     <div className="w-full md:w-2/3 overflow-y-auto max-h-[calc(90vh-9rem)]">
                         {selectedPastReview ? ( <div className="h-full flex flex-col"> <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"> <h3 className="font-medium text-gray-800">{selectedPastReview.paperName}</h3> <p className="text-sm text-gray-500">Reviewed on {new Date(selectedPastReview.timestamp).toLocaleString()}</p> </div> <div className="p-6 overflow-y-auto flex-grow"> <div className="prose prose-teal max-w-none"><ReactMarkdown>{selectedPastReview.review}</ReactMarkdown></div> </div> </div> ) :
                         ( <div className="flex items-center justify-center h-full text-gray-500">{pastReviews.length > 0 ? (<p>Select a review from the list</p>) : null}</div> )}
                     </div>
                 </div>
             )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200">
            <div className="text-sm text-gray-600"><p>AI-generated reviews provide supplementary feedback.</p></div>
            <div className="flex space-x-3">
                 {(showCurrentReview || showPastReviewContent) && (
                    <>
                      <button onClick={handleCopyToClipboard} className={`flex items-center px-4 py-2 rounded ${ copySuccess ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300' }`} disabled={copySuccess}> {copySuccess ? ( <><svg /*...*/></svg> Copied! </>) : ( <><svg /*...*/></svg> Copy </>) } </button>
                      <button onClick={handleExport} disabled={exportLoading} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"> {exportLoading ? ( <><svg className="animate-spin h-5 w-5 mr-1" /*...*/></svg> Exporting... </>) : ( <><svg /*...*/></svg> Export </>) } </button>
                    </>
                  )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
