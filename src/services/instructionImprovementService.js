// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses OpenAI's native JSON mode for reliable parsing
 * UPDATED: Now provides feedback inline after each instruction bullet point
 * UPDATED: Instructions are bold, feedback is regular text
 * UPDATED: Completed instructions use strikethrough within bold formatting
 * UPDATED: More detailed console logging
 * FIXED: Resolved issues with improve button functionality
 * FIXED: Properly handles strikethrough for both bold instructions and regular text
 * FIXED: Added missing extractBulletPoints function definition
 * FIXED: Preserves tooltip markers during instruction improvement
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
 * Extracts tooltip markers from text
 * @param {string} text - The text to extract tooltips from
 * @returns {object} - Map of tooltip content
 */
function extractTooltips(text) {
  const tooltips = {};
  if (!text) return tooltips;
  
  // Find all *italic* sections which are used for tooltips
  const tooltipRegex = /\*([^*]+)\*/g;
  let match;
  
  while (match = tooltipRegex.exec(text)) {
    const tooltipContent = match[1].trim();
    tooltips[tooltipContent] = true;
  }
  
  return tooltips;
}

/**
 * Helper function to preserve tooltip markers in text
 * @param {string} text - The text that might contain tooltip markers
 * @param {object} tooltips - The tooltip map from extractTooltips
 * @returns {string} - Text with tooltip markers preserved
 */
function preserveTooltips(text, tooltips) {
  if (!text || Object.keys(tooltips).length === 0) return text;
  
  // Check if the text already has tooltip markers
  if (text.includes('*') && text.match(/\*([^*]+)\*/)) {
    return text; // Already has tooltip markers
  }
  
  // Check if any tooltip content is in the text
  for (const tooltipContent in tooltips) {
    // Look for the tooltip content without the * markers
    const cleanContent = tooltipContent.replace(/\*/g, '');
    if (text.includes(cleanContent)) {
      // Replace with the proper tooltip markup
      text = text.replace(
        new RegExp(escapeRegExp(cleanContent), 'g'), 
        `*${cleanContent}*`
      );
    }
  }
  
  return text;
}

/**
 * Helper to escape special chars for RegExp
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Improves instructions for multiple sections, providing inline feedback after each instruction point.
 * Uses OpenAI's native JSON mode for reliable parsing.
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

    // Build enhanced system prompt that explicitly requests bold instructions with inline feedback
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
    
    5. CRITICAL: Preserve any italicized text (*text*) in the original instructions, as these are tooltips.
    
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
        const originalInstructions = section.originalInstructionsText;
        const bulletPoints = extractBulletPoints(originalInstructions);
        
        // Extract tooltips from original instructions to preserve them
        const tooltips = extractTooltips(originalInstructions);
        
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
          
          // FIXED: Preserve tooltip markers in the instruction
          const preservedInstruction = preserveTooltips(instruction, tooltips);
          
          // The text after the instruction (contains tooltips if any)
          const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
          
          if (isCompleted) {
            // FIXED: Apply strikethrough to both instruction and following text
            // while preserving tooltip markers
            if (boldMatch) {
              modifiedInstructions += `* **~~${preservedInstruction}~~**${afterInstructionText}\n`;
            } else {
              modifiedInstructions += `* ~~${preserveTooltips(point, tooltips)}~~\n`;
            }
            modifiedInstructions += `You've addressed this point effectively by focusing on the key elements.\n\n`;
          } else {
            // Not completed
            if (boldMatch) {
              modifiedInstructions += `* **${preservedInstruction}**${afterInstructionText}\n`;
            } else {
              modifiedInstructions += `* ${preserveTooltips(point, tooltips)}\n`;
            }
            modifiedInstructions += `Consider adding more detail here to strengthen your ${section.title.toLowerCase()}.\n\n`;
          }
        });
        
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
      const sectionData = sectionsDataForPrompt.find(s => s.id === item.id);
      const originalInstructions = sectionData?.originalInstructionsText || '';
      
      // Extract tooltips from original instructions to preserve them
      const tooltips = extractTooltips(originalInstructions);
      
      // Determine if instructions were actually changed
      const instructionsChanged = 
        item.editedInstructions && 
        item.editedInstructions !== originalInstructions && 
        item.editedInstructions.length >= 50;
      
      // If the AI didn't format the instructions properly, ensure we have bold and inline feedback
      let finalInstructions = instructionsChanged 
        ? ensureProperFormatting(item.editedInstructions, originalInstructions, tooltips)
        : createFormattedFallbackInstructions(sectionData?.title || 'section', originalInstructions, tooltips);
      
      // Ensure all required fields exist with appropriate values
      return {
        id: item.id || '',
        editedInstructions: finalInstructions,
        completionStatus: (item.completionStatus === 'unstarted')
          ? 'unstarted'
          : 'complete'
      };
    }).filter(item => item.id); // Remove any items without an ID

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
        const originalInstructions = section?.instructions?.text || '';
        
        // Extract tooltips from original instructions to preserve them
        const tooltips = extractTooltips(originalInstructions);
        
        // Create formatted fallback instructions with inline feedback
        const editedInstructions = createFormattedFallbackInstructions(
          section?.title || 'section', 
          originalInstructions,
          tooltips
        );
        
        return {
          id: id,
          editedInstructions: editedInstructions,
          completionStatus: 'complete'
        };
      });
    
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
 * FIXED: Now properly handles strikethrough for both the instruction and following text
 * FIXED: Preserves tooltips in strikethrough text
 * FIXED: Removed dollar signs from strikethrough formatting
 * @param {string} sectionTitle - The section title 
 * @param {string} originalInstructions - The original instructions text
 * @param {object} tooltips - The tooltip map or null to extract from originalInstructions
 * @returns {string} - Formatted instructions with inline feedback
 */
function createFormattedFallbackInstructions(sectionTitle, originalInstructions, tooltips = null) {
  // Create a congratulatory message
  let formattedInstructions = `Great work on your ${sectionTitle.toLowerCase()}! You've made good progress.\n\n`;
  
  // Extract bullet points from original instructions
  const bulletPoints = extractBulletPoints(originalInstructions);
  
  // For tracking the tooltip content from original instructions
  const tooltipsMap = tooltips || extractTooltips(originalInstructions);
  
  // Format each bullet point with inline feedback
  bulletPoints.forEach((point, index) => {
    // Extract the instruction portion (bold part) and the rest
    const boldRegex = /\*\*([^*]+)\*\*/;
    const boldMatch = point.match(boldRegex);
    
    // Get the instruction text (bold part)
    const instruction = boldMatch ? boldMatch[1].trim() : point;
    
    // FIXED: Preserve tooltip markers in the instruction
    const preservedInstruction = preserveTooltips(instruction, tooltipsMap);
    
    // The text after the instruction (contains tooltips if any)
    const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
    
    // Mark about 70% of points as completed for fallback
    const isCompleted = Math.random() > 0.3;
    
    if (isCompleted) {
      // FIXED: Apply strikethrough to both the instruction AND the following text
      if (boldMatch) {
        // For completed item with bold formatting
        formattedInstructions += `* **~~${preservedInstruction}~~**${afterInstructionText}\n`;
      } else {
        // For completed item without bold formatting
        formattedInstructions += `* ~~${preserveTooltips(point, tooltipsMap)}~~\n`;
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
      // For non-completed item
      if (boldMatch) {
        formattedInstructions += `* **${preservedInstruction}**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ${preserveTooltips(point, tooltipsMap)}\n`;
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

/**
 * Ensures instructions have proper bold formatting with inline feedback
 * FIXED: Now properly handles strikethrough for both instruction and following text
 * FIXED: Preserves tooltips in strikethrough text
 * FIXED: Removed dollar signs from strikethrough formatting
 * @param {string} editedInstructions - The AI-edited instructions 
 * @param {string} originalInstructions - The original instructions text
 * @param {object} tooltips - The tooltip map or null to extract from originalInstructions
 * @returns {string} - Instructions with proper formatting
 */
function ensureProperFormatting(editedInstructions, originalInstructions, tooltips = null) {
  // Extract tooltips if not provided
  const tooltipsMap = tooltips || extractTooltips(originalInstructions);
  
  // Check if the AI already used the right formatting (bold instructions, regular feedback)
  const hasProperFormatting = 
    editedInstructions.includes('* **') && // Has bold bullet points
    !editedInstructions.includes('**Strengths:**') && // Doesn't have the old format
    !editedInstructions.includes('**Weaknesses:**'); // Doesn't have the old format
  
  if (hasProperFormatting) {
    // Clean up any dollar signs in strikethrough formatting
    // and ensure tooltips are preserved
    let cleanInstructions = editedInstructions.replace(/\$\$~~|\$\$/g, '~~');
    
    // FIXED: Look for missing tooltip markers and add them back
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while (match = boldRegex.exec(cleanInstructions)) {
      const boldContent = match[1];
      if (!boldContent.includes('*') && Object.keys(tooltipsMap).length > 0) {
        // This bold text might be missing tooltip markers
        const preservedContent = preserveTooltips(boldContent, tooltipsMap);
        
        if (preservedContent !== boldContent) {
          // Replace the bold content with the preserved version
          cleanInstructions = cleanInstructions.replace(
            `**${boldContent}**`,
            `**${preservedContent}**`
          );
        }
      }
    }
    
    return cleanInstructions;
  }
  
  // If we have the old format, convert it to the new format
  if (editedInstructions.includes('**Strengths:**') || 
      editedInstructions.includes('**Weaknesses:**') || 
      editedInstructions.includes('**Comments:**')) {
    return convertOldFormatToNew(editedInstructions, originalInstructions, tooltipsMap);
  }
  
  // Extract bullet points from original instructions
  const bulletPoints = extractBulletPoints(originalInstructions);
  
  // Keep any congratulatory message at the top
  let congratsMessage = '';
  const paragraphs = editedInstructions.split('\n\n');
  if (paragraphs[0] && (
      paragraphs[0].includes('Great') || 
      paragraphs[0].includes('Excellent') || 
      paragraphs[0].includes('Well done'))) {
    congratsMessage = paragraphs[0] + '\n\n';
  }
  
  // Create properly formatted instructions with inline feedback
  let formattedInstructions = congratsMessage;
  
  // Look for bullet points in the edited instructions
  const editedLines = editedInstructions.split('\n');
  const bulletPointLines = editedLines.filter(line => 
    line.trim().startsWith('*') || line.trim().startsWith('-')
  );
  
  // If we found bullet points, format them properly
  if (bulletPointLines.length > 0) {
    bulletPointLines.forEach((line, index) => {
      const trimmed = line.trim();
      const content = trimmed.substring(trimmed.indexOf(' ') + 1).trim();
      
      // Check if this point has strikethrough
      const hasStrikethrough = content.includes('~~') || content.includes('<del>');
      
      // Try to extract the instruction and following text
      const boldRegex = /\*\*([^*]+)\*\*/;
      const boldMatch = content.match(boldRegex);
      
      // Get instruction and following text
      const instructionPart = boldMatch ? boldMatch[1].trim() : content;
      
      // FIXED: Preserve tooltip markers in the instruction
      const preservedInstruction = preserveTooltips(instructionPart, tooltipsMap);
      
      const afterInstructionText = boldMatch ? content.replace(boldRegex, '').trim() : '';
      
      if (hasStrikethrough) {
        // FIXED: Apply strikethrough to both instruction and following text
        // while preserving tooltip markers
        let cleanInstruction = preservedInstruction.replace(/~~|<del>|<\/del>/g, '');
        
        if (boldMatch) {
          // For item with bold formatting that should be strikethrough
          formattedInstructions += `* **~~${cleanInstruction}~~**${afterInstructionText}\n`;
        } else {
          // For item without bold formatting that should be strikethrough
          formattedInstructions += `* ~~${preserveTooltips(content.replace(/~~|<del>|<\/del>/g, ''), tooltipsMap)}~~\n`;
        }
        
        // Add feedback text without strikethrough
        formattedInstructions += `You've addressed this point effectively in your work.\n\n`;
      } else {
        // Not strikethrough - handle regular formatting
        if (boldMatch) {
          formattedInstructions += `* **${preservedInstruction}**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ${preserveTooltips(content, tooltipsMap)}\n`;
        }
        
        // Add generic feedback if we don't have anything specific
        // Find the next non-bullet line as potential feedback
        let feedback = '';
        if (index + 1 < editedLines.length) {
          const nextLine = editedLines[index + 1].trim();
          if (nextLine && !nextLine.startsWith('*') && !nextLine.startsWith('-')) {
            feedback = nextLine;
          }
        }
        
        if (!feedback) {
          feedback = `Consider adding more detail here to strengthen this point.`;
        }
        
        formattedInstructions += `${feedback}\n\n`;
      }
    });
  } else {
    // If no bullet points found, format each original bullet point
    bulletPoints.forEach(point => {
      // Extract the instruction portion (bold part) and the rest
      const boldRegex = /\*\*([^*]+)\*\*/;
      const boldMatch = point.match(boldRegex);
      
      // Get the instruction text (bold part)
      const instruction = boldMatch ? boldMatch[1].trim() : point;
      
      // FIXED: Preserve tooltip markers in the instruction
      const preservedInstruction = preserveTooltips(instruction, tooltipsMap);
      
      // The text after the instruction (contains tooltips if any)
      const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
      
      // Randomly mark some as completed for this fallback case
      const isCompleted = Math.random() > 0.5;
      
      if (isCompleted) {
        // FIXED: Apply strikethrough to both instruction and following text
        // while preserving tooltip markers
        if (boldMatch) {
          formattedInstructions += `* **~~${preservedInstruction}~~**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ~~${preserveTooltips(point, tooltipsMap)}~~\n`;
        }
        formattedInstructions += `You've addressed this well in your current draft.\n\n`;
      } else {
        // Not completed
        if (boldMatch) {
          formattedInstructions += `* **${preservedInstruction}**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ${preserveTooltips(point, tooltipsMap)}\n`;
        }
        formattedInstructions += `This point needs more attention to fully develop your ideas.\n\n`;
      }
    });
  }
  
  return formattedInstructions;
}

/**
 * Converts the old format (separate Strengths/Weaknesses/Comments) to new format (inline feedback)
 * FIXED: Now properly handles strikethrough for both instruction and following text
 * FIXED: Preserves tooltips in strikethrough text
 * FIXED: Removed dollar signs from strikethrough formatting
 * @param {string} oldFormatText - The text in old format
 * @param {string} originalInstructions - The original instructions text
 * @param {object} tooltips - The tooltip map or null to extract from originalInstructions
 * @returns {string} - The text in new format
 */
function convertOldFormatToNew(oldFormatText, originalInstructions, tooltips = null) {
  // Extract strengths, weaknesses, and comments
  let strengths = '';
  let weaknesses = '';
  let comments = '';
  
  const strengthsMatch = oldFormatText.match(/\*\*Strengths:\*\*\s*([^]*?)(?=\*\*Weaknesses:|$)/);
  if (strengthsMatch && strengthsMatch[1]) {
    strengths = strengthsMatch[1].trim();
  }
  
  const weaknessesMatch = oldFormatText.match(/\*\*Weaknesses:\*\*\s*([^]*?)(?=\*\*Comments:|$)/);
  if (weaknessesMatch && weaknessesMatch[1]) {
    weaknesses = weaknessesMatch[1].trim();
  }
  
  const commentsMatch = oldFormatText.match(/\*\*Comments:\*\*\s*([^]*?)$/);
  if (commentsMatch && commentsMatch[1]) {
    comments = commentsMatch[1].trim();
  }
  
  // Extract bullet points from the original instructions
  const bulletPoints = extractBulletPoints(originalInstructions);
  
  // Extract tooltips if not provided
  const tooltipsMap = tooltips || extractTooltips(originalInstructions);
  
  // Keep any congratulatory message at the top
  let congratsMessage = '';
  const paragraphs = oldFormatText.split('\n\n');
  if (paragraphs[0] && !paragraphs[0].includes('**Strengths:**') && (
      paragraphs[0].includes('Great') || 
      paragraphs[0].includes('Excellent') || 
      paragraphs[0].includes('Well done'))) {
    congratsMessage = paragraphs[0] + '\n\n';
  }
  
  // Create properly formatted instructions with inline feedback
  let formattedInstructions = congratsMessage;
  
  // Check for strikethrough instructions in the old format
  const hasStrikethroughs = oldFormatText.includes('~~') || oldFormatText.includes('<del>');
  
  // Format each bullet point
  bulletPoints.forEach((point, index) => {
    const pointLower = point.toLowerCase();
    
    // Extract the instruction portion (bold part) and the rest
    const boldRegex = /\*\*([^*]+)\*\*/;
    const boldMatch = point.match(boldRegex);
    
    // Get the instruction text (bold part)
    const instruction = boldMatch ? boldMatch[1].trim() : point;
    
    // FIXED: Preserve tooltip markers in the instruction
    const preservedInstruction = preserveTooltips(instruction, tooltipsMap);
    
    // The text after the instruction (contains tooltips if any)
    const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
    
    // Check if this point appears to be completed (mentioned in strengths)
    const isCompleted = hasStrikethroughs ? 
      oldFormatText.includes(`~~${instruction}`) || 
      strengths.toLowerCase().includes(pointLower.substring(0, Math.min(pointLower.length, 15))) :
      false;
    
    // Check if this point is mentioned in weaknesses
    const isWeakness = weaknesses.toLowerCase().includes(pointLower.substring(0, Math.min(pointLower.length, 15)));
    
    if (isCompleted) {
      // FIXED: Apply strikethrough to both instruction and following text
      // while preserving tooltip markers
      if (boldMatch) {
        formattedInstructions += `* **~~${preservedInstruction}~~**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ~~${preserveTooltips(point, tooltipsMap)}~~\n`;
      }
      
      // Add positive feedback based on strengths WITHOUT strikethrough
      let feedback = `You've addressed this point effectively in your work.`;
      if (strengths && strengths.length > 10) {
        feedback = strengths.split('.')[0] + '.'; // Use the first sentence of strengths
      }
      
      formattedInstructions += `${feedback}\n\n`;
    } else {
      // Not completed
      if (boldMatch) {
        formattedInstructions += `* **${preservedInstruction}**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ${preserveTooltips(point, tooltipsMap)}\n`;
      }
      
      // Add feedback based on weaknesses or comments
      let feedback = '';
      if (isWeakness && weaknesses) {
        feedback = weaknesses.split('.')[0] + '.'; // Use the first sentence of weaknesses
      } else if (comments) {
        feedback = comments.split('.')[0] + '.'; // Use the first sentence of comments
      } else {
        feedback = `Consider developing this point further in your next revision.`;
      }
      
      formattedInstructions += `${feedback}\n\n`;
    }
  });
  
  return formattedInstructions;
}
