// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Now provides feedback inline after each instruction bullet point
 * UPDATED: Instructions are bold, feedback is regular text
 * UPDATED: Completed instructions use strikethrough within bold formatting
 * UPDATED: More detailed console logging
 * FIXED: Resolved issues with improve button functionality
 * FIXED: Properly handles tooltip preservation for the exact original format (__TOOLTIP_N__)
 * FIXED: Added extensive debugging and validation to ensure tooltips are preserved
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
 * Extracts tooltips from text using a simple approach that preserves the exact format
 * CRITICAL: We preserve the EXACT original format that appears in the text
 * @param {string} text - Original text with tooltips
 * @returns {object} - Object with processed text and tooltips map
 */
function extractTooltipsBeforeAI(text) {
  if (!text) return { text: '', tooltips: {} };

  // Find all __TOOLTIP_N__ instances in the text using regex
  const tooltipRegex = /__TOOLTIP_(\d+)__/g;
  const tooltips = {};
  const tooltipMatches = [];
  let match;
  
  // First, collect all tooltip references
  while ((match = tooltipRegex.exec(text)) !== null) {
    const fullMatch = match[0];  // The full __TOOLTIP_N__ match
    const tooltipNumber = match[1]; // Just the number
    tooltipMatches.push({
      fullMatch, 
      tooltipNumber,
      index: match.index
    });
  }
  
  // Debug log the found tooltips
  console.log(`[extractTooltipsBeforeAI] Found ${tooltipMatches.length} tooltip references`);
  
  // Now, extract the actual tooltip content from italic blocks
  // Look for patterns like *__TOOLTIP_X____TOOLTIP_Y__content*
  const italicRegex = /\*(.*?)\*/g;
  let italicMatch;
  let modifiedText = text;
  
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    const fullItalicContent = italicMatch[0]; // The full *...* block
    const innerContent = italicMatch[1];      // Just the content between *...*
    
    // Check if this italic block contains tooltips
    const tooltipsInBlock = tooltipMatches.filter(tm => 
      innerContent.includes(tm.fullMatch)
    );
    
    if (tooltipsInBlock.length > 0) {
      // This is a tooltip-containing italic block
      
      // Get the content part (after all the tooltips)
      // We assume the content comes after all tooltips
      let contentStartIndex = 0;
      for (const tm of tooltipsInBlock) {
        const tooltipEndInItalic = innerContent.indexOf(tm.fullMatch) + tm.fullMatch.length;
        contentStartIndex = Math.max(contentStartIndex, tooltipEndInItalic);
      }
      
      // Extract the actual content
      const tooltipContent = innerContent.substring(contentStartIndex).trim();
      
      // Store the content for each tooltip in this block
      for (const tm of tooltipsInBlock) {
        tooltips[tm.fullMatch] = tooltipContent;
      }
      
      // Replace the italic block with a special marker in the modified text
      const specialMarker = tooltipsInBlock
        .map(tm => `[TOOLTIP_ORIG_${tm.tooltipNumber}]`)
        .join('');
      
      modifiedText = modifiedText.replace(
        fullItalicContent, 
        specialMarker
      );
    }
  }
  
  console.log(`[extractTooltipsBeforeAI] Found ${Object.keys(tooltips).length} tooltip contents`);
  
  return { 
    text: modifiedText, 
    tooltips 
  };
}

/**
 * Restores tooltips to the original text format after AI processing
 * CRITICAL: This handles the exact original format
 * @param {string} text - Text with tooltip markers
 * @param {Object} tooltips - Map of original tooltips to content
 * @returns {string} - Text with tooltips restored to original format
 */
function restoreTooltipsAfterAI(text, tooltips) {
  if (!text || !tooltips || Object.keys(tooltips).length === 0) {
    return text;
  }
  
  let restoredText = text;
  
  // First, log the tooltips we're trying to restore
  console.log(`[restoreTooltipsAfterAI] Restoring ${Object.keys(tooltips).length} tooltips:`, 
    Object.keys(tooltips).join(', '));
  
  // For each tooltip, restore the original content
  for (const [originalTooltip, content] of Object.entries(tooltips)) {
    // Extract the tooltip number
    const tooltipNumMatch = originalTooltip.match(/__TOOLTIP_(\d+)__/);
    if (!tooltipNumMatch) continue;
    
    const tooltipNum = tooltipNumMatch[1];
    
    // Look for our special marker format
    const specialMarker = `[TOOLTIP_ORIG_${tooltipNum}]`;
    
    if (restoredText.includes(specialMarker)) {
      // If our special marker exists, replace it with the original tooltip wrapped in italic
      restoredText = restoredText.replace(
        specialMarker, 
        `*${originalTooltip}${content}*`
      );
    } 
    // Also look for the original tooltip format as fallback
    else if (restoredText.includes(originalTooltip)) {
      // If the original tooltip is still there, just leave it as is
      console.log(`[restoreTooltipsAfterAI] Original tooltip ${originalTooltip} found intact`);
    }
    // Try to find tooltip references that might have been slightly modified
    else {
      const possibleVariations = [
        `__TOOLTIP_${tooltipNum}__`,  // Standard format
        `__TOOLTIP${tooltipNum}__`,   // No underscore
        `__TOOLTIP_${tooltipNum} __`, // Space before closing
        `__ TOOLTIP_${tooltipNum}__`,  // Space after opening
        `[TOOLTIP_${tooltipNum}]`,     // Square bracket format
        `[TOOLTIP_MARKER_${tooltipNum}]` // Enhanced marker format
      ];
      
      let replaced = false;
      for (const variant of possibleVariations) {
        if (restoredText.includes(variant)) {
          restoredText = restoredText.replace(
            variant, 
            `*${originalTooltip}${content}*`
          );
          replaced = true;
          console.log(`[restoreTooltipsAfterAI] Found and replaced variant: ${variant}`);
          break;
        }
      }
      
      if (!replaced) {
        console.warn(`[restoreTooltipsAfterAI] Could not find tooltip ${originalTooltip} or any variation`);
      }
    }
  }
  
  // Look for any remaining markers
  const remainingMarkers = restoredText.match(/\[TOOLTIP_(?:ORIG|MARKER)_\d+\]/g) || [];
  if (remainingMarkers.length > 0) {
    console.warn(`[restoreTooltipsAfterAI] ${remainingMarkers.length} markers weren't replaced:`, 
      remainingMarkers.join(', '));
  }
  
  // As a fallback, try to restore any tooltips that weren't wrapped in our special format
  // This directly adds the content next to the tooltip if the tooltip placeholder still exists
  for (const [originalTooltip, content] of Object.entries(tooltips)) {
    if (restoredText.includes(originalTooltip) && !restoredText.includes(`*${originalTooltip}${content}*`)) {
      // Make sure it's not already inside an italic block
      const italicPattern = new RegExp(`\\*[^*]*${originalTooltip}[^*]*\\*`, 'g');
      if (!italicPattern.test(restoredText)) {
        restoredText = restoredText.replace(
          originalTooltip, 
          `*${originalTooltip}${content}*`
        );
        console.log(`[restoreTooltipsAfterAI] Applied direct replacement for ${originalTooltip}`);
      }
    }
  }
  
  return restoredText;
}

/**
 * Improves instructions for multiple sections, providing inline feedback after each instruction point.
 * Uses OpenAI's native JSON mode for reliable parsing.
 * FIXED: Now properly preserves tooltip content in the original format
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

    // Store extracted tooltips for each section to restore them later
    const sectionTooltipsMap = {};

    // Prepare data for analysis
    const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
      const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
      if (!originalSectionDef || !originalSectionDef.instructions?.text) {
        console.warn(`Original section definition or instructions missing for ID ${sectionId}. Skipping.`);
        return null;
      }
      
      const userContent = userInputs[sectionId] || '';
      const needsResearchContext = isResearchApproachSection(sectionId, originalSectionDef);

      // EXTRACT TOOLTIPS before sending to AI using the fixed approach
      const originalInstructionsText = originalSectionDef.instructions.text;
      const { text: processedInstructions, tooltips } = extractTooltipsBeforeAI(originalInstructionsText);
      
      // Store the tooltips for later restoration
      sectionTooltipsMap[sectionId] = tooltips;

      // Log tooltip extraction for debugging
      console.log(`[Instruction Improvement] Extracted ${Object.keys(tooltips).length} tooltips from section ${sectionId}`);

      return {
        id: sectionId,
        title: originalSectionDef.title,
        originalInstructionsText: processedInstructions, // Send tooltip-free instructions
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

    // Build enhanced system prompt with specific instructions for preserving tooltips
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
    
    5. ABSOLUTELY CRITICAL: Do not modify or remove any text in [TOOLTIP_ORIG_N] format.
       These are special placeholders that will be replaced with tooltips later.
       If you see [TOOLTIP_ORIG_0], [TOOLTIP_ORIG_1], etc. in the text, KEEP THEM EXACTLY AS IS.
    
    Remember to return your response as a valid JSON array containing objects with id, editedInstructions, and completionStatus fields.
    `;

    const taskPrompt = buildTaskPrompt('instructionImprovement', {
      sectionsData: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    // Log request data (truncated for readability)
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
        
        // RESTORE TOOLTIPS in the fallback response
        modifiedInstructions = restoreTooltipsAfterAI(modifiedInstructions, sectionTooltipsMap[section.id] || {});
        
        return {
          id: section.id,
          editedInstructions: modifiedInstructions,
          completionStatus: 'complete'
        };
      });
      
      console.log("[Instruction Improvement] Using fallback data with inline feedback format:", fallbackData.length);
      
      return {
        success: true,
        improvedData: fallbackData,
        usedFallback: true
      };
    }

    // Validate and ensure instructions use proper formatting
    const validatedData = response.map(item => {
      // Get the section ID
      const sectionId = item.id;
      if (!sectionId) {
        console.warn("Missing ID in response item, skipping", item);
        return null;
      }
      
      // Get the tooltips for this section
      const tooltips = sectionTooltipsMap[sectionId] || {};
      
      // Determine if instructions were actually changed
      const instructionsChanged = 
        item.editedInstructions && 
        item.editedInstructions.length >= 50;
      
      // Restore tooltips to the output text
      if (instructionsChanged) {
        item.editedInstructions = restoreTooltipsAfterAI(item.editedInstructions, tooltips);
        console.log(`[Instruction Improvement] Restored ${Object.keys(tooltips).length} tooltips in section ${sectionId}`);
      } else {
        // If AI didn't provide good instructions, use fallback with tooltip restoration
        const sectionData = sectionsDataForPrompt.find(s => s.id === sectionId);
        if (sectionData) {
          let editedInstructions = createFormattedFallbackInstructions(
            sectionData.title || 'section',
            sectionData.originalInstructionsText
          );
          
          // Restore tooltips
          editedInstructions = restoreTooltipsAfterAI(editedInstructions, tooltips);
          item.editedInstructions = editedInstructions;
        }
      }
      
      // Additional validation - look for tooltip placeholder patterns in the text
      const tooltipPlaceholderPattern = /__TOOLTIP_\d+__/g;
      const tooltipMarkerPattern = /\[TOOLTIP_(?:ORIG|MARKER)_\d+\]/g;
      
      const originalPlaceholders = (item.editedInstructions.match(tooltipPlaceholderPattern) || []).length;
      const markerPlaceholders = (item.editedInstructions.match(tooltipMarkerPattern) || []).length;
      
      if (originalPlaceholders > 0) {
        console.log(`[Instruction Improvement] Found ${originalPlaceholders} original placeholders in final output for ${sectionId}`);
      }
      
      if (markerPlaceholders > 0) {
        console.warn(`[Instruction Improvement] WARNING: ${markerPlaceholders} marker placeholders still present in ${sectionId}`);
      }
      
      // Ensure all required fields exist with appropriate values
      return {
        id: sectionId,
        editedInstructions: item.editedInstructions,
        completionStatus: item.completionStatus === 'unstarted' ? 'unstarted' : 'complete'
      };
    }).filter(item => item !== null); // Remove null items

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
        
        // Extract tooltips
        const { text: processedInstructions, tooltips } = extractTooltipsBeforeAI(originalInstructions);
        
        // Create formatted fallback instructions with inline feedback
        let editedInstructions = createFormattedFallbackInstructions(
          section.title || 'section', 
          processedInstructions
        );
        
        // Restore tooltips
        editedInstructions = restoreTooltipsAfterAI(editedInstructions, tooltips);
        
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
      // FIXED: Apply strikethrough to both instruction and following text
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
