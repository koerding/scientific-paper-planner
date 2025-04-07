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
