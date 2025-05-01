return (
    <div className="flex flex-col items-center pt-10 pb-12 w-full h-full overflow-auto bg-fafafd"> {/* Starting at 40px (pt-10) with bg color */}
      {/* Main content panel with card design */}
      <div 
        className="w-full max-w-[740px] px-4 flex-grow overflow-auto"
        aria-live="polite" // For accessibility
      >
        {/* Card header with section info and toggle */}
        <div className="bg-white rounded-t-lg border border-gray-200 shadow-sm px-5 py-4 mb-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">Section {sectionNumber} · {sectionTitle}</p>
            </div>
            <SectionModePicker 
              currentMode={uiMode} 
              onModeChange={setUiMode}
              disabled={isAnyAiLoading}
            />
          </div>
        </div>
        
        {/* Card body */}
        <div className="bg-white rounded-b-lg border-l border-r border-b border-gray-200 shadow-sm hover:shadow-md transition-shadow px-5 py-4 mb-6">
          {uiMode === 'write' ? (
            /* WRITE MODE: Show the original left panel (content editor) */
            <div className="w-full">
              <LeftPanel
                activeSection={activeSection}
                handleSectionFocus={handleSectionFocus}
                handleApproachToggle={handleApproachToggle}
                handleDataMethodToggle={handleDataMethodToggle}
                handleMagic={handleMagic}
                proMode={proMode}
                onRequestFeedback={handleSwitchToGuide} // Pass the mode switch function
              />
            </div>
          ) : (
            /* GUIDE MODE: Show the original right panel (instructions/feedback) */
            <div className="w-full">
              <FullHeightInstructionsPanel
                activeSectionId={activeSection}
                improveInstructions={handleMagic}
                loading={isAnyAiLoading}
                onRequestWrite={handleSwitchToWrite} // Pass the mode switch function
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Ready for Feedback button removed */}
    </div>
  );
