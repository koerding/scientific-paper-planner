import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Enhanced full-height instructions panel
 * FIXED: Improved rendering of structured content with proper styling
 */
const FullHeightInstructionsPanel = ({ 
  currentSection, 
  userInputs
}) => {
  useEffect(() => {
    // Debug logging to help diagnose instruction content issues
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Instructions text:", currentSection?.instructions?.text);
      console.log("[PANEL] Feedback text:", currentSection?.instructions?.feedback);
    }
  }, [currentSection]);

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

  // Extract bullet points from raw text
  const extractBulletPoints = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const bulletPoints = [];
    let currentPoint = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip dividers and empty lines
      if (trimmedLine === '---' || trimmedLine === '') {
        return;
      }
      
      // Check if it's a bullet point
      if (trimmedLine.startsWith('*')) {
        if (currentPoint) {
          bulletPoints.push(currentPoint);
        }
        
        // Create a new bullet point
        currentPoint = {
          title: trimmedLine.substring(1).trim(),
          content: ''
        };
      } else if (currentPoint) {
        // Add this line to the current point's content
        currentPoint.content += (currentPoint.content ? '\n' : '') + line;
      }
    });
    
    // Add the last point if present
    if (currentPoint) {
      bulletPoints.push(currentPoint);
    }
    
    return bulletPoints;
  };

  // Get instruction text and extract bullet points
  const instructionsText = getInstructionsText();
  const instructionParts = instructionsText.split('---');
  const introText = instructionParts[0]?.trim();
  
  // Get bullet points from the rest of the text (after the divider)
  const bulletPointsText = instructionParts.slice(1).join('\n').trim();
  const bulletPoints = extractBulletPoints(bulletPointsText);

  return (
    <div
      className="bg-blue-50 h-full overflow-y-auto section-instruction-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10, // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-semibold text-blue-800 mb-4">
              {panelTitle}
            </h3>

            {/* Instructions panel */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              {/* Introduction section */}
              {introText && (
                <div className="text-xl mb-5 leading-relaxed">{introText}</div>
              )}
              
              {/* Bullet points */}
              {bulletPoints.map((point, index) => (
                <div key={index} className="mb-5">
                  <div className="text-2xl font-bold text-blue-800 mb-2">
                    <strong>{point.title}</strong>
                  </div>
                  <div className="text-xl leading-relaxed">
                    {point.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback section if it exists */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className="border-4 border-blue-500 rounded-lg bg-white p-5">
                  <div className="text-xl leading-relaxed">
                    <ReactMarkdown>
                      {fixNumberedLists(feedbackText)}
                    </ReactMarkdown>
                  </div>
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

export default FullHeightInstructionsPanel;
