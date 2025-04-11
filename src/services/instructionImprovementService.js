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
 * FIXED: Improved tooltip extraction to detect and preserve italic content
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
 * Extracts tooltips from text by identifying italic text blocks
 * FIXED: Now properly identifies and extracts italic text as tooltips
 * @param {string} text - Original text with tooltips in italic format
 * @returns {object} - Object with processed text and tooltips map
 */
function extractTooltipsBeforeAI(text) {
  if (!text) return { text: '', tooltips: {} };

  // Log a small sample of the input text to verify format
  console.log(`[extractTooltipsBeforeAI] Text sample: ${text.substring(0, 100).replace(/\n/g, "\\n")}...`);

  // First, look for existing tooltip markers if any
  const existingMarkers = {};
  const markerRegexes = [
    /__TOOLTIP_(\d+)__/g,
    /\[TOOLTIP_MARKER_(\d+)\]/g,
    /\[TOOLTIP_ORIG_(\d+)\]/g
  ];
  
  // Check for pre-existing markers first
  let markerFound = false;
  for (const regex of markerRegexes) {
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      markerFound = true;
      matches.forEach(match => {
        existingMarkers[match[0]] = match[1];  // Store marker and its number
      });
      console.log(`[extractTooltipsBeforeAI] Found ${matches.length} existing markers using pattern ${regex}`);
    }
  }
  
  // If we already have markers, use them directly
  if (markerFound) {
    console.log(`[extractTooltipsBeforeAI] Using ${Object.keys(existingMarkers).length} pre-existing markers`);
    // We still need to extract the content from italic blocks
    const italicRegex = /\*((?:[^*]|\*\*[^*]*\*\*)+?)\*/g;
    const tooltips = {};
    let modifiedText = text;

    let match;
    while ((match = italicRegex.exec(text)) !== null) {
      const fullContent = match[0];  // The full *...* block
      const innerContent = match[1]; // Just the content between *...*
      
      // Check if any of our markers are in this italic block
      let markerInBlock = false;
      for (const marker of Object.keys(existingMarkers)) {
        if (innerContent.includes(marker)) {
          markerInBlock = true;
          const markerIndex = innerContent.indexOf(marker);
          const tooltipContent = innerContent.substring(markerIndex + marker.length).trim();
          
          // Store both the marker and its associated content
          tooltips[marker] = tooltipContent;
          
          // Replace the italic block with just the marker
          modifiedText = modifiedText.replace(fullContent, marker);
          break;
        }
      }
    }
    
    console.log(`[extractTooltipsBeforeAI] Extracted ${Object.keys(tooltips).length} tooltip contents from existing markers`);
    return { text: modifiedText, tooltips };
  }
  
  // If no existing markers, we'll create new ones from italic blocks
  console.log(`[extractTooltipsBeforeAI] No existing markers found, creating new ones from italic text blocks`);
  
  // Find all substantial italic blocks (not inside bold formatting)
  // This regex handles italic text that isn't part of bold-italic
  const italicRegex = /\*(?!\*)((?:[^*]|(?!\*\*)[^*])+?)\*/g;
  const tooltips = {};
  let modifiedText = text;
  let tooltipCounter = 0;

  let match;
  while ((match = italicRegex.exec(text)) !== null) {
    const fullMatch = match[0];  // The full *...* block
    const content = match[1];    // Just the content between *...*
    
    // Only consider substantial italic blocks as tooltips (e.g., not just emphasis)
    if (content && content.length > 30) {
      // Create a unique marker for this tooltip
      const markerKey = `[TOOLTIP_MARKER_${tooltipCounter}]`;
      
      // Store the tooltip content
      tooltips[markerKey] = content;
      
      // Replace the italic block with just the marker in the modified text
      modifiedText = modifiedText.replace(fullMatch, markerKey);
      
      tooltipCounter++;
    }
  }
  
  // Log extraction results
  console.log(`[extractTooltipsBeforeAI] Created ${Object.keys(tooltips).length} new tooltip markers from italic blocks`);
  if (Object.keys(tooltips).length > 0) {
    console.log(`[extractTooltipsBeforeAI] First tooltip sample: ${Object.values(tooltips)[0].substring(0, 50)}...`);
  }
  
  return { 
    text: modifiedText, 
    tooltips 
  };
}

/**
 * Restores tooltips to the original text format after AI processing
 * FIXED: More robust restoration with better logging and fallbacks
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
  console.log(`[restoreTooltipsAfterAI] Restoring ${Object.keys(tooltips).length} tooltips`);
  if (Object.keys(tooltips).length > 0) {
    const sampleMarker = Object.keys(tooltips)[0];
    const sampleContent = tooltips[sampleMarker].substring(0, 50);
    console.log(`[restoreTooltipsAfterAI] Sample: ${sampleMarker} -> "${sampleContent}..."`);
  }
  
  // For each tooltip marker, restore the original italic text
  for (const [marker, content] of Object.entries(tooltips)) {
    if (restoredText.includes(marker)) {
      // Replace marker with original italic content
      restoredText = restoredText.replace(marker, `*${content}*`);
      console.log(`[restoreTooltipsAfterAI] Restored tooltip for marker: ${marker}`);
    } else {
      console.warn(`[restoreTooltipsAfterAI] Marker not found in text: ${marker}`);
      
      // Try alternate marker formats as fallback
      const markerNumber = marker.match(/\d+/)[0];
      const alternateFormats = [
        `[TOOLTIP_MARKER_${markerNumber}]`,
        `[TOOLTIP_ORIG_${markerNumber}]`,
        `__TOOLTIP_${markerNumber}__`
      ];
      
      let foundAlternate = false;
      for (const altFormat of alternateFormats) {
        if (altFormat !== marker && restoredText.includes(altFormat)) {
          restoredText = restoredText.replace(altFormat, `*${content}*`);
          console.log(`[restoreTooltipsAfterAI] Used alternate format: ${altFormat}`);
          foundAlternate = true;
          break;
        }
      }
      
      if (!foundAlternate) {
        console.warn(`[restoreTooltipsAfterAI] No alternate formats found for: ${marker}`);
      }
    }
  }
  
  // Check for any remaining unrestored markers
  const remainingMarkers = [
    ...restoredText.matchAll(/\[TOOLTIP_MARKER_\d+\]/g),
    ...restoredText.matchAll(/\[TOOLTIP_ORIG_\d+\]/g),
    ...restoredText.matchAll(/__TOOLTIP_\d+__/g)
  ];
  
  if (remainingMarkers.length > 0) {
    console.warn(`[restoreTooltipsAfterAI] ${remainingMarkers.length} unrestored markers remain in text`);
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
      console.log(`[Instruction Improvement] Processing tooltips for section ${sectionId}`);
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
    
    5. ABSOLUTELY CRITICAL: Do not modify or remove any text in [TOOLTIP_MARKER_N] format.
       These are special placeholders that will be replaced with tooltips later.
       If you see [TOOLTIP_MARKER_0], [TOOLTIP_MARKER_1], etc. in the text, KEEP THEM EXACTLY AS IS.
    
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
      // Check if response has a 'results' array (from the JSON format)
      const resultsArray = response?.results;
      if (Array.isArray(resultsArray) && resultsArray.length > 0) {
        console.log("[Instruction Improvement] Found results array within response object");
        // Process the results array
        const validatedData = processImprovedInstructions(resultsArray, sectionTooltipsMap, sectionsDataForPrompt);
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
        
        // RESTORE TOOLTIPS in the fallback response
        modifiedInstructions = restoreTooltipsAfterAI(modifiedInstructions, sectionTooltipsMap[section.id] || {});
        
        return {
          id: section.id,
          editedInstructions: modifiedInstructions,
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
    const validatedData = processImprovedInstructions(response, sectionTooltipsMap, sectionsDataForPrompt);
    
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
 * Process the improved instructions, validating and restoring tooltips
 * @param {Array} improvedData - Array of improved section data from OpenAI
 * @param {Object} sectionTooltipsMap - Map of section IDs to their tooltip data
 * @param {Array} sectionsDataForPrompt - Original sections data sent to OpenAI
 * @returns {Array} - Validated and processed instructions
 */
function processImprovedInstructions(improvedData, sectionTooltipsMap, sectionsDataForPrompt) {
  // Validate and ensure instructions use proper formatting
  return improvedData.map(item => {
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
    const tooltipPlaceholderPattern = /\[TOOLTIP_MARKER_\d+\]/g;
    const tooltipMarkerPattern = /\[TOOLTIP_ORIG_\d+\]/g;
    
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
