import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * UPDATED: Styling changed to match SectionCard look (bg-white, border, shadow, p-5)
 * UPDATED: Renamed "Magic" button to "Get AI Feedback"
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

  // Enhanced feedback handler (formerly magic)
  const handleFeedbackClick = () => { // Renamed handler
    console.log("Get AI Feedback button clicked!", new Date().toISOString());
    const now = Date.now();
    if (now - lastClickTime < 1500) { // Increase debounce slightly
      console.log("Prevented rapid double-click");
      return;
    }
    setLastClickTime(now);

    if (typeof improveInstructions === 'function') {
      try {
        improveInstructions(); // Assuming improveInstructions now triggers the feedback mechanism
      } catch (error) {
        console.error("Error triggering feedback:", error);
        // Optionally show an error message to the user here
      }
    } else {
      console.error("improveInstructions function (for feedback) is not a function");
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
        return `${baseInstructions}\n\n* Specify your question clearly.\n* Be clear about the logic. Are you asking how something is? Why it is the way it is? What gives rise to something? How it got their over time?\n* Explain why the question matters to the field. How will science be different after your work?\n* Ensure your question is answerable with your anticipated resources.`;
      case 'audience':
        return `${baseInstructions}\n\n* Identify primary academic communities who would benefit most directly.\n* For each community, note how your research might impact their work.\n* Then, specify 3-5 individual researchers or research groups representing your audience.`;
      case 'hypothesis':
        return `${baseInstructions}\n\n* Formulate at least two distinct, testable hypotheses.\n* Ensure each hypothesis is specific and clearly stated.\n* Your experiment must be able to differentiate between these hypotheses.\n* Explain why distinguishing between these hypotheses matters to the field.\n* Explain how data can help you decide between these hypotheses.`;
      case 'needsresearch':
        return `${baseInstructions}\n\n* Clearly identify who needs this research (patients, clinicians, engineers, policymakers).\n* Explain why they need it - what specific problem are you solving?\n* Describe the current options/solutions and their limitations.\n* Define concrete success criteria - how will you know if your solution works?\n* Explain what specific improvement your solution offers over existing approaches.`;
      case 'exploratoryresearch':
        return `${baseInstructions}\n\n* Describe the phenomena, dataset, or system you want to explore.\n* List specific patterns, relationships, or discoveries your approach might reveal.\n* Explain what makes this exploration novel or valuable to your field.\n* Describe what tools or analytical approaches you'll use for discovery.\n* Outline how you'll distinguish meaningful patterns from random variation.`;
      case 'relatedpapers':
        return `${baseInstructions}\n\n* List papers that test similar hypotheses or address related questions.\n* Explain how each paper relates to your specific research question.\n* Identify what gap your research will fill that these papers don't address.\n* Consider papers with contrasting perspectives or results to yours.`;
      case 'experiment':
        return `${baseInstructions}\n\n* Define your key variables (independent, dependent, controlled).\n* Describe your sample and justify your sample size.\n* Outline your data collection procedures and control conditions.\n* State predicted results for each hypothesis.\n* Identify potential confounds and how you'll address them.`;
      case 'existingdata':
        return `${baseInstructions}\n\n* Identify the specific dataset(s) and where/how you will access them.\n* Explain what the data was originally collected for and by whom.\n* Confirm you have legal rights to use the data for your purpose.\n* Describe what you know about data provenance and quality assurance.\n* Assess if the dataset contains the variables needed to answer your research question.`;
      case 'analysis':
        return `${baseInstructions}\n\n* Define your data cleaning steps and exclusion criteria.\n* Specify your primary statistical method(s) or model(s).\n* Explain how your analysis will address your research question.\n* Describe how you'll quantify uncertainty in your results.\n* Outline how you'll handle any special cases (outliers, multiple comparisons, etc.).`;
      case 'process':
        return `${baseInstructions}\n\n* List essential skills needed and identify which ones you lack.\n* Name potential collaborators and their specific contributions.\n* Describe your plan for data/code sharing and documentation.\n* Outline a realistic timeline with key milestones and duration.\n* Identify major potential obstacles and specific contingency plans.`;
      case 'abstract':
        return `${baseInstructions}\n\n* Background: Briefly introduce the research area, identify the knowledge gap, and state its significance.\n* Objective/Question: Clearly state the main research question, primary hypothesis, or goal.\n* Methods: Concisely summarize your experimental design and key procedures.\n* (Expected) Results: Briefly describe the main anticipated findings.\n* Conclusion/Implications: State the main takeaway message and its potential impact.`;
      default:
        return `${baseInstructions}\n\n* Be specific and clear in your writing.\n* Consider how this section connects to your overall research goals.\n* Ensure this section addresses the key requirements for your project.`;
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

  // Custom styles for markdown content
  const customStyles = {
    // Adjusted sizes to better fit p-5 padding
    fontSize: 'text-lg leading-relaxed', // Slightly smaller to fit padding
    content: 'prose-lg prose-blue max-w-none', // Adjusted prose size
    heading: 'text-xl font-semibold my-3', // Adjusted heading size/margin
    divider: 'border-t border-blue-200 my-4', // Adjusted divider margin
    listItem: 'my-2', // Adjusted list item margin
  };

  // Get the appropriate instructions text (with fallback if needed)
  const instructionsText = getInstructionsText();

  return (
    // Applied SectionCard-like styling: bg-white, rounded-lg, shadow-sm, border, p-5
    // Kept h-full and overflow-y-auto for layout
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto p-5">
      {/* Removed padding from this inner div as it's now on the parent */}
      <div className="relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg">Select a section to view instructions</p> {/* Adjusted text color/size */}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              {/* Adjusted heading size/color */}
              <h3 className="text-2xl font-semibold text-gray-800 flex-grow mr-4">
                {panelTitle}
              </h3>
              {/* Renamed button text and onClick handler */}
              <button
                onClick={handleFeedbackClick}
                disabled={loading || !currentSection}
                title="AI will review this section and provide feedback." // Added tooltip
                 // Adjusted button style slightly if needed
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all flex-shrink-0 ${
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
                    Getting Feedback... {/* Updated loading text */}
                  </span>
                ) : (
                  <span className="flex items-center">
                     {/* Changed Icon (optional) - using a lightbulb/review icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Get AI Feedback {/* Updated button text */}
                  </span>
                )}
              </button>
            </div>

            {/* Render Instructions */}
            {instructionsText ? (
              <div className={`${customStyles.content} instructions-content mb-6`}>
                <StyledMarkdown
                  content={instructionsText}
                  customStyles={customStyles}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-lg mb-6">Instructions not available for this section.</p> // Adjusted text color/size
            )}

            {/* Render Feedback Section */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-gray-300"> {/* Adjusted border color */}
                 {/* Adjusted heading size/color */}
                <h4 className="text-xl font-semibold text-gray-700 mb-3">Feedback</h4>
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
  const processedContent = content
    .replace(/\n\* /g, "\n• ");

  return (
    <div className={`${customStyles.fontSize}`}>
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />, // Adjusted size
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />, // Adjusted size
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-3" {...props} />, // Adjusted size

          // Style paragraphs and lists
          p: ({ node, ...props }) => <p className="my-3" {...props} />, // Adjusted margin
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3" {...props} />, // Adjusted margin
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3" {...props} />, // Adjusted margin
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
