// FILE: src/services/instructionImprovementService.js

/**
 * Modern service for improving instructions based on user progress
 * Uses LangChain and Zod for reliable parsing and validation
 */
import { z } from 'zod';
import { LangChain, ChatOpenAI, StructuredOutputParser } from 'langchain/chat_models';
import { PromptTemplate } from 'langchain/prompts';
import { callOpenAI } from './openaiService';
import { isResearchApproachSection, buildSystemPrompt } from '../utils/promptUtils';

// Define the Zod schema for instruction improvement items
const ImprovedInstructionItemSchema = z.object({
  id: z.string(),
  editedInstructions: z.string().min(50), 
  feedback: z.string().min(10),
  completionStatus: z.enum(["complete", "unstarted"])
});

// Schema for the entire array response
const ImprovedInstructionsArraySchema = z.array(ImprovedInstructionItemSchema);

/**
 * Improves instructions for multiple sections, separating instructions and feedback.
 * Uses LangChain and Zod for reliable parsing and validation.
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

    // Step 1: Create a parser with our Zod schema
    const parser = StructuredOutputParser.fromZodSchema(ImprovedInstructionsArraySchema);
    
    // Get the format instructions
    const formatInstructions = parser.getFormatInstructions();

    // Step 2: Build system prompt
    const systemPrompt = buildSystemPrompt('instructionImprovement', {
      needsResearchContext: needsOverallResearchContext,
      approachGuidance: ''
    });

    // Step 3: Create prompt template
    const promptTemplate = new PromptTemplate({
      template: `
        You are providing feedback on a student's scientific paper plan, with expertise in formatting precise, valid JSON.
        
        Your response MUST match this format exactly:
        {format_instructions}
        
        For each section, provide:
        1. Edited Instructions: Remove points the user has already addressed. If they've addressed all key points, provide a congratulatory message.
        2. Feedback: Brief, constructive feedback noting strengths, weaknesses, and suggestions.
        3. Completion Status: ONLY use "complete" or "unstarted" as values.
        
        Here are the sections to improve:
        {sections_data}
      `,
      inputVariables: ["sections_data"],
      partialVariables: { format_instructions: formatInstructions }
    });

    // Step 4: Create ChatOpenAI instance
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0.2,
    });

    // Step 5: Create and invoke the chain
    const chain = promptTemplate.pipe(model).pipe(parser);
    
    const improvedData = await chain.invoke({
      sections_data: JSON.stringify(sectionsDataForPrompt, null, 2)
    });

    console.log(`[Instruction Improvement] Successfully parsed ${improvedData.length} improved sections with LangChain and Zod`);

    // Return success with the validated data
    return {
      success: true,
      improvedData
    };
    
  } catch (error) {
    console.error("Error improving batch instructions:", error);
    
    // Alternative approach using direct OpenAI JSON mode if LangChain fails
    try {
      console.log("[Instruction Improvement] Falling back to direct OpenAI JSON mode...");
      
      // Identify sections with meaningful user content
      const sectionsWithProgress = Object.keys(userInputs).filter(sectionId => {
        const content = userInputs[sectionId];
        const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
        const placeholder = originalSectionDef?.placeholder || '';
        
        return typeof content === 'string' && content.trim() !== '' && content !== placeholder;
      });
      
      if (sectionsWithProgress.length === 0) {
        return { success: false, message: "No sections with progress to improve" };
      }
      
      // Prepare data for analysis
      const sectionsDataForPrompt = sectionsWithProgress.map(sectionId => {
        const originalSectionDef = sectionContent?.sections?.find(s => s.id === sectionId);
        if (!originalSectionDef || !originalSectionDef.instructions?.text) {
          return null;
        }
        
        return {
          id: sectionId,
          title: originalSectionDef.title,
          originalInstructionsText: originalSectionDef.instructions.text,
          userContent: userInputs[sectionId] || ''
        };
      }).filter(data => data !== null);
      
      // Call OpenAI directly with JSON mode
      const systemPrompt = `
        You are providing feedback on a student's scientific paper plan.
        You MUST respond with a valid JSON array of objects.
        Each object MUST have these fields:
        - "id": string - The section ID
        - "editedInstructions": string - Edited instructions (min 50 chars)
        - "feedback": string - Constructive feedback (min 10 chars)
        - "completionStatus": string - ONLY "complete" or "unstarted"
      `;
      
      const prompt = `
        For each section, provide:
        1. Edited Instructions: Remove points the user has already addressed or provide a congratulatory message.
        2. Feedback: Brief, constructive feedback noting strengths, weaknesses, and suggestions.
        3. Completion Status: "complete" or "unstarted" based on quality.
        
        Sections to improve: ${JSON.stringify(sectionsDataForPrompt, null, 2)}
      `;
      
      const response = await callOpenAI(
        prompt,
        "improve_instructions_batch",
        userInputs,
        currentSections,
        { temperature: 0.2 },
        [],
        systemPrompt,
        true // Use JSON mode
      );
      
      // Validate response
      const validation = ImprovedInstructionsArraySchema.safeParse(response);
      if (!validation.success) {
        console.error("JSON validation failed:", validation.error);
        return { success: false, message: "Failed to validate API response structure" };
      }
      
      return {
        success: true,
        improvedData: validation.data
      };
      
    } catch (fallbackError) {
      console.error("Fallback approach also failed:", fallbackError);
      return {
        success: false,
        message: error.message || "An error occurred while improving instructions"
      };
    }
  }
};

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
  
  // These are known placeholder patterns to reject
  const PLACEHOLDER_PATTERNS = [
    "Remove points",
    "addressed all key points",
    "remove points the user has already addressed",
    "congratulatory message"
  ];

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

    // Store original instructions for debugging
    const originalInstructions = section.instructions.text || '';
    
    // Helper to check if text is a placeholder
    const isPlaceholder = (text) => {
      if (!text || text.trim() === '') return true;
      if (text.length < 50) return true; // Too short to be real instructions
      
      // Check for known placeholder phrases
      return PLACEHOLDER_PATTERNS.some(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      );
    };
    
    // Check editedInstructions
    const newInstructions = improvement.editedInstructions;
    if (!isPlaceholder(newInstructions)) {
      // Only update if we have meaningful content that's not a placeholder
      section.instructions.text = newInstructions;
      console.log(`[updateSectionWithImprovedInstructions] Updated instructions for ${improvement.id} (${newInstructions.length} chars)`);
      changesApplied = true;
    } else {
      // Log warning about placeholder and keep original
      console.warn(`[updateSectionWithImprovedInstructions] Detected placeholder text for ${improvement.id}: "${newInstructions?.substring(0, 50)}..." - keeping original instructions`);
      
      // Keep original instructions
      // If the original is also empty, use some default text
      if (!originalInstructions || originalInstructions.trim() === '') {
        const defaultInstructions = `A good ${section.title} helps you focus your research effort and clearly communicate your intentions.`;
        section.instructions.text = defaultInstructions;
        console.log(`[updateSectionWithImprovedInstructions] Using default instructions for ${improvement.id}`);
        changesApplied = true;
      }
    }

    // Update feedback only if it's provided and meaningful
    if (improvement.feedback && improvement.feedback.trim() !== '' && improvement.feedback.length > 20) {
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
