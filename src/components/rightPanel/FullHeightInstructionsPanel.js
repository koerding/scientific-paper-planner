import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Fixed numbered lists in feedback and improved debugging
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  improveInstructions, 
  loading,
  userInputs
}) => {
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    // Debug logging to help diagnose instruction content issues
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Instructions text:", currentSection?.instructions?.text);
      console.log("[PANEL] Feedback text:", currentSection?.instructions?.feedback);
    }
  }, [currentSection]);

  // Enhanced magic handler
  const handleMagicClick = () => {
    console.log("Magic button clicked!", new Date().toISOString());
    const now = Date.now();
    if (now - lastClickTime < 1500) { // Increase debounce slightly
      console.log("Prevented rapid double-click");
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions();
      } catch (error) {
        console.error("Error triggering magic:", error);
        // Optionally show an error message to the user here
      }
    } else {
      console.error("improveInstructions is not a function");
    }
  };

  /**
   * Returns fallback instructions based on section ID
   * @param {Object} section - The current section object
   * @returns {string} - Appropriate instructions for the section
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

* Specify your question clearly.

* Be clear about the logic. Are you asking how something is? Why it is the way it is? What gives rise to something? How it got their over time?

* Explain why the question matters to the field. How will science be different after your work?

* Ensure your question is answerable with your anticipated resources.`;
      
      case 'audience':
        return `${baseInstructions}

* Identify primary academic communities who would benefit most directly.

* For each community, note how your research might impact their work.

* Then, specify 3-5 individual researchers or research groups representing your audience.`;
      
      case 'hypothesis':
        return `${baseInstructions}

* Formulate at least two distinct, testable hypotheses.

* Ensure each hypothesis is specific and clearly stated.

* Your experiment must be able to differentiate between these hypotheses.

* Explain why distinguishing between these hypotheses matters to the field.

* Explain how data can help you decide between these hypotheses.`;

      case 'needsresearch':
        return `${baseInstructions}

* Clearly identify who needs this research (patients, clinicians, engineers, policymakers).

* Explain why they need it - what specific problem are you solving?

* Describe the current options/solutions and their limitations.

* Define concrete success criteria - how will you know if your solution works?

* Explain what specific improvement your solution offers over existing approaches.`;

      case 'exploratoryresearch':
        return `${baseInstructions}

* Describe the phenomena, dataset, or system you want to explore.

* List specific patterns, relationships, or discoveries your approach might reveal.

* Explain what makes this exploration novel or valuable to your field.

* Describe what tools or analytical approaches you'll use for discovery.

* Outline how you'll distinguish meaningful patterns from random variation.`;

      case 'relatedpapers':
        return `${baseInstructions}

* List papers that test similar hypotheses or address related questions.

* Explain how each paper relates to your specific research question.

* Identify what gap your research will fill that these papers don't address.

* Consider papers with contrasting perspectives or results to yours.`;

      case 'experiment':
        return `${baseInstructions}

* Define your key variables (independent, dependent, controlled).

* Describe your sample and justify your sample size.

* Outline your data collection procedures and control conditions.

* State predicted results for each hypothesis.

* Identify potential confounds and how you'll address them.`;

      case 'existingdata':
        return `${baseInstructions}

* Identify the specific dataset(s) and where/how you will access them.

* Explain what the data was originally collected for and by whom.

* Confirm you have legal rights to use the data for your purpose.

* Describe what you know about data provenance and quality assurance.

* Assess if the dataset contains the variables needed to answer your research question.`;

      case 'analysis':
        return `${baseInstructions}

* Define your data cleaning steps and exclusion criteria.

* Specify your primary statistical method(s) or model(s).

* Explain how your analysis will address your research question.

* Describe how you'll quantify uncertainty in your results.

* Outline how you'll handle any special cases (outliers, multiple comparisons, etc.).`;

      case 'process':
        return `${baseInstructions}

* List essential skills needed and identify which ones you lack.

* Name potential collaborators and their specific contributions.

* Describe your plan for data/code sharing and documentation.

* Outline a realistic timeline with key milestones and duration.

* Identify major potential obstacles and specific contingency plans.`;

      case 'abstract':
        return `${baseInstructions}

* Background: Briefly introduce the research area, identify the knowledge gap, and state its significance.

* Objective/Question: Clearly state the main research question, primary hypothesis, or goal.

* Methods: Concisely summarize your experimental design and key procedures.

* (Expected) Results: Briefly describe the main anticipated findings.

* Conclusion/Implications: State the main takeaway message and its potential impact.`;
      
      default:
        return `${baseInstructions}

* Be specific and clear in your writing.

* Consider how this section connects to your overall research goals.

* Ensure this section addresses the key requirements for your project.`;
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
      // Use fallback instructions
      console.log("[PANEL] Using fallback instructions for", currentSection?.id);
      return getFallbackInstructions(currentSection);
    }
    
    return rawText;
  };
  
  // Safely access feedback text - use null check and proper fallback
  const feedbackText = currentSection?.instructions?.feedback || '';

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Custom styles for markdown content to match left side fonts
  const customStyles = {
    fontSize: 'text-xl leading-relaxed', // Larger font to match left side
    content: 'prose-xl prose-blue max-w-none', // Increase prose size
    heading: 'text-2xl font-semibold my-4', // Larger headings
    divider: 'border-t border-blue-200 my-6', // Style for dividers (---)
    listItem: 'my-3', // Add more space between list items
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  return (
    <div
      className="bg-blue-50 border-l-4 border-blue-500 h-full overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10 // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-semibold text-blue-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              <button
                onClick={handleMagicClick}
                disabled={loading || !currentSection}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${ // Prevent button shrinking
                  loading || !currentSection
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

            {/* Render Instructions with improved styling - fallback handling is done in getInstructionsText() */}
            {instructionsText ? (
              <div className={`${customStyles.content} instructions-content mb-6`}>
                {/* Using custom component to render markdown with better styling */}
                <StyledMarkdown 
                  content={instructionsText} 
                  customStyles={customStyles}
                />
              </div>
            ) : (
              <p className="text-blue-600 text-xl mb-6">Instructions not available for this section.</p>
            )}

            {/* Render Feedback Section if it exists and is meaningful */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                {/* Use h3 or h4 for semantic structure */}
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className={`${customStyles.content} feedback-content`}>
                  <StyledMarkdown 
                    content={fixNumberedLists(feedbackText)} 
                    customStyles={customStyles}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Fixes numbered lists by ensuring they start at 1 and increment properly
 * @param {string} text - Markdown text to process
 * @returns {string} - Processed text with fixed numbering
 */
function fixNumberedLists(text) {
  if (!text) return text;
  
  // Split text into lines
  const lines = text.split('\n');
  
  // Find and group numbered list items
  let inNumberedList = false;
  let currentListItems = [];
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNumberedItem = /^\d+\.\s/.test(line.trim());
    
    if (isNumberedItem) {
      // Extract the content after the number
      const content = line.replace(/^\d+\.\s/, '');
      
      if (!inNumberedList) {
        // Starting a new list
        inNumberedList = true;
        currentListItems = [content];
      } else {
        // Continuing the current list
        currentListItems.push(content);
      }
    } else {
      // Not a numbered item
      if (inNumberedList) {
        // End of a list, add renumbered items to result
        for (let j = 0; j < currentListItems.length; j++) {
          result.push(`${j + 1}. ${currentListItems[j]}`);
        }
        currentListItems = [];
        inNumberedList = false;
      }
      
      // Add the current non-list line
      result.push(line);
    }
  }
  
  // Add any remaining list items
  if (inNumberedList && currentListItems.length > 0) {
    for (let j = 0; j < currentListItems.length; j++) {
      result.push(`${j + 1}. ${currentListItems[j]}`);
    }
  }
  
  return result.join('\n');
}

// Custom component to render markdown with enhanced styling
const StyledMarkdown = ({ content, customStyles }) => {
  // Process content to enhance list item styling
  const processedContent = content
    // Replace asterisks with bullet points for consistency
    .replace(/\n\* /g, "\n• ");
  
  return (
    <div className={`${customStyles.fontSize}`}>
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-5" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-bold my-4" {...props} />,
          
          // Style paragraphs and lists
          p: ({ node, ...props }) => <p className="my-4" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-4" {...props} />,
          li: ({ node, ...props }) => <li className={customStyles.listItem} {...props} />,
          
          // Style horizontal rules as dividers
          hr: ({ node, ...props }) => <hr className={customStyles.divider} {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default FullHeightInstructionsPanel;
