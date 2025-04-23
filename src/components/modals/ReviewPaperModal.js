// FILE: src/components/modals/ReviewPaperModal.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Restoring ReactMarkdown
import { exportReview } from '../../services/paperReviewService';

const ReviewPaperModal = ({ showModal, onClose, reviewData, handleReviewPaper }) => {
  // --- State and Refs ---
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // --- FORCE CURRENT TAB FOR TESTING ---
  const [activeTab, setActiveTab] = useState('current'); // Keep it on current for now
  const [pastReviews, setPastReviews] = useState([]); // Still load for count, but won't display list
  const [selectedPastReview, setSelectedPastReview] = useState(null); // Keep state but won't be selectable
  const [newReviewLoading, setNewReviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- Load/Save Effects ---
  useEffect(() => {
    // Load past reviews when modal becomes visible (still needed for count)
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
      // --- FORCE CURRENT TAB ON LOAD ---
      setActiveTab('current'); // Always start/reset to current tab
      setSelectedPastReview(null); // Clear selection
    }
  }, [showModal]); // Rerun only when modal visibility changes

  useEffect(() => {
    // Save new valid review data
    if (reviewData?.success && reviewData.review) {
        console.log("[ReviewPaperModal] Effect (Save Review): Valid reviewData detected.");
        try {
            // ... (saving logic remains the same) ...
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
                 setPastReviews(updatedReviews);
                 console.log("[ReviewPaperModal] Effect (Save Review): New review saved and state updated.");
             } else {
                 console.log("[ReviewPaperModal] Effect (Save Review): Review already exists, not saving duplicate.");
             }
        } catch (error) { console.error("[ReviewPaperModal] Effect (Save Review): Error saving review:", error); }
        // --- FORCE CURRENT TAB on new data ---
        setActiveTab('current');
        setSelectedPastReview(null);
    }
  }, [reviewData]);


  // --- UI Handlers (remains the same) ---
  const handleSelectPastReview = (review) => { /* This won't be callable in UI */ };
  const handleExport = async () => { /* ... export logic ... */
        setExportLoading(true);
      try {
        // Export should still work based on reviewData if tab is 'current'
        const reviewToExport = reviewData?.review;
        const paperName = reviewData?.paperName;
        if (!reviewToExport || reviewToExport.trim() === '') { alert('No current review content found to export.'); return; }
        const success = exportReview(reviewToExport, paperName || 'paper-review');
        if (!success) { alert('There was an error initiating the review export.'); }
      } catch (error) { console.error("Error exporting review:", error); alert('Error exporting review: ' + (error.message || 'Unknown error')); }
      finally { setExportLoading(false); } };
  const handleCopyToClipboard = async () => { /* ... copy logic ... */
       try {
         // Copy should still work based on reviewData if tab is 'current'
         const textToCopy = reviewData?.review;
         if (!textToCopy || textToCopy.trim() === '') { alert('No current review content found to copy.'); return; }
         await navigator.clipboard.writeText(textToCopy);
         setCopySuccess(true);
         setTimeout(() => setCopySuccess(false), 2000);
       } catch (error) { console.error("Error copying to clipboard:", error); alert('Failed to copy to clipboard: ' + (error.message || 'Unknown error')); } };
  const handleFileUpload = async (event) => { /* ... file upload logic ... */
       const file = event.target.files?.[0];
       if (!file || typeof handleReviewPaper !== 'function') return;
       setNewReviewLoading(true);
       setActiveTab('current');
       setSelectedPastReview(null);
       try { await handleReviewPaper(event); }
       catch (error) { console.error("Error during paper review:", error); alert("Error reviewing paper: " + (error.message || "Unknown error")); }
       finally { setNewReviewLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; } };
  const handleDeleteReview = (reviewId) => { /* This won't be callable in UI */ };

  // --- Prepare variables for rendering ---
  // Simplified: only care about current review for display test
  const displayContent = reviewData?.review || null;
  const displayPaperName = reviewData?.paperName;
  const displayTimestamp = reviewData?.timestamp;
  const hasDisplayableContent = !!displayContent;

  // --- Logging ---
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK (Simplified Layout): showModal=${showModal}, activeTab=${activeTab}, hasDisplayableContent=${hasDisplayableContent}`);
  console.log(`[ReviewPaperModal] PRE-RENDER CHECK (Simplified Layout): reviewData present=${!!reviewData}, reviewData.review length=${reviewData?.review?.length || 0}`);

  // --- Conditional Render ---
  if (!showModal) {
    return null;
  }

  return (
    // Maintain overall modal structure
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-auto max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-teal-600 px-6 py-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
             <h2 className="text-xl font-bold text-white">Scientific Paper Review</h2>
             <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none" aria-label="Close">{/* Close Icon */}</button>
        </div>

        {/* Tabs Navigation - Simplified: Hide 'Past Reviews' tab for now */}
        <div className="bg-gray-100 border-b border-gray-200 flex flex-shrink-0">
             <button className={`px-6 py-3 font-medium text-sm focus:outline-none bg-white text-teal-700 border-t-2 border-teal-500`} > Current Review </button>
             {/* <button className={`px-6 py-3 font-medium text-sm focus:outline-none ${ activeTab === 'past' ? 'bg-white text-teal-700 border-t-2 border-teal-500' : 'text-gray-600 hover:text-gray-800' }`} onClick={() => setActiveTab('past')} > Past Reviews ({pastReviews.length}) </button> */}
             <div className="ml-auto flex items-center px-3">
                <label className={`flex items-center px-4 py-2 rounded ${ newReviewLoading ? 'bg-teal-400 cursor-wait' : 'bg-teal-600 hover:bg-teal-700 cursor-pointer' } text-white font-medium text-sm`}>
                    {newReviewLoading ? ( <>{/* Spinner */} Reviewing... </>) : ( <>{/* Icon */} New Review </>)}
                   <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileUpload} disabled={newReviewLoading} />
                </label>
             </div>
        </div>

        {/* Content Area - Simplified: No horizontal flex, just direct content display */}
        {/* --- FIX: Apply flex-grow and overflow-y directly to this container --- */}
        <div className="flex-grow overflow-y-auto p-6"> {/* Added padding directly here */}
            {hasDisplayableContent ? (
                // Display current review directly
                <>
                    {/* Paper Info Header */}
                    <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-t-md -m-6 mb-4"> {/* Adjust margin for padding */}
                       <h3 className="font-medium text-gray-800">{displayPaperName || 'Current Review'}</h3>
                       <p className="text-sm text-gray-500">
                         Generated: {displayTimestamp ? new Date(displayTimestamp).toLocaleString() : 'N/A'}
                       </p>
                    </div>
                    {/* Review Content */}
                    <div className="prose prose-teal max-w-none">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                    </div>
                </>
            ) : (
                // Placeholder when no content is available
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                  {/* Placeholder Icon & Text */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-lg mb-2">No current review available</p>
                  <p className="text-base mb-6">Upload a paper using the 'New Review' button.</p>
                   {(reviewData && !reviewData.review) && (<p className="text-xs text-red-500 mt-2">Debug: Review data exists but content is missing.</p>)}
                </div>
            )}
        </div>

        {/* Actions Footer (fixed height) */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-200 flex-shrink-0">
            <div className="text-sm text-gray-600"><p>AI-generated reviews provide supplementary feedback.</p></div>
            <div className="flex space-x-3">
                 {hasDisplayableContent && ( // Action buttons only if current review content exists
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
