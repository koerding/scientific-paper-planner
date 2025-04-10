import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel with tooltip debugging
 * Contains various debugging tools and visual markers to identify tooltip issues
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [debugTooltipVisible, setDebugTooltipVisible] = useState(false);
  const [markdownVisualDebug, setMarkdownVisualDebug] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Set to true to enable debugging features
  const [tooltipTestText, setTooltipTestText] = useState("Tooltip test text");
  const [debugMessages, setDebugMessages] = useState([]);

  // Add a debug message
  const addDebugMessage = (message) => {
    setDebugMessages(prev => [
      { id: Date.now(), text: message, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9) // Keep only the last 10 messages
    ]);
  };

  useEffect(() => {
    if (debugMode) {
      console.log("DEBUG: FullHeightInstructionsPanel mounted with currentSection:", currentSection);
      console.log("DEBUG: Current section data:", currentSection ? `ID: ${currentSection.id}, Title: ${currentSection.title}` : "None");
      
      // Check if there are any italics in the instructions
      const instructionsText = getInstructionsText();
      const hasItalics = instructionsText.includes('*') && !instructionsText.includes('**');
      console.log("DEBUG: Instructions contain italics:", hasItalics);
      
      // Count italicized passages
      const italicMatches = instructionsText.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || [];
      console.log(`DEBUG: Found ${italicMatches.length} italicized passages`);
      
      if (italicMatches.length > 0) {
        console.log("DEBUG: First italicized passage:", italicMatches[0]);
      }
      
      addDebugMessage(`Panel mounted. Found ${italicMatches.length} italics.`);
    }
  }, [currentSection, debugMode]);

  // Debug handler for logging tooltip test events
  const handleTooltipTest = (action) => {
    console.log(`DEBUG TOOLTIP: ${action}`);
    addDebugMessage(`Tooltip ${action}`);
  };

  // Enhanced magic handler - retained for external use
  const handleMagicClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1500) {
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        addDebugMessage("Magic button clicked");
        improveInstructions();
      } catch (error) {
        console.error("Error triggering magic:", error);
        addDebugMessage(`Magic error: ${error.message}`);
      }
    }
  };

  // Toggle markdown visual debugging
  const toggleMarkdownDebug = () => {
    setMarkdownVisualDebug(!markdownVisualDebug);
    addDebugMessage(`Markdown debug ${!markdownVisualDebug ? 'enabled' : 'disabled'}`);
  };

  /**
   * Returns fallback instructions based on section ID
   */
  function getFallbackInstructions(section) {
    if (!section || !section.id) return '';
    
    const sectionId = section.id;
    const sectionTitle = section.title || 'Section';
    
    // Common base instructions for all sections
    const baseInstructions = `A good ${sectionTitle} is critical to a strong research paper. Here are some key points to consider:`;
    
    // Section-specific instructions
    switch(sectionId) {
      case 'question':
        return `${baseInstructions}

* **Specify your question clearly.**
This helps readers immediately understand your research focus. *This is italicized text that should become a tooltip.*

* **Be clear about the logic.**
Are you asking how something is? Why it is the way it is? *Another tooltip test.*

* **Explain why the question matters to the field.**
How will science be different after your work? *Tooltips help keep the interface clean while preserving detailed explanations.*`;
      
      case 'audience':
        return `${baseInstructions}

* **Identify primary academic communities who would benefit most directly.**
Be specific about which subfields or research areas will find your work valuable. *The primary value of tooltips is reducing visual clutter without sacrificing content.*

* **For each community, note how your research might impact their work.**
Explain what gap you're filling or what problem you're solving for them. *This detailed explanation would normally take up a lot of space.*

* **Specify 3-5 individual researchers or research groups representing your audience.**
These should be people actively working in areas related to your question. *Adding tooltips improves the reading experience for users who want focused guidance.*`;
      
      // Additional cases omitted for brevity - would include all other sections
      
      default:
        return `${baseInstructions}

* **Be specific and clear in your writing.**
Vague statements reduce the impact of your work and may confuse readers. *This is a test tooltip for debugging purposes.*

* **Consider how this section connects to your overall research goals.**
Every part of your paper should contribute to answering your research question. *Tooltips should appear when hovering over the info icon.*

* **Ensure this section addresses the key requirements for your project.**
Different research approaches have different expectations for how information should be presented. *Test italicized text for tooltips.*

* **Think about how readers will use this information.**
What do they need to know to understand and evaluate your research properly? *Final tooltip test.*`;
    }
  }

  // Check if the text is a placeholder or too short to be useful
  const isPlaceholder = (text) => {
    if (!text || text.trim() === '') return true;
    if (text.length < 40) return true; // Too short to be real instructions
    
    const knownPlaceholders = [
      "Remove points",
      "addressed all key points",
      "remove points the user has already addressed",
      "congratulatory message"
    ];
    
    return knownPlaceholders.some(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    );
  };

  // Safely access instruction text - use fallback if it's a placeholder
  const getInstructionsText = () => {
    const rawText = currentSection?.instructions?.text || '';
    
    if (isPlaceholder(rawText)) {
      return getFallbackInstructions(currentSection);
    }
    
    return rawText;
  };

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // FIXED: Updated styles for consistent fonts with left panel
  const customStyles = {
    fontSize: 'text-base leading-relaxed', // Consistent with left panel
    content: 'prose-base prose-blue max-w-none',
    heading: 'text-lg font-semibold my-2',
    divider: 'border-t border-blue-200 my-3',
    listItem: 'my-1',
    strikethrough: 'line-through text-gray-500 opacity-70', // Style for strikethrough text
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  // FIXED: Add a unique class that won't conflict with left panel
  // The 'right-panel' class is unique to this component
  return (
    <div
      className="bg-blue-50 border-4 border-blue-500 rounded-lg overflow-y-auto right-panel"
      style={{
        position: 'fixed',
        right: '1rem',
        width: 'calc(50% - 1rem)',
        top: '150px',
        bottom: '50px',
        zIndex: 10,
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
      }}
    >
      <div className="px-4 py-3 h-full">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-base">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-blue-800 flex-grow mr-3">
                {panelTitle}
              </h3>
              {debugMode && (
                <button
                  onClick={toggleMarkdownDebug}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  {markdownVisualDebug ? 'Hide MD Debug' : 'Show MD Debug'}
                </button>
              )}
              <button
                onClick={handleMagicClick}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${ 
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow hover:shadow-md'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Magic in progress...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Magic
                  </span>
                )}
              </button>
            </div>

            {/* Debug Tooltip Test Area */}
            {debugMode && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: '#f0f0f0', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                position: 'relative'
              }}>
                <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>Debug Tooltip Test</h4>
                
                <p style={{ marginBottom: '8px' }}>
                  <span>Basic span with inline-style tooltip: </span>
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    Hover here
                    <span 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginLeft: '4px',
                        cursor: 'help',
                      }}
                      onMouseEnter={() => {
                        setDebugTooltipVisible(true);
                        handleTooltipTest('shown (inline)');
                      }}
                      onMouseLeave={() => {
                        setDebugTooltipVisible(false);
                        handleTooltipTest('hidden (inline)');
                      }}
                    >
                      ⓘ
                    </span>
                    
                    {debugTooltipVisible && (
                      <div 
                        style={{
                          position: 'absolute',
                          zIndex: 9999,
                          width: '280px',
                          padding: '0.75rem',
                          backgroundColor: '#1F2937',
                          color: 'white',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '8px',
                        }}
                      >
                        {tooltipTestText}
                        <div 
                          style={{
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1F2937',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        />
                      </div>
                    )}
                  </span>
                </p>

                {/* Direct TooltipText component test */}
                <p style={{ marginBottom: '8px' }}>
                  Component tooltip: <TooltipText text="(component test)" tooltipContent="This tooltip uses the TooltipText component directly" />
                </p>
                
                {/* Test form to modify tooltip content */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <input 
                    type="text" 
                    value={tooltipTestText} 
                    onChange={(e) => setTooltipTestText(e.target.value)}
                    style={{ 
                      padding: '4px 8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px',
                      marginRight: '8px',
                      flex: 1
                    }}
                    placeholder="Change tooltip text"
                  />
                  <button
                    onClick={() => setDebugTooltipVisible(!debugTooltipVisible)}
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: debugTooltipVisible ? '#EF4444' : '#10B981', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {debugTooltipVisible ? 'Hide' : 'Show'} Tooltip
                  </button>
                </div>
              </div>
            )}

            {/* Debug log display */}
            {debugMode && debugMessages.length > 0 && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: '#1E293B', 
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold' }}>Debug Log</span>
                  <button 
                    onClick={() => setDebugMessages([])}
                    style={{ color: '#94A3B8', padding: '0 4px' }}
                  >
                    Clear
                  </button>
                </div>
                {debugMessages.map(msg => (
                  <div key={msg.id} style={{ marginBottom: '3px', display: 'flex' }}>
                    <span style={{ color: '#94A3B8', marginRight: '8px' }}>[{msg.timestamp}]</span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Markdown Visual Debug */}
            {debugMode && markdownVisualDebug && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: '#ECFDF5', 
                border: '1px solid #10B981',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto'
              }}>
                <h4 style={{ marginBottom: '8px', color: '#065F46', fontWeight: 'bold' }}>Raw Markdown</h4>
                <div style={{ color: '#065F46' }}>
                  {instructionsText}
                </div>
                
                <h4 style={{ marginTop: '16px', marginBottom: '8px', color: '#065F46', fontWeight: 'bold' }}>Italics Found</h4>
                <div>
                  {(instructionsText.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || []).map((match, index) => (
                    <div key={index} style={{ marginBottom: '4px', backgroundColor: '#D1FAE5', padding: '2px 4px', borderRadius: '2px' }}>
                      {match}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved layout for instructions content */}
            <div className="h-full overflow-y-auto pb-6" style={{ maxHeight: 'calc(100% - 48px)' }}>
              {instructionsText ? (
                <div className={`${customStyles.content} instructions-content mb-4`}>
                  <DebugStyledMarkdown 
                    content={instructionsText} 
                    customStyles={customStyles}
                    debugMode={debugMode}
                    onDebugMessage={addDebugMessage}
                  />
                </div>
              ) : (
                <p className="text-blue-600 text-base mb-4">Instructions not available for this section.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Extracts main text and tooltip content from a markdown string
 * Tooltip content is any text within italics (*text*)
 * @param {string} text - The markdown text to process
 * @returns {Object} - Object with mainText and tooltipText properties
 */
function extractTooltipContent(text, onDebugMessage = null) {
  // If no text or no italics, return as is
  if (!text || !text.includes('*')) {
    if (onDebugMessage) onDebugMessage("No italic markers found in text");
    return { mainText: text, tooltipText: null };
  }
  
  // Pattern to match italicized text (text between single asterisks)
  // This regex looks for text between asterisks where the asterisks aren't part of a bold marker
  const italicPattern = /(?<!\*)\*([^*]+)\*(?!\*)/g;
  
  // Find all italicized segments
  const matches = [...text.matchAll(italicPattern)];
  
  if (matches.length === 0) {
    if (onDebugMessage) onDebugMessage("No matches found with regex pattern");
    return { mainText: text, tooltipText: null };
  }
  
  if (onDebugMessage) onDebugMessage(`Found ${matches.length} italic matches`);
  
  // Extract the tooltip content (all italicized segments)
  const tooltipText = matches.map(match => match[1].trim()).join(' ');
  
  // Create main text by removing the italicized portions
  let mainText = text;
  matches.forEach(match => {
    if (onDebugMessage) onDebugMessage(`Removing: ${match[0]}`);
    mainText = mainText.replace(match[0], '');
  });
  
  // Clean up any double spaces from removed segments
  mainText = mainText.replace(/\s+/g, ' ').trim();
  
  if (onDebugMessage) {
    onDebugMessage(`Main text (first 50 chars): ${mainText.substring(0, 50)}...`);
    onDebugMessage(`Tooltip text (first 50 chars): ${tooltipText.substring(0, 50)}...`);
  }
  
  return { mainText, tooltipText };
}

/**
 * Tooltip component with forced inline styles for maximum compatibility
 */
const TooltipText = ({ text, tooltipContent }) => {
  // Use ref instead of state for better performance and to avoid re-renders
  const tooltipRef = useRef(null);
  
  if (!tooltipContent) {
    return <span>{text}</span>;
  }
  
  const showTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.opacity = '1';
      tooltipRef.current.style.visibility = 'visible';
      console.log("DEBUG: Showing tooltip");
    }
  };
  
  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      tooltipRef.current.style.opacity = '0';
      tooltipRef.current.style.visibility = 'hidden';
      console.log("DEBUG: Hiding tooltip");
    }
  };
  
  // Using all inline styles for maximum compatibility
  return (
    <span style={{ 
      position: 'relative', 
      display: 'inline-block',
      margin: '0 2px'
    }}>
      <span>{text}</span>
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#EEF2FF',
          color: '#4F46E5',
          fontSize: '12px',
          fontWeight: 'bold',
          marginLeft: '4px',
          cursor: 'help',
          zIndex: 51,
          position: 'relative'
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        tabIndex="0"
        aria-label="Additional information"
      >
        ⓘ
      </span>
      
      <div 
        ref={tooltipRef}
        style={{
          position: 'absolute',
          zIndex: 9999,
          width: '280px',
          padding: '0.75rem',
          backgroundColor: '#1F2937',
          color: 'white',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          display: 'none',
          opacity: 0,
          visibility: 'hidden'
        }}
        role="tooltip"
      >
        {tooltipContent}
        <div 
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1F2937',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    </span>
  );
};

/**
 * Enhanced debugging version of StyledMarkdown
 */
const DebugStyledMarkdown = ({ content, customStyles, debugMode = false, onDebugMessage = null }) => {
  // Track paragraph processing for debugging
  const [processedParagraphs, setProcessedParagraphs] = useState(0);
  
  // Process content to enhance list item styling and extract tooltips
  const processedContent = content
    // Replace asterisks with bullet points for consistency
    .replace(/\n\* /g, "\n• ");
  
  // Log debug info on content change
  useEffect(() => {
    if (debugMode) {
      if (onDebugMessage) onDebugMessage(`Content length: ${content.length} chars`);
      console.log("DEBUG markdown processing:", {
        contentPreview: content.substring(0, 100) + "...",
        hasItalics: content.includes('*'),
        boldCount: (content.match(/\*\*.*?\*\*/g) || []).length,
        italicsCount: (content.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || []).length,
      });
    }
  }, [content, debugMode]);
  
  const handleParagraphProcess = (nodeText, result) => {
    if (debugMode) {
      setProcessedParagraphs(prev => prev + 1);
      if (onDebugMessage) {
        if (result.tooltipText) {
          onDebugMessage(`P${processedParagraphs+1}: Found tooltip (${result.tooltipText.length} chars)`);
        } else {
          onDebugMessage(`P${processedParagraphs+1}: No tooltip found`);
        }
      }
    }
  };
  
  return (
    <div className={`${customStyles.fontSize}`}>
      {/* Add debug panel at the top of the rendered markdown */}
      {debugMode && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '8px', 
          backgroundColor: '#DBEAFE', 
          border: '1px solid #93C5FD',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div><strong>Markdown Stats:</strong></div>
          <div>Total length: {content.length} characters</div>
          <div>Bold sections: {(content.match(/\*\*.*?\*\*/g) || []).length}</div>
          <div>Italic sections: {(content.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || []).length}</div>
          <div>Paragraphs processed: {processedParagraphs}</div>
        </div>
      )}
      
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-5" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-4" {...props} />,
          
          // Style paragraphs and handle tooltips with debugging
          p: ({ node, ...props }) => {
            // Get the raw text content for processing
            const text = node.children
              .map(child => {
                if (child.type === 'text') {
                  if (debugMode && onDebugMessage) {
                    onDebugMessage(`Processing text node: ${child.value.substring(0, 20)}...`);
                  }
                  return child.value || '';
                }
                return '';
              })
              .join('');
            
            // Process the paragraph text to extract tooltips
            const result = extractTooltipContent(text, onDebugMessage);
            handleParagraphProcess(text, result);
            
            // Add visual debugging if enabled
            if (debugMode) {
              const hasTooltip = !!result.tooltipText;
              
              return (
                <div className="my-4" style={{ position: 'relative' }}>
                  <p {...props} style={{ 
                    position: 'relative',
                    backgroundColor: hasTooltip ? 'rgba(209, 250, 229, 0.3)' : undefined,
                    padding: hasTooltip ? '4px' : undefined,
                    borderRadius: hasTooltip ? '4px' : undefined,
                    border: hasTooltip ? '1px dashed #10B981' : undefined
                  }}>
                    {hasTooltip ? (
                      <>
                        <TooltipText text={result.mainText} tooltipContent={result.tooltipText} />
                </p>
              );
            }
            
            // Default paragraph rendering if no tooltips
            return <p className="my-4" {...props} />;
          },
          
          // Style lists and other elements
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4" {...props} />,
          li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,
          
          // Style horizontal rules as dividers
          hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
          
          // Handle bold text normally
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          
          // Suppress rendering of italic text since we're handling it with tooltips
          em: ({ node, ...props }) => {
            if (debugMode && onDebugMessage) {
              onDebugMessage(`Found <em> tag that would normally be suppressed`);
            }
            // In debug mode, show italics with visual indicator
            return debugMode ? (
              <span style={{ fontStyle: 'italic', backgroundColor: '#FEF3C7', padding: '0 4px', borderRadius: '2px' }}>
                {props.children}
              </span>
            ) : null;
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* Debug footer */}
      {debugMode && (
        <div style={{ 
          marginTop: '15px', 
          padding: '8px', 
          backgroundColor: '#FEF3C7', 
          border: '1px solid #FCD34D',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div><strong>Rendering Complete</strong></div>
          <div>Tooltips should be visible when hovering over info icons (ⓘ)</div>
          <div>If tooltips aren't visible, check the browser console for errors</div>
        </div>
      )}
    </div>
  );
};

export default FullHeightInstructionsPanel; 
