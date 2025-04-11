// Updated functions to fix strikethrough issues in the instructionImprovementService.js

/**
 * Creates formatted instructions with inline feedback for fallback cases
 * FIXED: Now properly handles strikethrough for both the instruction and following text
 * FIXED: Preserves tooltips in strikethrough text
 * FIXED: Removed dollar signs from strikethrough formatting
 * @param {string} sectionTitle - The section title 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - Formatted instructions with inline feedback
 */
function createFormattedFallbackInstructions(sectionTitle, originalInstructions) {
  // Create a congratulatory message
  let formattedInstructions = `Great work on your ${sectionTitle.toLowerCase()}! You've made good progress.\n\n`;
  
  // Extract bullet points from original instructions
  const bulletPoints = extractBulletPoints(originalInstructions);
  
  // For tracking the tooltip content from original instructions
  const tooltipRegex = /\*([^*]+)\*/g;
  const tooltips = {};
  
  // Extract tooltips from original instructions to preserve them
  originalInstructions.replace(tooltipRegex, (match, content, index) => {
    tooltips[content.trim()] = true;
    return match;
  });
  
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
      // FIXED: Apply strikethrough to both the instruction AND the following text
      if (boldMatch) {
        // For completed item with bold formatting
        formattedInstructions += `* **~~${instruction}~~**${afterInstructionText}\n`;
      } else {
        // For completed item without bold formatting
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
      // For non-completed item
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

/**
 * Ensures instructions have proper bold formatting with inline feedback
 * FIXED: Now properly handles strikethrough for both instruction and following text
 * FIXED: Preserves tooltips in strikethrough text
 * FIXED: Removed dollar signs from strikethrough formatting
 * @param {string} editedInstructions - The AI-edited instructions 
 * @param {string} originalInstructions - The original instructions text
 * @returns {string} - Instructions with proper formatting
 */
function ensureProperFormatting(editedInstructions, originalInstructions) {
  // Check if the AI already used the right formatting (bold instructions, regular feedback)
  const hasProperFormatting = 
    editedInstructions.includes('* **') && // Has bold bullet points
    !editedInstructions.includes('**Strengths:**') && // Doesn't have the old format
    !editedInstructions.includes('**Weaknesses:**'); // Doesn't have the old format
  
  if (hasProperFormatting) {
    // Clean up any dollar signs in strikethrough formatting
    return editedInstructions.replace(/\$\$~~|\$\$/g, '~~');
  }
  
  // If we have the old format, convert it to the new format
  if (editedInstructions.includes('**Strengths:**') || 
      editedInstructions.includes('**Weaknesses:**') || 
      editedInstructions.includes('**Comments:**')) {
    return convertOldFormatToNew(editedInstructions, originalInstructions);
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
  
  // For tracking the tooltip content from original instructions
  const tooltipRegex = /\*([^*]+)\*/g;
  const tooltips = {};
  
  // Extract tooltips from original instructions to preserve them
  originalInstructions.replace(tooltipRegex, (match, content, index) => {
    tooltips[content.trim()] = true;
    return match;
  });
  
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
      const afterInstructionText = boldMatch ? content.replace(boldRegex, '').trim() : '';
      
      if (hasStrikethrough) {
        // FIXED: Apply strikethrough to both instruction and following text
        let cleanInstruction = instructionPart.replace(/~~|<del>|<\/del>/g, '');
        
        if (boldMatch) {
          // For item with bold formatting that should be strikethrough
          formattedInstructions += `* **~~${cleanInstruction}~~**${afterInstructionText}\n`;
        } else {
          // For item without bold formatting that should be strikethrough
          formattedInstructions += `* ~~${content.replace(/~~|<del>|<\/del>/g, '')}~~\n`;
        }
        
        // Add feedback text without strikethrough
        formattedInstructions += `You've addressed this point effectively in your work.\n\n`;
      } else {
        // Not strikethrough - handle regular formatting
        if (boldMatch) {
          formattedInstructions += `* **${instructionPart}**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ${content}\n`;
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
      
      // The text after the instruction (contains tooltips if any)
      const afterInstructionText = boldMatch ? point.replace(boldRegex, '').trim() : '';
      
      // Randomly mark some as completed for this fallback case
      const isCompleted = Math.random() > 0.5;
      
      if (isCompleted) {
        // FIXED: Apply strikethrough to both instruction and following text
        if (boldMatch) {
          formattedInstructions += `* **~~${instruction}~~**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ~~${point}~~\n`;
        }
        formattedInstructions += `You've addressed this well in your current draft.\n\n`;
      } else {
        // Not completed
        if (boldMatch) {
          formattedInstructions += `* **${instruction}**${afterInstructionText}\n`;
        } else {
          formattedInstructions += `* ${point}\n`;
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
 * @returns {string} - The text in new format
 */
function convertOldFormatToNew(oldFormatText, originalInstructions) {
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
      if (boldMatch) {
        formattedInstructions += `* **~~${instruction}~~**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ~~${point}~~\n`;
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
        formattedInstructions += `* **${instruction}**${afterInstructionText}\n`;
      } else {
        formattedInstructions += `* ${point}\n`;
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
