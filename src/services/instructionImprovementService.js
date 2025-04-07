// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Now provides feedback in Strengths, Weaknesses, Comments format
 */
import { callOpenAI } from './openaiService';
import { isResearchApproachSection, buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

/**
 * Improves instructions for multiple sections, separating instructions and feedback.
 * Uses OpenAI's native JSON mode for reliable parsing.
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @returns {Promise<Object>} - Result with success flag and improved instructions/feedback
 */
export const improveBatchInstructions = async (
  currentSections,
  userInputs,
  sectionContent
) => {
  try {
    // Identify sections with meaningful user content
    const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
      const content = userInputs[sectionId];
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      const placeholder = originalSectionDef?.placeholder || '';
      
      return typeof content === 'string' && content.trim() !== '' && content !== placeholder;
    });

    if (sectionsWithProgress.length === 0) {
      console.log("[Instruction Improvement] No sections found with user progress.");
      return { success: false, message: "No sections with progress to improve" };
    }

    // Prepare data for analysis
    const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSectionDef || !originalSectionDef.instructions?.text) {
        console.warn(`Original section definition or instructions missing for ID ${sectionId}. Skipping.`);
        return null;
      }
      
      const userContent = userInputs[sectionId] || '';
      const needsResearchContext = isResearchApproachSection(sectionId, originalSectionDef);

      return {
        id: sectionId,
        title: originalSectionDef.title,
        originalInstructionsText: originalSectionDef.instructions.text,
        userContent,
        needsResearchContext
      };
    }).filter(data => data !== null);

    if (sectionsDataForPrompt.length === 0) {
      console.log("[Instruction Improvement] No valid sections found with user progress after filtering.");
      return { success: false, message: "No valid sections with progress to improve" };
    }

    // Check if any section needs research context
    const needsOverallResearchContext = sectionsDataForPrompt.some(section => section.needsResearchContext);

    // Build enhanced system prompt that explicitly requests edits and congratulations
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: needsOverallResearchContext,
      approachGuidance: ''
    }) + `

    IMPORTANT ADDITIONAL INSTRUCTIONS:
    
    1. For each section, YOU MUST ACTUALLY MODIFY the instructions based on the user's progress:
       - Remove bullet points they've already addressed
       - Add congratulatory language when appropriate
       - Add new, specific suggestions based on their work
    
    2. For complete or nearly complete sections, transform the instructions into congratulatory messages like:
       "Great job on your [section]! You've clearly [specific achievements]. Consider these refinements: [1-2 specific suggestions]"
    
    3. Always provide structured feedback in this EXACT format:
       "**Strengths:** [list specific strengths]
       **Weaknesses:** [list areas that need improvement]
       **Comments:** [constructive suggestions]"
    
    4. Never return the original instructions unchanged - always edit them.
    
    Remember to return your response as a valid JSON array containing objects with id, editedInstructions, feedback, and completionStatus fields.
    `;

    const taskPrompt = buildTaskPrompt('instructionImprovement', {
      sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    // Call OpenAI with JSON mode - we expect an array directly now
    const response = await callOpenAI(
      taskPrompt,
      "improve_instructions_batch",
      userInputs,
      currentSections,
      { 
        temperature: 0.7, // Higher temperature for more creative edits
        max_tokens: 3000  // More tokens for better edits
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );
    
    console.log("Response from OpenAI:", response);
    
    // If response is empty or not an array, use fallback
    if (!Array.isArray(response) || response.length === 0) {
      console.warn("Invalid or empty response format from OpenAI, using fallback");
      
      // Create enhanced fallback responses with actual edits and the new feedback format
      const fallbackData = sectionsDataForPrompt.map(section => {
        const originalInstructions = section.originalInstructionsText;
        
        // Create a congratulatory variant of the instructions
        let modifiedInstructions = `Great work on your ${section.title.toLowerCase()}! You've made excellent progress.\n\n`;
        
        // Add a few bullet points from the original, focusing on refinement
        modifiedInstructions += `Consider these refinements to strengthen your work:\n\n`;
        
        // Extract bullet points from original instructions
        const bulletPoints = originalInstructions.match(/\*\s.+/g) || [];
        
        // Include 2-3 bullet points if available, or create generic ones
        if (bulletPoints.length > 0) {
          const selectedPoints = bulletPoints.slice(0, Math.min(3, bulletPoints.length));
          modifiedInstructions += selectedPoints.join('\n\n');
        } else {
          modifiedInstructions += `* Consider the broader implications of your work\n\n* Ensure all key points are supported by evidence\n\n* Think about potential objections and address them`;
        }
        
        // Create the new feedback format
        const structuredFeedback = `**Strengths:** The core elements of your ${section.title.toLowerCase()} are well-defined and show good understanding of the topic.\n**Weaknesses:** Some areas could benefit from more detailed explanation and examples.\n**Comments:** Consider adding more specific details that connect your work to current literature in the field.`;
        
        return {
          id: section.id,
          editedInstructions: modifiedInstructions,
          feedback: structuredFeedback,
          completionStatus: 'complete'
        };
      });
      
      console.log("Using fallback data with actual edits:", fallbackData);
      
      return {
        success: true,
        improvedData: fallbackData,
        usedFallback: true
      };
    }

    // Validate, format, and ensure instructions are actually changed
    const validatedData = response.map(item => {
      const sectionData = sectionsDataForPrompt.find(s => s.id === item.id);
      const originalInstructions = sectionData?.originalInstructionsText || '';
      
      // Determine if instructions were actually changed
      const instructionsChanged = 
        item.editedInstructions && 
        item.editedInstructions !== originalInstructions && 
        item.editedInstructions.length >= 50;
      
      // If the AI didn't change the instructions, create a congratulatory message
      let finalInstructions = instructionsChanged 
        ? item.editedInstructions 
        : createCongratulatory(item.id, sectionData?.title || 'section', originalInstructions);
      
      // Ensure feedback is in the Strengths/Weaknesses/Comments format
      let structuredFeedback = item.feedback || '';
      if (!structuredFeedback.includes('**Strengths:**') || 
          !structuredFeedback.includes('**Weaknesses:**') || 
          !structuredFeedback.includes('**Comments:**')) {
        structuredFeedback = createStructuredFeedback(item.id, sectionData?.title || 'section', item.feedback);
      }
      
      // Ensure all required fields exist with appropriate values
      return {
        id: item.id || '',
        editedInstructions: finalInstructions,
        feedback: structuredFeedback,
        completionStatus: (item.completionStatus === 'unstarted')
          ? 'unstarted'
          : 'complete'
      };
    }).filter(item => item.id); // Remove any items without an ID

    console.log(`[Instruction Improvement] Successfully processed ${validatedData.length} improved sections`);

    // Return success with the validated data
    return {
      success: true,
      improvedData: validatedData
    };
    
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    
    // Create enhanced fallback responses with actual edits and structured feedback
    const fallbackData = Object.keys(userInputs)
      .filter(id => {
        const content = userInputs[id];
        const section = sectionContent?.sections?.find(s => s.id === id);
        const placeholder = section?.placeholder || '';
        return content && content !== placeholder;
      })
      .map(id => {
        const section = sectionContent?.sections?.find(s => s.id === id);
        const originalInstructions = section?.instructions?.text || '';
        
        // Create a congratulatory message
        const editedInstructions = createCongratulatory(id, section?.title || 'section', originalInstructions);
        
        // Create structured feedback
        const feedback = createStructuredFeedback(id, section?.title || 'section');
        
        return {
          id: id,
          editedInstructions: editedInstructions,
          feedback: feedback,
          completionStatus: 'complete'
        };
      });
    
    console.log("Using error fallback data with congratulatory messages and structured feedback:", fallbackData);
    
    return {
      success: true,
      improvedData: fallbackData,
      usedFallback: true,
      errorMessage: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Creates a congratulatory message based on the original instructions
 * @param {string} id - The section ID
 * @param {string} title - The section title 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - A congratulatory message
 */
function createCongratulatory(id, title, originalInstructions) {
  // Start with a congratulatory message
  let message = `Great work on your ${title.toLowerCase()}! You've made excellent progress.\n\n`;
  
  // Different messages based on section type
  switch(id) {
    case 'question':
      message += `Your research question is well-formed and shows clear focus. Consider these refinements:\n\n`;
      message += `* Clarify how your question builds on existing knowledge\n\n`;
      message += `* Emphasize the specific impact your findings will have on the field\n\n`;
      message += `* Ensure your resources and methods are well-aligned with your question`;
      break;
      
    case 'audience':
      message += `You've identified a relevant audience for your work. To strengthen this further:\n\n`;
      message += `* Be more specific about how each community will benefit from your work\n\n`;
      message += `* Consider adding 1-2 more specific researchers or research groups\n\n`;
      message += `* Think about potential skeptics and how you'll address their concerns`;
      break;
      
    case 'hypothesis':
      message += `Your hypotheses are taking shape nicely. Consider these enhancements:\n\n`;
      message += `* Ensure each hypothesis is clearly falsifiable\n\n`;
      message += `* Explain more precisely how your experiment will differentiate between them\n\n`;
      message += `* Elaborate on why distinguishing between these hypotheses matters to the field`;
      break;
      
    case 'relatedpapers':
      message += `You've done a good job identifying related literature. To strengthen this section:\n\n`;
      message += `* Be more explicit about how each paper connects to your specific research question\n\n`;
      message += `* Highlight the specific gaps that your research will address\n\n`;
      message += `* Consider including papers with contrasting perspectives`;
      break;
      
    case 'experiment':
      message += `Your experimental design is developing well. Consider these improvements:\n\n`;
      message += `* Further clarify your key variables and how you'll measure them\n\n`;
      message += `* Strengthen your justification for your sample size\n\n`;
      message += `* Elaborate on how you'll control for potential confounds`;
      break;
      
    case 'existingdata':
      message += `Your data acquisition plan is taking shape. Consider these refinements:\n\n`;
      message += `* Provide more specifics about data provenance and quality\n\n`;
      message += `* Clarify how these particular datasets will answer your research question\n\n`;
      message += `* Address potential limitations of using pre-existing data`;
      break;
      
    case 'analysis':
      message += `Your analysis plan is well-structured. To strengthen it further:\n\n`;
      message += `* Be more specific about your data cleaning procedures\n\n`;
      message += `* Provide more detail on how you'll quantify uncertainty\n\n`;
      message += `* Consider alternative analysis approaches if your primary method faces challenges`;
      break;
      
    case 'process':
      message += `You've thought through your research process well. Consider these additions:\n\n`;
      message += `* Be more specific about timeline milestones\n\n`;
      message += `* Elaborate on your contingency plans for major obstacles\n\n`;
      message += `* Consider adding more detail about how you'll share your findings`;
      break;
      
    case 'abstract':
      message += `Your abstract effectively summarizes your research plan. To refine it:\n\n`;
      message += `* Sharpen the statement of your main research question or hypothesis\n\n`;
      message += `* Be more specific about your methods and anticipated results\n\n`;
      message += `* Strengthen the conclusion by emphasizing broader implications`;
      break;
      
    default:
      // Extract bullet points from original instructions to create suggestions
      const bulletPoints = originalInstructions.match(/\*\s.+/g) || [];
      message += `Consider these refinements to strengthen your work:\n\n`;
      
      // Include up to 3 bullet points, or generate generic ones
      if (bulletPoints.length > 0) {
        const selectedPoints = bulletPoints.slice(0, Math.min(3, bulletPoints.length));
        message += selectedPoints.join('\n\n');
      } else {
        message += `* Consider the broader implications of your work\n\n`;
        message += `* Ensure all key points are supported by evidence\n\n`;
        message += `* Think about potential objections and address them`;
      }
  }
  
  return message;
}

/**
 * Creates structured feedback in the Strengths/Weaknesses/Comments format
 * @param {string} id - The section ID
 * @param {string} title - The section title
 * @param {string} existingFeedback - Any existing feedback to adapt
 * @returns {string} - Structured feedback
 */
function createStructuredFeedback(id, title, existingFeedback = '') {
  // Default strengths, weaknesses, and comments
  let strengths = [];
  let weaknesses = [];
  let comments = [];
  
  // Try to extract insights from existing feedback
  if (existingFeedback && existingFeedback.length > 20) {
    // Look for positive statements as strengths
    const positivePatterns = [
      /good|well|excellent|clear|strong|thorough|comprehensive|thoughtful|detailed/gi,
      /impressed|impressive|nicely|effectively|successfully/gi
    ];
    
    // Look for areas of improvement as weaknesses
    const weaknessPatterns = [
      /could|should|need|lack|miss|improv|consider|clarif|expand|elaborat/gi,
      /unclear|vague|insufficient|limited|too (general|broad|narrow)/gi
    ];
    
    // Split existing feedback into sentences
    const sentences = existingFeedback.split(/\.\s+|\.(?=\n)/);
    
    for (const sentence of sentences) {
      if (sentence.length < 5) continue;
      
      const lowerSentence = sentence.toLowerCase();
      
      // Categorize each sentence
      if (positivePatterns.some(pattern => pattern.test(lowerSentence))) {
        strengths.push(sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
      } else if (weaknessPatterns.some(pattern => pattern.test(lowerSentence))) {
        weaknesses.push(sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
      } else if (lowerSentence.includes('suggest') || lowerSentence.includes('recommend') || 
                 lowerSentence.includes('try') || lowerSentence.includes('consider')) {
        comments.push(sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
      }
    }
  }
  
  // Default strengths if none were found
  if (strengths.length === 0) {
    switch(id) {
      case 'question':
        strengths.push('Your research question addresses an important gap in the field.');
        strengths.push('You've clearly identified the significance of your work.');
        break;
      case 'audience':
        strengths.push('You've identified relevant communities who would benefit from your research.');
        break;
      case 'hypothesis':
        strengths.push('Your hypotheses are clearly stated and testable.');
        break;
      case 'relatedpapers':
        strengths.push('You've identified relevant literature in the field.');
        break;
      case 'analysis':
        strengths.push('Your analysis approach is appropriate for your research question.');
        break;
      default:
        strengths.push(`You've made good progress on your ${title.toLowerCase()}.`);
    }
  }
  
  // Default weaknesses if none were found
  if (weaknesses.length === 0) {
    switch(id) {
      case 'question':
        weaknesses.push('The logical structure of your question could be more explicit.');
        break;
      case 'audience':
        weaknesses.push('More specific researchers or research groups could be identified.');
        break;
      case 'hypothesis':
        weaknesses.push('The connection between your hypotheses could be clearer.');
        break;
      case 'relatedpapers':
        weaknesses.push('The connection between the papers and your specific work could be stronger.');
        break;
      case 'analysis':
        weaknesses.push('More detail on uncertainty quantification would strengthen this section.');
        break;
      default:
        weaknesses.push(`Some aspects of your ${title.toLowerCase()} could be more detailed.`);
    }
  }
  
  // Default comments if none were found
  if (comments.length === 0) {
    switch(id) {
      case 'question':
        comments.push('Consider framing your question in relation to existing theoretical frameworks.');
        break;
      case 'audience':
        comments.push('Try to be more specific about how each audience group will use your findings.');
        break;
      case 'hypothesis':
        comments.push('Consider adding how your experiment will specifically test each hypothesis.');
        break;
      case 'relatedpapers':
        comments.push('Try organizing the papers to show the evolution of thinking in this area.');
        break;
      case 'analysis':
        comments.push('Consider adding details about how you'll handle unexpected results or outliers.');
        break;
      default:
        comments.push(`Consider connecting your ${title.toLowerCase()} more explicitly to your overall research goals.`);
    }
  }
  
  // Formatting for clean feedback
  const formatList = (items) => {
    if (items.length === 1) return items[0];
    return items.join(' ');
  };
  
  // Build the structured feedback
  return `**Strengths:** ${formatList(strengths)}\n**Weaknesses:** ${formatList(weaknesses)}\n**Comments:** ${formatList(comments)}`;
}

/**
 * Updates section content object with improved instructions AND feedback.
 * @param {Object} currentSections - The current sections object from state.
 * @param {Array} improvedData - Array of objects { id, editedInstructions, feedback, completionStatus }.
 * @returns {Object} - A new object with updated section content.
 */
export const updateSectionWithImprovedInstructions = (currentSections, improvedData) => {
  // Validate inputs
  if (!currentSections || typeof currentSections !== 'object') {
    console.error("Invalid currentSections: Expected an object");
    return currentSections || {}; // Return original or empty object
  }

  if (!Array.isArray(improvedData)) {
    console.error("Invalid improvedData: Expected an array");
    return {...currentSections}; // Return a shallow copy of the original
  }

  // Create a deep copy to avoid modifying the original state directly
  let updatedSections;
  try {
    updatedSections = JSON.parse(JSON.stringify(currentSections));
  } catch(e) {
    console.error("Error creating deep copy of sections:", e);
    return {...currentSections}; // Return shallow copy on error
  }

  // Keep track of changes made
  let changesApplied = false;
  
  // Update each section based on the improved data
  improvedData.forEach(improvement => {
    if (!improvement?.id) {
      console.warn("Missing ID in improvement data, skipping", improvement);
      return;
    }

    // Get section from updated sections
    let section = null;
    let sectionIndex = -1;
    
    if (Array.isArray(updatedSections.sections)) {
      sectionIndex = updatedSections.sections.findIndex(s => s?.id === improvement.id);
      if (sectionIndex === -1) {
        console.warn(`Section not found in current state: ${improvement.id}. Cannot apply improvement.`);
        return;
      }
      section = updatedSections.sections[sectionIndex];
    } else {
      console.error("Invalid sections structure:", updatedSections);
      return;
    }
    
    if (!section) {
      console.warn(`Section at index ${sectionIndex} is null or undefined, skipping.`);
      return;
    }

    // Initialize instructions object if it doesn't exist
    if (!section.instructions) {
      section.instructions = {};
    }

    // Update the instructions field - always update since we've already validated/generated content
    section.instructions.text = improvement.editedInstructions;
    console.log(`[updateSectionWithImprovedInstructions] Updated instructions for ${improvement.id} (${improvement.editedInstructions.length} chars)`);
    changesApplied = true;

    // Update feedback only if it's provided and meaningful
    if (improvement.feedback && improvement.feedback.trim() !== '' && improvement.feedback.length > 10) {
      section.instructions.feedback = improvement.feedback;
      console.log(`[updateSectionWithImprovedInstructions] Updated feedback for ${improvement.id} (${improvement.feedback.length} chars)`);
      changesApplied = true;
    } else {
      console.warn(`[updateSectionWithImprovedInstructions] Empty or short feedback for ${improvement.id}, skipping feedback update`);
    }
  });

  if (!changesApplied) {
    console.warn("[updateSectionWithImprovedInstructions] No meaningful changes were applied to any section");
  }

  // Return the new object with updated sections
  return updatedSections;
};
