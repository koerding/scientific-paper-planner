// In ModernChatInterface.js, update the chat window div with better positioning
<div 
  className={`fixed bottom-6 right-6 w-full sm:w-96 md:w-2/5 z-40 transition-transform duration-300 shadow-lg ${
    isMinimized ? 'translate-y-full' : 'translate-y-0'
  }`}
  style={{ 
    height: '50vh', 
    maxWidth: 'calc(100% - 3rem)',
    maxHeight: 'calc(100vh - 7rem)' // Add a max-height to prevent going off-screen
  }}
>
  {/* Chat header */}
  <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
    {/* ...header content... */}
  </div>
  
  {/* Chat messages area - add fallback min-height and max-height */}
  <div className="bg-gray-50 flex flex-col h-full" style={{ minHeight: '200px' }}>
    <div className="flex-grow overflow-y-auto p-4">
      {/* ...messages content... */}
    </div>
    
    {/* Chat input - ensure it's visible at the bottom */}
    <div className="p-3 border-t border-gray-200 bg-white">
      <div className="flex">
        <input
          /* ...input properties... */
        />
        <button
          /* ...button properties... */
        />
      </div>
    </div>
  </div>
</div>
