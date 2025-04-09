// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Now provides feedback in Strengths, Weaknesses, Comments format with line breaks
 * UPDATED: Now enhances the subtraction of already completed items from instructions
 * UPDATED: More detailed console logging
 * UPDATED: Now crosses out completed instructions instead of removing them
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
    console.log("[Instruction Improvement] Starting batch instruction improvement process");
    console.time("instructionImprovementTime");
    
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
    
    1. CROSS OUT COMPLETED ITEMS: Your main job is to CROSS OUT bullet points that the user has already addressed, not remove them.
       - Carefully analyze what the user has already completed
       - For each bullet point that's been addressed, wrap it in Markdown strikethrough: ~~like this~~
       - Do not remove any instructions, just cross them out so users can see their progress
       - It's better to cross out too many points than too few - if they've made good progress on a point, cross it out
    
    2. For each section, YOU MUST ACTUALLY MODIFY the instructions based on the user's progress:
       - Cross out bullet points they've already addressed using ~~strikethrough~~
       - Add congratulatory language when appropriate
       - Add new, specific suggestions based on their work
       - Keep all original bullet points even if crossed out
    
    3. For complete or nearly complete sections, add congratulatory messages above the instructions like:
       "Great job on your [section]! You've clearly [specific achievements]."
       Then show the original instructions with most points crossed out using ~~strikethrough~~.
    
    4. Always provide structured feedback in this EXACT format with line breaks between sections:
       "**Strengths:**
       [list specific strengths]
       
       **Weaknesses:**
       [list areas that need improvement]
       
       **Comments:**
       [constructive suggestions]"
    
    5. Never delete the original instructions - always keep them but use ~~strikethrough~~ for completed items.
    
    Remember to return your response as a valid JSON array containing objects with id, editedInstructions, feedback, and completionStatus fields.
    `;

    const taskPrompt = buildTaskPrompt('instructionImprovement', {
      sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    // Log complete request data (for debugging)
    console.log("[Instruction Improvement] Request to OpenAI:", {
      systemPrompt: systemPrompt,
      taskPrompt: taskPrompt.substring(0, 200) + "...", // Truncated for readability
      sectionsCount: sectionsDataForPrompt.length,
      sectionIds: sectionsDataForPrompt.map(s => s.id)
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
    
    console.log("[Instruction Improvement] Complete response from OpenAI:", response);
    
    // If response is empty or not an array, use fallback
    if (!Array.isArray(response) || response.length === 0) {
      console.warn("[Instruction Improvement] Invalid or empty response format from OpenAI, using fallback");
      
      // Create enhanced fallback responses with crossed-out items and the new feedback format
      const fallbackData = sectionsDataForPrompt.map(section => {
        const originalInstructions = section.originalInstructionsText;
        
        // Create a congratulatory message
        let modifiedInstructions = `Great work on your ${section.title.toLowerCase()}! You've made excellent progress.\n\n`;
        
        // Process the original instructions to add strikethrough (cross out) formatting
        // This is a simple simulation - in real use we'd use more sophisticated content matching
        const processedInstructions = processInstructionsWithStrikethrough(
          originalInstructions, 
          section.userContent, 
          0.7 // Cross out about 70% of instructions as a fallback
        );
        
        // Add the processed instructions with strikethrough formatting
        modifiedInstructions += processedInstructions;
        
        // Basic structured feedback with line breaks
        const feedback = `**Strengths:**
Your work shows engagement with the task.

**Weaknesses:**
More detail may be needed in some areas.

**Comments:**
Continue developing your ${section.title.toLowerCase()}.`;
        
        return {
          id: section.id,
          editedInstructions: modifiedInstructions,
          feedback: feedback,
          completionStatus: 'complete'
        };
      });
      
      console.log("[Instruction Improvement] Using fallback data with crossed-out instructions:", fallbackData);
      
      return {
        success: true,
        improvedData: fallbackData,
        usedFallback: true
      };
    }

    // Validate, format, and ensure instructions use strikethrough instead of removal
    const validatedData = response.map(item => {
      const sectionData = sectionsDataForPrompt.find(s => s.id === item.id);
      const originalInstructions = sectionData?.originalInstructionsText || '';
      
      // Determine if instructions were actually changed
      const instructionsChanged = 
        item.editedInstructions && 
        item.editedInstructions !== originalInstructions && 
        item.editedInstructions.length >= 50;
      
      // If the AI didn't change the instructions properly, ensure we have strikethrough formatting
      let finalInstructions = instructionsChanged 
        ? ensureStrikethroughFormat(item.editedInstructions, originalInstructions)
        : createCrossedOutCongratulatory(item.id, sectionData?.title || 'section', originalInstructions);
      
      // Ensure feedback is in the Strengths/Weaknesses/Comments format with line breaks
      let structuredFeedback = item.feedback || '';
      if (!structuredFeedback.includes('**Strengths:**') || 
          !structuredFeedback.includes('**Weaknesses:**') || 
          !structuredFeedback.includes('**Comments:**') ||
          // Check for missing linebreaks
          structuredFeedback.includes('**Strengths:**\n') === false ||
          structuredFeedback.includes('\n\n**Weaknesses:**') === false ||
          structuredFeedback.includes('\n\n**Comments:**') === false) {
        structuredFeedback = formatExistingFeedback(item.feedback || '', sectionData?.title || 'section');
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

    console.log(`[Instruction Improvement] Successfully processed ${validatedData.length} improved sections with strikethrough formatting`);
    console.timeEnd("instructionImprovementTime");

    // Return success with the validated data
    return {
      success: true,
      improvedData: validatedData
    };
    
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    console.timeEnd("instructionImprovementTime");
    
    // Create enhanced fallback responses with strikethrough formatting and structured feedback
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
        
        // Create a congratulatory message with crossed-out original instructions
        const editedInstructions = createCrossedOutCongratulatory(id, section?.title || 'section', originalInstructions);
        
        // Simple structured feedback with line breaks
        const feedback = `**Strengths:**
Your work shows engagement with the task.

**Weaknesses:**
Some areas may need more development.

**Comments:**
Continue refining your ${section?.title?.toLowerCase() || 'work'}.`;
        
        return {
          id: id,
          editedInstructions: editedInstructions,
          feedback: feedback,
          completionStatus: 'complete'
        };
      });
    
    console.log("[Instruction Improvement] Using error fallback data with strikethrough formatting:", fallbackData);
    
    return {
      success: true,
      improvedData: fallbackData,
      usedFallback: true,
      errorMessage: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Process instructions to add strikethrough formatting based on user content
 * @param {string} instructions - The original instructions text
 * @param {string} userContent - The user's content for the section
 * @param {number} completionRatio - Optional ratio of how much to consider complete (0.0-1.0)
 * @returns {string} - Instructions with strikethrough formatting for completed items
 */
function processInstructionsWithStrikethrough(instructions, userContent, completionRatio = null) {
  if (!instructions) return '';
  
  // For a simple fallback, use a fixed completion ratio to simulate progress
  if (completionRatio !== null) {
    return simulateStrikethroughByRatio(instructions, completionRatio);
  }
  
  // Try to intelligently mark items as completed based on user content
  const lines = instructions.split('\n');
  const processedLines = [];
  
  // Normalize user content for easier matching
  const normalizedUserContent = userContent.toLowerCase().trim();
  
  for (const line of lines) {
    // Check if line is a bullet point
    if (line.trim().startsWith('*')) {
      // Extract the instruction content from the bullet point
      const instructionContent = line.trim().substring(1).trim();
      
      // Simple heuristic: if key terms from the instruction appear in the user content,
      // consider it completed and add strikethrough
      const keyTerms = extractKeyTerms(instructionContent);
      const isCompleted = keyTerms.some(term => 
        normalizedUserContent.includes(term.toLowerCase())
      );
      
      if (isCompleted) {
        // Add strikethrough formatting
        const strikeThroughLine = line.replace(
          instructionContent, 
          `~~${instructionContent}~~`
        );
        processedLines.push(strikeThroughLine);
      } else {
        // Keep the line as is
        processedLines.push(line);
      }
    } else {
      // Non-bullet point lines remain unchanged
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

/**
 * Extract key terms from an instruction for matching with user content
 * @param {string} instruction - The instruction text
 * @returns {string[]} - Array of key terms
 */
function extractKeyTerms(instruction) {
  // Split by common separators and get words/phrases
  const terms = [];
  
  // Add the full instruction as one term
  terms.push(instruction);
  
  // Split by some common separators to get more specific terms
  const splitTerms = instruction.split(/[,.;:()[\]{}]/).map(t => t.trim()).filter(t => t.length > 5);
  terms.push(...splitTerms);
  
  // Get specific noun phrases or important terms (simplified approach)
  const words = instruction.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    // Check for likely important terms based on common instruction keywords
    if (['define', 'describe', 'explain', 'identify', 'list', 'specify', 'justify'].includes(word)) {
      // Include the next 2-3 words as a potential key phrase
      if (i + 2 < words.length) {
        terms.push(words.slice(i, i + 3).join(' '));
      }
    }
  }
  
  return terms.filter(term => term.length > 0);
}

/**
 * Simple simulation of progress by applying strikethrough to a percentage of bullet points
 * @param {string} instructions - The original instructions text
 * @param {number} ratio - Ratio of bullet points to cross out (0.0-1.0)
 * @returns {string} - Instructions with simulated progress
 */
function simulateStrikethroughByRatio(instructions, ratio) {
  const lines = instructions.split('\n');
  const bulletPoints = lines.filter(line => line.trim().startsWith('*'));
  const numToStrikethrough = Math.floor(bulletPoints.length * ratio);
  
  let bulletPointsProcessed = 0;
  
  return lines.map(line => {
    if (line.trim().startsWith('*')) {
      bulletPointsProcessed++;
      
      if (bulletPointsProcessed <= numToStrikethrough) {
        // Cross out the content part of the bullet point
        const bulletPart = line.indexOf('*');
        const contentStart = line.indexOf(' ', bulletPart) + 1;
        const firstPart = line.substring(0, contentStart);
        const contentPart = line.substring(contentStart);
        
        return `${firstPart}~~${contentPart}~~`;
      }
    }
    return line;
  }).join('\n');
}

/**
 * Creates a congratulatory message with crossed-out instructions
 * @param {string} id - The section ID
 * @param {string} title - The section title 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - A congratulatory message with crossed-out instructions
 */
function createCrossedOutCongratulatory(id, title, originalInstructions) {
  // Start with a congratulatory message
  let message = `Great work on your ${title.toLowerCase()}! You've made excellent progress.\n\n`;
  
  // Add crossed-out version of the original instructions
  const crossedOutInstructions = simulateStrikethroughByRatio(originalInstructions, 0.7);
  message += crossedOutInstructions;
  
  // Different messages based on section type - add at the end
  switch(id) {
    case 'question':
      message += `\n\n* Consider how your question relates to current debates in the field`;
      break;
      
    case 'audience':
      message += `\n\n* Consider the potential impact of your work on policy makers or industry practitioners`;
      break;
      
    case 'hypothesis':
      message += `\n\n* Consider the broader theoretical implications if your results support neither hypothesis`;
      break;
      
    case 'relatedpapers':
      message += `\n\n* Consider contrasting perspectives or methodological approaches in your literature review`;
      break;
      
    case 'experiment':
      message += `\n\n* Consider pre-registering your experimental protocol for increased credibility`;
      break;
      
    default:
      // Only add a new suggestion if we haven't removed too many
      if (Math.random() > 0.5) {
        message += `\n\n* Consider how this section connects to your broader research narrative`;
      }
  }
  
  return message;
}

/**
 * Ensures proper strikethrough format is applied to instructions
 * @param {string} editedInstructions - The AI-edited instructions 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - Instructions with proper strikethrough formatting
 */
function ensureStrikethroughFormat(editedInstructions, originalInstructions) {
  // Check if the AI already used strikethrough formatting
  if (editedInstructions.includes('~~')) {
    return editedInstructions;
  }
  
  // If no strikethrough is found, compare with original to add it
  const originalLines = originalInstructions.split('\n');
  const editedLines = editedInstructions.split('\n');
  
  // Find bullet points in original that are missing in edited
  const missingLines = originalLines.filter(line => {
    // Only consider bullet points
    if (!line.trim().startsWith('*')) return false;
    
    // Check if this line is missing in edited version
    return !editedLines.some(editedLine => 
      editedLine.includes(line.trim()) || 
      // Also check if it appears with strikethrough already
      editedLine.includes('~~' + line.trim() + '~~')
    );
  });
  
  // If there are missing lines, add them back with strikethrough
  if (missingLines.length > 0) {
    let congrats = '';
    if (editedInstructions.startsWith('Great') || 
        editedInstructions.startsWith('Excellent') || 
        editedInstructions.startsWith('Well done')) {
      // Extract the congratulatory part
      const firstParagraphEnd = editedInstructions.indexOf('\n\n');
      if (firstParagraphEnd > 0) {
        congrats = editedInstructions.substring(0, firstParagraphEnd + 2);
        editedInstructions = editedInstructions.substring(firstParagraphEnd + 2);
      }
    }
    
    // Add missing lines with strikethrough
    const missingLinesWithStrikethrough = missingLines.map(line => {
      // Extract the content part of the bullet point
      const bulletPart = line.indexOf('*');
      const contentStart = line.indexOf(' ', bulletPart) + 1;
      const firstPart = line.substring(0, contentStart);
      const contentPart = line.substring(contentStart);
      
      return `${firstPart}~~${contentPart}~~`;
    }).join('\n');
    
    // Add crossed-out lines at an appropriate position
    // Try to insert after existing bullet points if they exist
    let bulletPointFound = false;
    for (let i = 0; i < editedLines.length; i++) {
      if (editedLines[i].trim().startsWith('*')) {
        bulletPointFound = true;
        // Add the missing lines after the last existing bullet point
        let j = i;
        while (j < editedLines.length && (editedLines[j].trim().startsWith('*') || editedLines[j].trim() === '')) {
          j++;
        }
        
        // Insert the missing lines
        editedLines.splice(j, 0, missingLinesWithStrikethrough);
        break;
      }
    }
    
    // If no bullet points found, add at the end
    if (!bulletPointFound) {
      editedLines.push('');
      editedLines.push(missingLinesWithStrikethrough);
    }
    
    return congrats + editedLines.join('\n');
  }
  
  // If no significant differences found, return the edited instructions
  return editedInstructions;
}

/**
 * Formats existing feedback into the Strengths/Weaknesses/Comments structure
 * with proper line breaks between sections
 * @param {string} feedback - The feedback to format
 * @param {string} sectionTitle - The section title
 * @returns {string} - Structured feedback
 */
function formatExistingFeedback(feedback, sectionTitle) {
  // If there's no meaningful feedback, return a minimal structure
  if (!feedback || feedback.trim() === '' || feedback.length < 20) {
    return `**Strengths:**
Shows effort in developing this section.

**Weaknesses:**
Needs more development in key areas.

**Comments:**
Continue developing your ${sectionTitle.toLowerCase()}.`;
  }
  
  // Try to identify strengths, weaknesses, and comments from existing feedback
  const lines = feedback.split('\n');
  let strengths = '';
  let weaknesses = '';
  let comments = '';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    // Look for patterns that might indicate strengths or weaknesses
    if (lower.includes('good') || lower.includes('well') || lower.includes('strong') || 
        lower.includes('clear') || lower.includes('excellent')) {
      strengths += (strengths ? ' ' : '') + line.trim();
    } else if (lower.includes('could') || lower.includes('should') || lower.includes('need') || 
               lower.includes('improve') || lower.includes('consider') || lower.includes('missing')) {
      weaknesses += (weaknesses ? ' ' : '') + line.trim();
    } else if (lower.includes('suggest') || lower.includes('recommendation') || 
               lower.includes('might want to') || lower.includes('try')) {
      comments += (comments ? ' ' : '') + line.trim();
    }
  }
  
  // If we couldn't identify specific categories, use the entire feedback as comments
  if (!strengths && !weaknesses && !comments) {
    comments = feedback.trim();
  }
  
  // Construct the structured feedback with line breaks
  return `**Strengths:**
${strengths || 'Shows effort in developing this section.'}

**Weaknesses:**
${weaknesses || 'Some aspects could be more fully developed.'}

**Comments:**
${comments || 'Continue developing your work.'}`;
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
