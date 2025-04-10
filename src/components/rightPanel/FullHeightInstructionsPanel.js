import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Enhanced full-height instructions panel with tooltip functionality
 * FIXED: Improved tooltip extraction and rendering
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [debugTooltipVisible, setDebugTooltipVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Set to true to enable debugging
  const [debugMessages, setDebugMessages] = useState([]);
  const [markdownVisualDebug, setMarkdownVisualDebug] = useState(false);

  // Add a debug message
  const addDebugMessage = (message) => {
    if (debugMode) {
      console.log("DEBUG:", message);
      setDebugMessages(prev => [
        { id: Date.now(), text: message, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9) // Keep only the last 10 messages
      ]);
    }
  };

  useEffect(() => {
    if (debugMode && currentSection) {
      addDebugMessage(`Section changed to: ${currentSection.id}`);
      
      // Check if there are any italics in the instructions
      const instructionsText = getInstructionsText();
      const italicMatches = instructionsText.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || [];
      addDebugMessage(`Found ${italicMatches.length} italicized passages`);
    }
  }, [currentSection, debugMode]);

  // Enhanced magic handler
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
    
    // Section-specific instructions with deliberate italic text for testing tooltips
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
Explain what gap you're filling or what problem you're solving for them.

* **Specify 3-5 individual researchers or research groups representing your audience.**
These should be people actively working in areas related to your question.`;
      
      // Default case for other sections
      default:
        return `${baseInstructions}

* **Be specific and clear in your writing.**
Vague statements reduce the impact of your work and may confuse readers. *This is a test tooltip for debugging purposes.*

* **Consider how this section connects to your overall research goals.**
Every part of your paper should contribute to answering your research question. *Tooltips should appear when hovering over the info icon.*

* **Ensure this section addresses the key requirements for your project.**
Different research approaches have different expectations for how information should be presented.

* **Think about how readers will use this information.**
What do they need to know to understand and evaluate your research properly?`;
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

  // Updated styles
  const customStyles = {
    fontSize: 'text-base leading-relaxed', 
    content: 'prose-base prose-blue max-w-none',
    heading: 'text-lg font-semibold my-2',
    divider: 'border-t border-blue-200 my-3',
    listItem: 'my-1',
    strikethrough: 'line-through text-gray-500 opacity-70'
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  // FIX: Pre-process markdown to ensure all italics can be identified correctly
  const preprocessMarkdown = (markdown) => {
    if (!markdown) return '';

    // Store all italicized text with a special marker
    let processedText = markdown;
    const italicsRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    const italicsMatches = [...markdown.matchAll(italicsRegex)];
    
    if (italicsMatches.length > 0) {
      addDebugMessage(`Pre-processing ${italicsMatches.length} italic segments`);
    }
    
    return processedText;
  };

  // Process instructions text to prepare for rendering
  const processedInstructionsText = preprocessMarkdown(instructionsText);

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
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
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
                borderRadius: '4px'
              }}>
                <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>Debug Tooltip Test</h4>
                
                {/* Direct test with inline styles */}
                <p style={{ marginBottom: '8px' }}>
                  <span>Inline-style tooltip: </span>
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
                        addDebugMessage('Tooltip shown (inline test)');
                      }}
                      onMouseLeave={() => {
                        setDebugTooltipVisible(false);
                        addDebugMessage('Tooltip hidden (inline test)');
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
                        This is a test tooltip using inline styles only
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

                {/* Component test */}
                <p style={{ marginBottom: '8px' }}>
                  Component tooltip: <InlineTooltip text="Hover over this info icon" tooltipContent="This tooltip uses the InlineTooltip component" />
                </p>
                
                {/* Test button */}
                <button
                  onClick={() => {
                    setDebugTooltipVisible(!debugTooltipVisible);
                    addDebugMessage(`Debug tooltip ${!debugTooltipVisible ? 'forced visible' : 'forced hidden'}`);
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    backgroundColor: debugTooltipVisible ? '#EF4444' : '#10B981', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {debugTooltipVisible ? 'Hide' : 'Show'} Debug Tooltip
                </button>
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

            {/* Markdown Stats */}
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
                <div>Total length: {instructionsText.length} characters</div>
                <div>Bold sections: {(instructionsText.match(/\*\*.*?\*\*/g) || []).length}</div>
                <div>Italic sections: {(instructionsText.match(/(?<!\*)\*([^*]+)\*(?!\*)/g) || []).length}</div>
              </div>
            )}

            {/* Instructions content */}
            <div className="h-full overflow-y-auto pb-6" style={{ maxHeight: 'calc(100% - 48px)' }}>
              {instructionsText ? (
                <div className={`${customStyles.content} instructions-content mb-4`}>
                  <EnhancedMarkdown 
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
 * FIXED: Improved extraction of tooltip content from markdown
 * Now correctly processes markdown text directly to find italics
 */
function extractTooltipContent(text, onDebugMessage = null) {
  // If no text, return as is
  if (!text) {
    if (onDebugMessage) onDebugMessage("No text provided to extract tooltip");
    return { mainText: text, tooltipText: null };
  }
  
  // Direct processing of text for italic content
  const italicPattern = /(?<!\*)\*([^*]+)\*(?!\*)/g;
  
  if (!text.includes('*')) {
    if (onDebugMessage) onDebugMessage("No asterisks found in text");
    return { mainText: text, tooltipText: null };
  }
  
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
    onDebugMessage(`Main text length: ${mainText.length} chars`);
    onDebugMessage(`Tooltip text length: ${tooltipText.length} chars`);
  }
  
  return { mainText, tooltipText };
}

/**
 * Tooltip component with pure inline styles for maximum compatibility
 */
const InlineTooltip = ({ text, tooltipContent }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!tooltipContent) {
    return <span>{text}</span>;
  }
  
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
          position: 'relative',
          zIndex: 51
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Additional information"
      >
        ⓘ
      </span>
      
      {showTooltip && (
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
            display: 'block',
            visibility: 'visible',
            opacity: 1
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
      )}
    </span>
  );
};

/**
 * FIXED: Enhanced markdown component that properly processes italics
 * This version directly processes the full markdown content before rendering
 */
const EnhancedMarkdown = ({ content, customStyles, debugMode = false, onDebugMessage = null }) => {
  // First, directly process the full content to find and extract all italics
  const [processedSegments, setProcessedSegments] = useState([]);
  
  // Direct pre-processing of all content
  useEffect(() => {
    if (!content) return;
    
    if (debugMode) {
      if (onDebugMessage) onDebugMessage(`Processing markdown content: ${content.length} chars`);
    }
    
    // Split content by paragraphs while preserving empty lines
    const paragraphs = content.split(/(\n\n+)/);
    const segments = [];
    
    // Process each paragraph
    paragraphs.forEach((paragraph, index) => {
      // Skip empty paragraphs or just whitespace/newlines
      if (!paragraph.trim()) {
        segments.push({ type: 'raw', content: paragraph });
        return;
      }
      
      // Check if paragraph contains italics
      if (paragraph.includes('*') && !paragraph.startsWith('**') && !paragraph.includes('**')) {
        const italicResult = extractTooltipContent(paragraph, onDebugMessage);
        if (italicResult.tooltipText) {
          segments.push({ 
            type: 'tooltip', 
            mainText: italicResult.mainText, 
            tooltipText: italicResult.tooltipText,
            original: paragraph
          });
          if (debugMode && onDebugMessage) {
            onDebugMessage(`Processed segment ${segments.length}: Tooltip extracted`);
          }
          return;
        }
      }
      
      // Default: keep as is
      segments.push({ type: 'raw', content: paragraph });
    });
    
    setProcessedSegments(segments);
    
    if (debugMode && onDebugMessage) {
      onDebugMessage(`Processed ${segments.length} content segments`);
      const tooltipCount = segments.filter(s => s.type === 'tooltip').length;
      onDebugMessage(`Found ${tooltipCount} segments with tooltips`);
    }
  }, [content, debugMode, onDebugMessage]);
  
  // Process content for consistent bullet points
  const processedContent = content ? content.replace(/\n\* /g, "\n• ") : '';
  
  return (
    <div className={`${customStyles.fontSize}`}>
      {/* Use the processed segments directly */}
      {processedSegments.map((segment, index) => {
        if (segment.type === 'tooltip') {
          return (
            <div key={index} className="my-4">
              {debugMode && (
                <div style={{ 
                  backgroundColor: 'rgba(209, 250, 229, 0.3)',
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px dashed #10B981',
                  position: 'relative'
                }}>
                  <InlineTooltip text={segment.mainText} tooltipContent={segment.tooltipText} />
                  <span style={{ 
                    position: 'absolute', 
                    right: '4px', 
                    top: '4px', 
                    fontSize: '10px',
                    color: '#059669',
                    backgroundColor: '#D1FAE5',
                    padding: '1px 4px',
                    borderRadius: '4px'
                  }}>
                    tooltip
                  </span>
                </div>
              )}
              
              {!debugMode && (
                <InlineTooltip text={segment.mainText} tooltipContent={segment.tooltipText} />
              )}
            </div>
          );
        }
        
        // For raw content, use ReactMarkdown
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-5" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-4" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-4" {...props} />,
              p: ({ node, ...props }) => <p className="my-4" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4" {...props} />,
              li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,
              hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              em: ({ node, ...props }) => {
                // In debug mode, show italics
                return debugMode ? (
                  <span style={{ fontStyle: 'italic', backgroundColor: '#FEF3C7', padding: '0 4px', borderRadius: '2px' }}>
                    {props.children}
                  </span>
                ) : null; // Don't render in normal mode
              },
            }}
          >
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
};

export default FullHeightInstructionsPanel;
