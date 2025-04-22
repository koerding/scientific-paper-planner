// FILE: src/services/documentImportService.js

/**
 * Document import service for PDF and Word documents
 * UPDATED: Now uses the refactored documentProcessor
 */
import { callOpenAI } from './openaiService';
import { loadPDFJS, extractTextFromDocument } from './documentProcessor';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
import { initializeSectionStates } from './sectionStateService';
import sectionContentData from '../data/sectionContent.json';

/**
 * Extract grading criteria from sectionContent.json for the AI prompt
 * @returns {string} Formatted criteria string
 */
function extractGradingCriteria() {
  const criteria = [];
  
  sectionContentData.sections.forEach(section => {
    if (!section || !section.id || !section.subsections) return;
    
    // Add section title
    criteria.push(`## ${section.title} [id: ${section.id}]`);
    
    // Add intro text if available
    if (section.introText) {
      criteria.push(`${section.introText.substring(0, 250)}${section.introText.length > 250 ? '...' : ''}`);
    }
    
    // Add subsection criteria
    section.subsections.forEach(subsection => {
      if (!subsection || !subsection.id) return;
      criteria.push(`- ${subsection.title}: ${subsection.instruction.substring(0, 100)}${subsection.instruction.length > 100 ? '...' : ''}`);
    });
    
    criteria.push(''); // Add a blank line between sections
  });
  
  const criteriaStr = criteria.join('\n');
  
  // Log the full criteria to the console for inspection
  console.log("GRADING CRITERIA FOR IMPORT:");
  console.log(criteriaStr);
  
  return criteriaStr;
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * @param {File} file - The document file object (used for filename in errors)
 * @param {Object} sections - The sectionContent data for context (optional)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export async function importDocumentContent(file, sections = null) {
  // Ensure we have the section content data (either passed in or from import)
  const sectionContent = sections || sectionContentData;
  let documentText = '';
  
  try {
    // Preload PDF.js if needed for PDF files
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try { await loadPDFJS(); } catch (loadError) { console.warn("Failed to load PDF.js:", loadError); }
    }

    // Extract text using the dedicated document processor
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Extract grading criteria
    const gradingCriteria = extractGradingCriteria();
    console.log("Extracted grading criteria for prompt context");
    console.log("GRADING CRITERIA LENGTH:", gradingCriteria.length, "characters");

    // Build improved system prompt with clear requirements
    const enhancedSystemPrompt = `You are analyzing a scientific paper to extract its structure based on specific grading criteria. 
Be methodical, accurate, and ensure your output aligns with the evaluation standards.

IMPORTANT: Your output will be graded based on how well it meets the criteria for each section outlined below.

**CRITICAL REQUIREMENTS:**
1. Your response MUST include ALL of these REQUIRED fields: question, audience, hypothesis, relatedpapers, analysis, process, abstract
2. You MUST choose EXACTLY ONE research approach: either hypothesis OR needsresearch OR exploratoryresearch
3. You MUST choose EXACTLY ONE data collection method: either experiment OR existingdata OR theorysimulation
4. DO NOT include placeholder comments in your response
5. Each field must be populated with substantial content
6. Fill out every component that the placeholders ask for
7. The text should be easily readable for students. Use line feeds and bullet points where useful for readability and always when separating distinct placeholder points.
8. IMPORTANT: All field values MUST be simple strings, NOT nested objects or arrays


GRADING CRITERIA:
${gradingCriteria}

Document text (first part): ${documentText.substring(0, 500)}

Create comprehensive examples that address each criterion from the grading rubric.`;

    // Create examples of placeholder structure from sectionContent.json
    const placeholderExamples = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id && section.placeholder) {
        placeholderExamples[section.id] = section.placeholder;
      }
    });

    // Build the enhanced task prompt with placeholder examples
    const enhancedTaskPrompt = `
# Scientific Paper Extraction with Essential Fields

Extract key components from the provided scientific paper text and format them in a JSON structure.
Be VERY GENEROUS in your interpretation - read between the lines and create a high-quality educational example - the student should see how a great scientist thinks about all this.

## Output Format
Your output should follow this general structure for each field (shown here with examples from our template system):

question: ${placeholderExamples.question || "Research Question: [question] and Significance: [why it matters]"}
audience: ${placeholderExamples.audience || "Target Audience/Community: [fields] and Specific Researchers: [names]"}
hypothesis: ${placeholderExamples.hypothesis || "Hypothesis 1: [hypothesis] and Hypothesis 2: [alternative]"}
relatedpapers: ${placeholderExamples.relatedpapers || "List of 5+ related papers"}
analysis: ${placeholderExamples.analysis || "Data cleaning, methods, and approach"}
process: ${placeholderExamples.process || "Skills, collaborators, timeline, etc."}
abstract: ${placeholderExamples.abstract || "Background, objective, methods, results, conclusion"}

For data methods, choose ONE of:
experiment: ${placeholderExamples.experiment || "Variables, sample, procedures, etc."}
existingdata: ${placeholderExamples.existingdata || "Dataset source, variables, quality, etc."}
theorysimulation: ${placeholderExamples.theorysimulation || "Assumptions, framework, validation, etc."}

Your output must be valid JSON with "userInputs" as the top-level key.

--- DOCUMENT TEXT START ---
${documentText.substring(0, 8000)}${documentText.length > 10000 ? '... [truncated]' : ''}
--- DOCUMENT TEXT END ---`;

    // Call OpenAI with improved prompts
    console.log("Sending request to OpenAI with improved prompts");
    const apiResponse = await callOpenAI(
      enhancedTaskPrompt,
      'document_import_task',
      {}, [], { temperature: 0.3, max_tokens: 3000 }, [], enhancedSystemPrompt, true // Use JSON mode
    );

    // Format the result correctly
    let result = {
      userInputs: {},
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: "1.0-document-import"
    };
    
    // Check if we have a valid API response and extract userInputs
    if (apiResponse && typeof apiResponse === 'object') {
      // If the API just returned userInputs directly
      if (apiResponse.userInputs && typeof apiResponse.userInputs === 'object') {
        result.userInputs = apiResponse.userInputs;
        console.log("Processed userInputs from API response structure");
      } 
      // If the API returned some other format, try to use it directly
      else if (Object.keys(apiResponse).length > 0) {
        // Look for common fields to determine if this is already a userInputs object
        if (apiResponse.question || apiResponse.abstract || apiResponse.audience) {
          result.userInputs = apiResponse;
          console.log("Using API response directly as userInputs");
        } else {
          // Last resort: treat the entire response as userInputs
          result.userInputs = apiResponse;
          console.log("Using entire API response as userInputs (fallback)");
        }
      }
      else {
        throw new Error("API returned invalid response format");
      }
    } else {
      throw new Error("API returned invalid or empty response");
    }
    
    // Validate that we have at least basic required fields
    const validateFields = ['question', 'audience', 'abstract'];
    const missingRequiredFields = validateFields.filter(field => 
      !result.userInputs[field] || typeof result.userInputs[field] !== 'string' || 
      result.userInputs[field].trim() === ''
    );
    
    if (missingRequiredFields.length > 0) {
      console.error("Missing required fields in API response:", missingRequiredFields);
      throw new Error(`API response missing required fields: ${missingRequiredFields.join(', ')}`);
    }
    
    // Add any missing fields from templates
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id && section.placeholder && 
            (!result.userInputs[section.id] || result.userInputs[section.id].trim() === '')) {
          result.userInputs[section.id] = section.placeholder;
        }
      });
    }

    console.log("Final import structure with userInputs:", 
                Object.keys(result.userInputs).length, "fields");
    
    // IMPORTANT: Initialize all sections as expanded for examples from PDF
    // This ensures the user can see all the content immediately
    console.log("Setting ALL sections to expanded state for imported document");
    initializeSectionStates(false); // false = expand all sections (not minimized)
    
    // Also dispatch a custom event to notify components about the import
    window.dispatchEvent(new CustomEvent('documentImported', {
      detail: {
        fileName: file.name,
        timestamp: Date.now(),
        expandAllSections: true // Flag indicating all sections should be expanded
      }
    }));

    console.log('Successfully processed paper structure');
    return result;

  } catch (error) {
    console.error('Error during document import process:', error);
    
    // Create a fallback result if there was an error
    const fallbackResult = {
      userInputs: {},
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: "1.0-import-fallback"
    };
    
    // Fill with template data from sectionContent
    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id && section.placeholder) {
          // Use a modified placeholder that indicates this is fallback data
          fallbackResult.userInputs[section.id] = `[Imported from ${file.name}]\n\n${section.placeholder}`;
        }
      });
    }
    
    // Add a basic project structure based on the filename
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const formattedName = fileName
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
    
    // Add some derived content
    fallbackResult.userInputs.question = `Research Question: How does ${formattedName} affect research outcomes?\n\nSignificance/Impact: Understanding the impact of ${formattedName} could lead to improved methodologies.`;
    fallbackResult.userInputs.audience = `Target Audience/Community:\n1. Researchers in the field of ${formattedName}\n2. Policy makers\n3. Practitioners`;
    
    // Initialize all sections as expanded even for fallback data
    console.log("Setting all sections to expanded state for fallback import");
    initializeSectionStates(false); // false = expand all sections
    
    // Dispatch an event for the fallback case too
    window.dispatchEvent(new CustomEvent('documentImported', {
      detail: {
        fileName: file.name,
        timestamp: Date.now(),
        expandAllSections: true,
        isFallback: true
      }
    }));
    
    return fallbackResult;
  }
}

// Export testing utilities
export const testUtils = {
  extractGradingCriteria
};
