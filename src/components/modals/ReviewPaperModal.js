// FILE: src/components/modals/ReviewPaperModal.js
import React, { useState, useEffect, useRef } from 'react';
// import ReactMarkdown from 'react-markdown'; // Temporarily commented out
import { exportReview } from '../../services/paperReviewService';

const ReviewPaperModal = ({ showModal, onClose, reviewData, handleReviewPaper }) => {
  // --- Component State ---
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [pastReviews, setPastReviews] = useState([]);
  const [selectedPastReview, setSelectedPastReview] = useState(null);
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- Load/Save Effects ---
  useEffect(() => {
    // Load past reviews when modal becomes visible
    if (showModal) {
      console.log("[ReviewPaperModal] Effect (Load Past Reviews): Modal visible.");
      try {
        const savedReviews = localStorage.getItem('paperReviews');
        const parsed = savedReviews ? JSON.parse(savedReviews) : [];
        setPastReviews(parsed);
        console.log(`[ReviewPaperModal] Effect (Load Past Reviews): Loaded ${parsed.length} reviews.`);
      } catch (error) {
        console.error("[ReviewPaperModal] Effect (Load Past Reviews): Error loading:", error);
        setPastReviews([]);
      }
      // Set initial tab based on current data availability
      setActiveTab(reviewData?.review ? 'current' : 'past');
      setSelectedPastReview(null);
    }
  }, [showModal]); // Re-run only when modal visibility changes

  useEffect(() => {
    // Save new valid review data to local storage
    if (reviewData?.success && reviewData.review) {
        console.log("[ReviewPaperModal] Effect (Save Review): Valid reviewData detected.");
        try {
            const savedReviews = localStorage.getItem('paperReviews') || '[]';
            let parsedReviews = [];
            try { parsedReviews = JSON.parse(savedReviews); if (!Array.isArray(parsedReviews)) parsedReviews = []; }
            catch (parseError) { parsedReviews = []; console.warn("Corrupted past reviews, starting fresh.", parseError); }

            const existingIndex = parsedReviews.findIndex(r => r.timestamp === reviewData.timestamp && r.paperName === reviewData.paperName);

            if (existingIndex === -1) {
                const newReview = {
                    id: `${reviewData.timestamp}_${(reviewData.paperName || "Unnamed").replace(/\s+/g, '_')}`,
                    paperName: reviewData.paperName || "Unnamed Paper",
                    timestamp: reviewData.timestamp || new Date().toISOString(),
                    review: reviewData.review,
                    preview: (reviewData.review || '').substring(0, 150) + '...'
                };
                const updatedReviews = [newReview, ...parsedReviews].slice(0, 10);
                localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
                setPastReviews(updatedReviews); // Update state immediately
                console.log("[ReviewPaperModal] Effect (Save Review): New review saved and state updated.");
            } else {
                console.log("[ReviewPaperModal] Effect (Save Review): Review already exists, not saving duplicate.");
            }
        } catch (error) {
            console.error("[ReviewPaperModal] Effect (Save Review): Error saving review:", error);
        }
        // Ensure the current tab is active when new data arrives
        setActiveTab('current');
        setSelectedPastReview(null); // Clear past selection
    }
  }, [reviewData]); // Re-run specifically when reviewData changes


  // --- UI Handlers ---
  const handleSelectPastReview = (review) => { setSelectedPastReview(review); };
  const handleExport = async () => { /* ... (export logic remains the same) ... */
      setExportLoading(true);
      try {
        const reviewToExport = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
        const paperName = activeTab === 'past' && selectedPastReview ? selectedPastReview.paperName : reviewData?.paperName;
        if (!reviewToExport || reviewToExport.trim() === '') { alert('No review content found to export.'); return; }
        const success = exportReview(reviewToExport, paperName || 'paper-review');
        if (!success) { alert('There was an error initiating the review export.'); }
      } catch (error) { console.error("Error exporting review:", error); alert('Error exporting review: ' + (error.message || 'Unknown error')); }
      finally { setExportLoading(false); } };
  const handleCopyToClipboard = async () => { /* ... (copy logic remains the same) ... */
       try {
         const textToCopy = activeTab === 'past' && selectedPastReview ? selectedPastReview.review : reviewData?.review;
         if (!textToCopy || textToCopy.trim() === '') { alert('No review content found to copy.'); return; }
         await navigator.clipboard.writeText(textToCopy);
         setCopySuccess(true);
         setTimeout(() => setCopySuccess(false), 2000);
       } catch (error) { console.error("Error copying to clipboard:", error); alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error')); } };
  const handleFileUpload = async (event) => { /* ... (file upload logic remains the same) ... */
       const file = event.target.files?.[0];
       if (!file || typeof handleReviewPaper !== 'function') return;
       setNewReviewLoading(true);
       setActiveTab('current'); // Switch to current tab for the new review
       setSelectedPastReview(null); // Clear past selection
       try {
          await handleReviewPaper(event); // Pass the event object
       }
       catch (error) { console.error("Error during paper review:", error); alert("Error reviewing paper: " + (error.message || "Unknown error")); }
       finally { setNewReviewLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; } };
  const handleDeleteReview = (reviewId) => { /* ... (delete logic remains the same) ... */
       if (window.confirm("Are you sure you want to delete this review? This cannot be undone.")) {
         try {
           const updatedReviews = pastReviews.filter(r => r.id !== reviewId);
           localStorage.setItem('paperReviews', JSON.stringify(updatedReviews));
           setPastReviews(updatedReviews);
           if (selectedPastReview && selectedPastReview.id === reviewId) { setSelectedPastReview(null); }
           console.log(`[ReviewPaperModal] Deleted review ${reviewId}`);
         } catch (error) { console.error("Error deleting review:", error); alert("Failed to delete review."); }
       } };

  // --- Prepare variables for rendering ---
  const currentReviewContent = reviewData?.review || null;
  const pastReviewContent = selectedPastReview?.review || null;
  const displayContent = activeTab === 'current' ? currentReviewContent : pastReviewContent;
  const displayPaperName = activeTab === 'current' ? reviewData?.paperName : selectedPastReview?.paperName;
  const displayTimestamp = activeTab === 'current' ? reviewData?.timestamp : selectedPastReview?.timestamp;
  const hasDisplayableContent = !!displayContent;

  // --- DETAILED LOGGING BEFORE RENDER ---
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: showModal=${showModal}, activeTab=${activeTab}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: reviewData present=${!!reviewData}, reviewData.review present=${!!reviewData?.review}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: selectedPastReview present=${!!selectedPastReview}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: currentReviewContent length=${currentReviewContent?.length || 0}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: pastReviewContent length=${pastReviewContent?.length || 0}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: displayContent length=${displayContent?.length || 0}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK: hasDisplayableContent=${hasDisplayableContent}`);

  // --- Conditional Render ---
  if (!showModal) {
    return null;
  }

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
                    {newReviewLoading ? ( <>{/* Spinner */} Reviewing... </>) : ( <>{/* Icon */} New Review </>)}
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
                     <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">{/* Placeholder Icon */}<p>No past reviews found</p></div>
                   ) : (
                     <ul className="divide-y divide-gray-200">
                       {pastReviews.map(review => (
                         <li key={review.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${ selectedPastReview?.id === review.id ? 'bg-teal-50 border-l-4 border-teal-500' : '' }`} onClick={() => handleSelectPastReview(review)}>
                           <div className="p-4">
                             <div className="flex justify-between items-start">
                               <h4 className="font-medium text-sm text-gray-800 mb-1 truncate flex-grow pr-2">{review.paperName}</h4>
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteReview(review.id); }} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="Delete review">{/* Delete Icon */}</button>
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
                {/* --- REFINED DISPLAY LOGIC --- */}
                {hasDisplayableContent ? (
                    <div className="h-full flex flex-col">
                        {/* Paper Info Header */}
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex-shrink-0">
                           <h3 className="font-medium text-gray-800">{displayPaperName || (activeTab === 'current' ? 'Current Review' : 'Selected Review')}</h3>
                           <p className="text-sm text-gray-500">
                             {activeTab === 'past' ? 'Reviewed on' : 'Generated:'} {displayTimestamp ? new Date(displayTimestamp).toLocaleString() : 'N/A'}
                           </p>
                        </div>
                        {/* Review Content */}
                        <div className="p-6 overflow-y-auto flex-grow">
                             {/* --- FIX: Use <pre> tag for raw text display --- */}
                             <pre style={{ backgroundColor: 'lightyellow', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'sans-serif', fontSize: '14px' }}>
                                {displayContent}
                             </pre>
                             {/* --- Original ReactMarkdown (commented out) ---
                             <div className="prose prose-teal max-w-none">
                                <ReactMarkdown>{displayContent}</ReactMarkdown>
                             </div>
                             */}
                        </div>
                    </div>
                ) : (
                    // Placeholder when no content is available for the active tab
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-6">
                      {/* Placeholder Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg mb-2">
                        {activeTab === 'current' ? 'No current review available' : 'No review selected'}
                      </p>
                      <p className="text-base mb-6">
                        {activeTab === 'current' ? "Upload a paper using the 'New Review' button." : (pastReviews.length > 0 ? 'Select a review from the list on the left.' : 'Upload a paper to generate your first review.')}
                      </p>
                       {(activeTab === 'current' && reviewData && !reviewData.review) && (
                           <p className="text-xs text-red-500 mt-2">Debug: Review data exists but content is missing.</p>
                       )}
                    </div>
                )}
            </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200 flex-shrink-0">
            <div className="text-sm text-gray-600"><p>AI-generated reviews provide supplementary feedback.</p></div>
            <div className="flex space-x-3">
                 {hasDisplayableContent && (
                    <>
                      <button onClick={handleCopyToClipboard} className={`flex items-center px-4 py-2 rounded text-sm ${ copySuccess ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300' }`} disabled={copySuccess}> {/* Copy Button Content */} </button>
                      <button onClick={handleExport} disabled={exportLoading} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"> {/* Export Button Content */} </button>
                    </>
                  )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPaperModal;
