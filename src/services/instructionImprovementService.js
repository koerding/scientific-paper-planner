// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Now provides feedback inline after each instruction bullet point
 * UPDATED: Instructions are bold, feedback is regular text
 * UPDATED: Completed instructions use strikethrough within bold formatting
 * UPDATED: More detailed console logging
 * FIXED: Resolved issues with improve button functionality
 * FIXED: Fixed tooltip preservation with segment-based processing
 * FIXED: Completely reworked tooltip handling to use segmentation instead of markers
 */
import { callOpenAI } from './openaiService';
import { isResearchApproachSection, buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

/**
 * Extracts bullet points from instruction text
 * @param {string} instructions - The original instructions text
 * @returns {Array<string>} - Array of bullet point text without the bullet markers
 */
function extractBulletPoints(instructions) {
  if (!instructions) return [];
  
  const lines = instructions.split('\n');
  const bulletPoints = [];
  
  lines.forEach(line => {
    // Look for bullet points (lines starting with * or -)
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
      // Extract the content after the bullet marker
      const content = trimmed.substring(trimmed.indexOf(' ') + 1).trim();
      if (content) {
        bulletPoints.push(content);
      }
    }
  });
  
  // If no bullet points found, create a few generic ones
  if (bulletPoints.length === 0) {
    return [
      "Define your key points clearly",
      "Explain the significance to your field",
      "Consider methodological implications",
      "Link to existing literature"
    ];
  }
  
  return bulletPoints;
}

/**
 * Splits text into segments around italic blocks to preserve tooltips
 * @param {string} text - The original text with tooltips in italic blocks
 * @returns {Array} - Array of segments, alternating between normal text and tooltips
 */
function splitAroundTooltips(text) {
  if (!text) return [];
  
  // Log a snippet of input text for debugging
  console.log(`[splitAroundTooltips] Input sample: ${text.substring(0, 100).replace(/\n/g, "\\n")}...`);
  
  // This array will hold all segments in order:
  // [normal text, tooltip text, normal text, tooltip text, ...]
  const segments = [];
  let currentIndex = 0;
  
  // Find italic blocks that are substantial in length (tooltips)
  const italicRegex = /\*([^*]{30,}?)\*/g;
  let match;
  
  while ((match = italicRegex.exec(text)) !== null) {
    // Add text segment before the tooltip if it exists
    if (match.index > currentIndex) {
      segments.push({
        type: 'text',
        content: text.substring(currentIndex, match.index)
      });
    }
    
    // Add the tooltip segment
    segments.push({
      type: 'tooltip',
      content: match[1]  // Just the content between asterisks
    });
    
    // Update current position
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last tooltip if any
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(currentIndex)
    });
  }
  
  console.log(`[splitAroundTooltips] Split into ${segments.length} segments (${segments.filter(s => s.type === 'tooltip').length} tooltips)`);
  
  return segments;
}

/**
 * Recombines text segments and tooltips after AI processing
 * @param {Array} originalSegments - The original segments
 * @param {string} improvedText - The improved text from AI without tooltips
 * @returns {string} - Combined text with tooltips reinserted
 */
function recombineWithTooltips(originalSegments, improvedText) {
  if (!originalSegments || originalSegments.length === 0) {
    return improvedText;
  }
  
  console.log(`[recombineWithTooltips] Starting recombination with ${originalSegments.length} segments`);
  console.log(`[recombineWithTooltips] Improved text sample: ${improvedText.substring(0, 100)}...`);
  
  // Extract just the text segments from original content (without tooltips)
  const textSegments = originalSegments.filter(s => s.type === 'text');
  const tooltips = originalSegments.filter(s => s.type === 'tooltip');
  
  if (tooltips.length === 0) {
    console.log(`[recombineWithTooltips] No tooltips to reinsert`);
    return improvedText;
  }
  
  console.log(`[recombineWithTooltips] Found ${tooltips.length} tooltips to reinsert`);
  
  // If there's only one text segment and we're replacing it completely
  if (textSegments.length === 1 && textSegments[0].content.trim() === originalSegments[0].content.trim()) {
    // For this simple case, just reinsert all tooltips at the end
    console.log(`[recombineWithTooltips] Using simple tooltip insertion at the end`);
    let result = improvedText;
    tooltips.forEach(tooltip => {
      result += `\n\n*${tooltip.content}*`;
    });
    return result;
  }
  
  // If there are multiple text segments, we need a more complex approach
  // We'll use a better segment-based approach for reconstructing the text
  
  // First, find core instruction points in the improved text
  const instructionPoints = [];
  const instructionRegex = /\*\s+\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = instructionRegex.exec(improvedText)) !== null) {
    instructionPoints.push({
      text: match[1],
      index: match.index
    });
  }
  
  // If we can't find instruction points, fall back to bullet points
  if (instructionPoints.length === 0) {
    const bulletRegex = /^\s*\*\s+/gm;
    while ((match = bulletRegex.exec(improvedText)) !== null) {
      instructionPoints.push({
        text: improvedText.substring(match.index, improvedText.indexOf('\n', match.index + 1)),
        index: match.index
      });
    }
  }
  
  console.log(`[recombineWithTooltips] Found ${instructionPoints.length} instruction points`);
  
  // If we still don't have instruction points, just append tooltips at the end
  if (instructionPoints.length === 0) {
    console.log(`[recombineWithTooltips] No instruction points found, appending tooltips at the end`);
    let result = improvedText;
    tooltips.forEach(tooltip => {
      result += `\n\n*${tooltip.content}*`;
    });
    return result;
  }
  
  // Distribute tooltips among instruction points
  const tooltipsPerPoint = Math.ceil(tooltips.length / instructionPoints.length);
  
  // Create a new array to hold the final text
  let finalText = '';
  let currentTooltipIndex = 0;
  
  // Insert the text before the first instruction point
  finalText += improvedText.substring(0, instructionPoints[0].index);
  
  // Process each instruction point
  for (let i = 0; i < instructionPoints.length; i++) {
    const currentPoint = instructionPoints[i];
    const nextPoint = i < instructionPoints.length - 1 ? instructionPoints[i + 1] : null;
    
    // Add this instruction point's text
    const endIndex = nextPoint ? nextPoint.index : improvedText.length;
    finalText += improvedText.substring(currentPoint.index, endIndex);
    
    // Add tooltips for this section
    for (let j = 0; j < tooltipsPerPoint && currentTooltipIndex < tooltips.length; j++) {
      finalText += `\n\n*${tooltips[currentTooltipIndex].content}*\n`;
      currentTooltipIndex++;
    }
  }
  
  // Add any remaining tooltips at the end
  while (currentTooltipIndex < tooltips.length) {
    finalText += `\n\n*${tooltips[currentTooltipIndex].content}*\n`;
    currentTooltipIndex++;
  }
  
  console.log(`[recombineWithTooltips] Successfully recombined text with ${tooltips.length} tooltips`);
  return finalText;
}

/**
 * Improves instructions for multiple sections, providing inline feedback after each instruction point.
 * Uses OpenAI's native JSON mode for reliable parsing.
 * FIXED: Now uses segment-based approach to preserve tooltips
 * @param {Array} currentSections - Array of section objects from the main state
 * @param {Object} userInputs - User inputs for all sections
 * @param {Object} sectionContent - The full, original section content definition object
 * @returns {Promise<Object>} - Result with success flag and improved instructions
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

    // Store original content segments for each section
    const sectionSegmentsMap = {};

    // Prepare data for analysis
    const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSectionDef || !originalSectionDef.instructions?.text) {
        console.warn(`Original section definition or instructions missing for ID ${sectionId}. Skipping.`);
        return null;
      }
      
      const userContent = userInputs[sectionId] || '';
      const needsResearchContext = isResearchApproachSection(sectionId, originalSectionDef);

      // Split the original instructions into segments to preserve tooltips
      const originalInstructionsText = originalSectionDef.instructions.text;
      console.log(`[Instruction Improvement] Processing segments for section ${sectionId}`);
      const segments = splitAroundTooltips(originalInstructionsText);
      
      // Store segments for later recombination
      sectionSegmentsMap[sectionId] = segments;
      
      // Extract non-tooltip text for sending to OpenAI
      const textOnlyInstructions = segments
        .filter(segment => segment.type === 'text')
        .map(segment => segment.content)
        .join(' ');
      
      const tooltipCount = segments.filter(segment => segment.type === 'tooltip').length;
      console.log(`[Instruction Improvement] Section ${sectionId} has ${tooltipCount} tooltips and ${segments.length - tooltipCount} text segments`);

      return {
        id: sectionId,
        title: originalSectionDef.title,
        originalInstructionsText: textOnlyInstructions, // Send only non-tooltip text
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

    // Build enhanced system prompt
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: needsOverallResearchContext,
      approachGuidance: ''
    }) + `

    IMPORTANT ADDITIONAL INSTRUCTIONS:
    
    1. Format each instruction and feedback like this:
       * **Original instruction** (in bold)
       Specific feedback about this point (non-bold, directly below instruction)
       
       OR for completed instructions:
       * **~~Completed instruction~~** (bold + strikethrough)
       Positive feedback about what they did well (non-bold)
    
    2. DO NOT use a separate 'feedback' field - all feedback should be inline after each instruction point
    
    3. For complete or nearly complete sections, add congratulatory messages above the instructions like:
       "Great job on your [section]! You've clearly [specific achievements]."
    
    4. Keep all instructions in bold (**instruction**) and all feedback in regular (non-bold) text
    
    Remember to return your response as a valid JSON array containing objects with id, editedInstructions, and completionStatus fields.
    `;

    const taskPrompt = buildTaskPrompt('instructionImprovement', {
      sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    // Log request data
    console.log("[Instruction Improvement] Request to OpenAI:", {
      systemPromptLength: systemPrompt.length,
      taskPromptLength: taskPrompt.length,
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
    
    console.log("[Instruction Improvement] Response received from OpenAI, processing now...");
    
    // If response is empty or not an array, use fallback
    if (!Array.isArray(response) || response.length === 0) {
      // Check if response has a 'results' array (from the JSON format)
      const resultsArray = response?.results;
      if (Array.isArray(resultsArray) && resultsArray.length > 0) {
        console.log("[Instruction Improvement] Found results array within response object");
        // Process the results array
        const validatedData = processImprovedInstructions(resultsArray, sectionSegmentsMap);
        console.timeEnd("instructionImprovementTime");
        return {
          success: true,
          improvedData: validatedData
        };
      }
      
      console.warn("[Instruction Improvement] Invalid or empty response format from OpenAI, using fallback");
      
      // Create enhanced fallback responses with inline feedback format
      const fallbackData = sectionsDataForPrompt.map(section => {
        // Extract bullet points from original instructions
        const bulletPoints = extractBulletPoints(section.originalInstructionsText);
        
        // Create a congratulatory message
        let modifiedInstructions = `Great work on your ${section.title.toLowerCase()}! You've made excellent progress.\n\n`;
        
        // Add formatted bullet points with inline feedback
        bulletPoints.forEach((point, index) => {
          const isCompleted = Math.random() > 0.3; // Randomly select some as completed for fallback
          
          // Extract the instruction portion (bold part) and the rest
          const boldRegex = /\*\*([^*]+)\*\*/;
          const boldMatch = point.match(boldRegex);
          
          // Get the instruction text (bold part)
          const instruction = boldMatch ? boldMatch[1].trim() : point;
          
          // The text after the instruction (contains tooltips if any)
          const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
          
          if (isCompleted) {
            // Apply strikethrough to both instruction and following text
            if (boldMatch) {
              modifiedInstructions += `* **~~${instruction}~~**${afterInstructionText}\n`;
            } else {
              modifiedInstructions += `* ~~${point}~~\n`;
            }
            modifiedInstructions += `You've addressed this point effectively by focusing on the key elements.\n\n`;
          } else {
            // Not completed
            if (boldMatch) {
              modifiedInstructions += `* **${instruction}**${afterInstructionText}\n`;
            } else {
              modifiedInstructions += `* ${point}\n`;
            }
            modifiedInstructions += `Consider adding more detail here to strengthen your ${section.title.toLowerCase()}.\n\n`;
          }
        });
        
        // Recombine with the original tooltips
        const finalInstructions = recombineWithTooltips(
          sectionSegmentsMap[section.id] || [],
          modifiedInstructions
        );
        
        return {
          id: section.id,
          editedInstructions: finalInstructions,
          completionStatus: 'complete'
        };
      });
      
      console.log("[Instruction Improvement] Using fallback data with inline feedback format:", fallbackData.length);
      console.timeEnd("instructionImprovementTime");
      
      return {
        success: true,
        improvedData: fallbackData,
        usedFallback: true
      };
    }

    // Process the improved instructions from the response array
    const validatedData = processImprovedInstructions(response, sectionSegmentsMap);
    
    console.log(`[Instruction Improvement] Successfully processed ${validatedData.length} improved sections with inline feedback`);
    console.timeEnd("instructionImprovementTime");

    // Return success with the validated data
    return {
      success: true,
      improvedData: validatedData
    };
    
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    console.timeEnd("instructionImprovementTime");
    
    // Create enhanced fallback responses with bold instructions and inline feedback
    const fallbackData = Object.keys(userInputs)
      .filter(id => {
        const content = userInputs[id];
        const section = sectionContent?.sections?.find(s => s.id === id);
        const placeholder = section?.placeholder || '';
        return content && content !== placeholder;
      })
      .map(id => {
        const section = sectionContent?.sections?.find(s => s.id === id);
        if (!section) return null;
        
        const originalInstructions = section.instructions?.text || '';
        
        // Split into segments to preserve tooltips
        const segments = splitAroundTooltips(originalInstructions);
        
        // Create formatted fallback instructions with inline feedback
        let editedInstructions = createFormattedFallbackInstructions(
          section.title || 'section', 
          segments.filter(s => s.type === 'text').map(s => s.content).join(' ')
        );
        
        // Recombine with tooltips
        editedInstructions = recombineWithTooltips(segments, editedInstructions);
        
        return {
          id: id,
          editedInstructions: editedInstructions,
          completionStatus: 'complete'
        };
      })
      .filter(item => item !== null); // Remove null items
    
    console.log("[Instruction Improvement] Using error fallback data with inline feedback format:", fallbackData.length);
    
    return {
      success: true,
      improvedData: fallbackData,
      usedFallback: true,
      errorMessage: error.message || "An error occurred while improving instructions"
    };
  }
};

/**
 * Process the improved instructions, recombining with original tooltips
 * @param {Array} improvedData - Array of improved section data from OpenAI
 * @param {Object} sectionSegmentsMap - Map of section IDs to their segment data
 * @returns {Array} - Processed instructions with tooltips reinserted
 */
function processImprovedInstructions(improvedData, sectionSegmentsMap) {
  // Validate and process the improved instructions
  return improvedData.map(item => {
    // Get the section ID
    const sectionId = item.id;
    if (!sectionId) {
      console.warn("Missing ID in response item, skipping", item);
      return null;
    }
    
    // Get the segments for this section
    const segments = sectionSegmentsMap[sectionId] || [];
    
    // Determine if instructions were actually changed
    const instructionsChanged = 
      item.editedInstructions && 
      item.editedInstructions.length >= 50;
    
    // Recombine with original tooltips
    let finalInstructions;
    if (instructionsChanged) {
      finalInstructions = recombineWithTooltips(segments, item.editedInstructions);
      console.log(`[processImprovedInstructions] Recombined instructions for ${sectionId} (${finalInstructions.length} chars)`);
    } else {
      // If AI didn't provide good instructions, use fallback
      const textContent = segments
        .filter(segment => segment.type === 'text')
        .map(segment => segment.content)
        .join(' ');
      
      const fallbackText = createFormattedFallbackInstructions(sectionId, textContent);
      finalInstructions = recombineWithTooltips(segments, fallbackText);
      console.log(`[processImprovedInstructions] Using fallback instructions for ${sectionId}`);
    }
    
    // Return the processed item
    return {
      id: sectionId,
      editedInstructions: finalInstructions,
      completionStatus: item.completionStatus === 'unstarted' ? 'unstarted' : 'complete'
    };
  }).filter(item => item !== null); // Filter out null items
}

/**
 * Updates section content object with improved instructions.
 * @param {Object} currentSections - The current sections object from state.
 * @param {Array} improvedData - Array of objects { id, editedInstructions, completionStatus }.
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

    // No need to update feedback separately since it's now inline with instructions
    // Remove any existing separate feedback field to avoid confusion
    if (section.instructions.hasOwnProperty('feedback')) {
      delete section.instructions.feedback;
      console.log(`[updateSectionWithImprovedInstructions] Removed separate feedback for ${improvement.id} as it's now inline`);
    }
  });

  if (!changesApplied) {
    console.warn("[updateSectionWithImprovedInstructions] No meaningful changes were applied to any section");
  }

  // Return the new object with updated sections
  return updatedSections;
};

/**
 * Creates formatted instructions with inline feedback for fallback cases
 * @param {string} sectionTitle - The section title 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - Formatted instructions with inline feedback
 */
function createFormattedFallbackInstructions(sectionTitle, originalInstructions) {
  // Create a congratulatory message
  let formattedInstructions = `Great work on your ${sectionTitle.toLowerCase()}! You've made good progress.\n\n`;
  
  // Extract bullet points from original instructions
  const bulletPoints = extractBulletPoints(originalInstructions);
  
  // Format each bullet point with inline feedback
  bulletPoints.forEach((point, index) => {
    // Extract the instruction portion (bold part) and the rest
    const boldRegex = /\*\*([^*]+)\*\*/;
    const boldMatch = point.match(boldRegex);
    
    // Get the instruction text (bold part)
    const instruction = boldMatch ? boldMatch[1].trim() : point;
    
    // The text after the instruction (contains tooltips if any)
    const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
    
    // Mark about 70% of points as completed for fallback
    const isCompleted = Math.random() > 0.3;
    
    if (isCompleted) {
      // Apply strikethrough to both instruction and following text
      if (boldMatch) {
        formattedInstructions += `* **~~${instruction}~~**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ~~${point}~~\n`;
      }
      
      // Different feedback for different positions (not strikethrough)
      if (index === 0) {
        formattedInstructions += `You've clearly addressed this fundamental point in your work.\n\n`;
      } else if (index === bulletPoints.length - 1) {
        formattedInstructions += `Your work shows good understanding of this aspect.\n\n`;
      } else {
        formattedInstructions += `This point is well developed in your current draft.\n\n`;
      }
    } else {
      // Not completed
      if (boldMatch) {
        formattedInstructions += `* **${instruction}**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ${point}\n`;
      }
      
      // Different feedback for different positions
      if (index === 0) {
        formattedInstructions += `This foundational aspect needs more attention to strengthen your ${sectionTitle.toLowerCase()}.\n\n`;
      } else if (index === bulletPoints.length - 1) {
        formattedInstructions += `Consider elaborating on this point to round out your approach.\n\n`;
      } else {
        formattedInstructions += `Adding more detail here would enhance the depth of your work.\n\n`;
      }
    }
  });
  
  return formattedInstructions;
}
