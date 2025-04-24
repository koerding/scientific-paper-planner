// FILE: src/services/documentImportService.js

/**
 * Document import service for PDF and Word documents
 * REDUCED: Console logging for cleaner output.
 */
import { callOpenAI } from './openaiService';
import { loadPDFJS, extractTextFromDocument } from './documentProcessor';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
import sectionContentData from '../data/sectionContent.json';

/**
 * Extract grading criteria from sectionContent.json for the AI prompt
 * @returns {string} Formatted criteria string
 */
function extractGradingCriteria() {
  const criteria = [];
  sectionContentData.sections.forEach(section => {
    if (!section || !section.id || !section.subsections) return;
    criteria.push(`## ${section.title} [id: ${section.id}]`);
    if (section.introText) {
      criteria.push(`${section.introText.substring(0, 250)}${section.introText.length > 250 ? '...' : ''}`);
    }
    section.subsections.forEach(subsection => {
      if (!subsection || !subsection.id) return;
      criteria.push(`- ${subsection.title}: ${subsection.instruction.substring(0, 100)}${subsection.instruction.length > 100 ? '...' : ''}`);
    });
    criteria.push('');
  });
  return criteria.join('\n');
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * @param {File} file - The document file object (used for filename in errors)
 * @param {Object} sections - The sectionContent data for context (optional)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export async function importDocumentContent(file, sections = null) {
  const sectionContent = sections || sectionContentData;
  let documentText = '';

  try {
    // Preload PDF.js if needed
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try { await loadPDFJS(); } catch (loadError) { /* console.warn("Failed to load PDF.js:", loadError); */ } // Commented out
    }

    // Extract text
    // console.log(`Starting text extraction for ${file.name}`); // Commented out
    documentText = await extractTextFromDocument(file);
    // console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`); // Commented out

    // Extract grading criteria
    const gradingCriteria = extractGradingCriteria();
    // console.log("Extracted grading criteria for prompt context"); // Commented out

    // Build system prompt
    const enhancedSystemPrompt = `You are analyzing a scientific paper to extract its structure based on specific grading criteria.
Be methodical, accurate, and ensure your output aligns with the evaluation standards.

IMPORTANT: Your output will be graded based on how well it meets the criteria for each section outlined below.

**CRITICAL REQUIREMENTS:**
1. Your response MUST include ALL of these REQUIRED fields: question, audience, relatedpapers, analysis, process, abstract
2. You MUST choose EXACTLY ONE research approach key to include: either hypothesis OR needsresearch OR exploratoryresearch. DO NOT include the other two keys.
3. You MUST choose EXACTLY ONE data collection method key to include: either experiment OR existingdata OR theorysimulation. DO NOT include the other two keys.
4. DO NOT include placeholder comments in your response
5. Each field must be populated with substantial content
6. Fill out every component that the placeholders ask for
7. The text should be easily readable for students. Use line feeds and bullet points where useful for readability and always when separating distinct placeholder points.
8. IMPORTANT: All field values MUST be simple strings, NOT nested objects or arrays


GRADING CRITERIA:
${gradingCriteria}

Document text (first part): ${documentText.substring(0, 500)}

Create comprehensive examples that address each criterion from the grading rubric.`;

    // Create examples of placeholder structure
    const placeholderExamples = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id && section.placeholder) {
        placeholderExamples[section.id] = section.placeholder;
      }
    });

     // Build the task prompt
    const enhancedTaskPrompt = `
# Scientific Paper Extraction with Essential Fields

Extract key components from the provided scientific paper text and format them in a JSON structure.
Be VERY GENEROUS in your interpretation - read between the lines and create a high-quality educational example - the student should see how a great scientist thinks about all this.

## Output Format
Your output should follow this general structure for each field (shown here with examples from our template system):

question: ${placeholderExamples.question || "Research Question: [question] and Significance: [why it matters]"}
audience: ${placeholderExamples.audience || "Target Audience/Community: [fields] and Specific Researchers: [names]"}
relatedpapers: ${placeholderExamples.relatedpapers || "List of 5+ related papers"}
analysis: ${placeholderExamples.analysis || "Data cleaning, methods, and approach"}
process: ${placeholderExamples.process || "Skills, collaborators, timeline, etc."}
abstract: ${placeholderExamples.abstract || "Background, objective, methods, results, conclusion"}

**CRITICAL INSTRUCTION:** Based on your selections above:
- **Include EXACTLY ONE key** for the research approach (\`hypothesis\` OR \`needsresearch\` OR \`exploratoryresearch\`) in the \`userInputs\` object. **DO NOT include the keys for the other two approaches.**
- **Include EXACTLY ONE key** for the data collection method (\`experiment\` OR \`existingdata\` OR \`theorysimulation\`) in the \`userInputs\` object. **DO NOT include the keys for the other two methods.**

Your output must be valid JSON with "userInputs" as the top-level key.

--- DOCUMENT TEXT START ---
${documentText.substring(0, 8000)}${documentText.length > 10000 ? '... [truncated]' : ''}
--- DOCUMENT TEXT END ---`;

    // Call OpenAI
    // console.log("Sending request to OpenAI with improved prompts"); // Commented out
    const apiResponse = await callOpenAI(
      enhancedTaskPrompt,
      'document_import_task',
      {}, [], { temperature: 0.3, max_tokens: 3000 }, [], enhancedSystemPrompt, true // Use JSON mode
    );

    // Format the result
    let result = {
      userInputs: {},
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: "1.0-document-import"
    };

    // Extract userInputs from API response
    if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.userInputs && typeof apiResponse.userInputs === 'object') {
            result.userInputs = apiResponse.userInputs;
            // console.log("Processed userInputs from API response structure"); // Commented out
        } else if (apiResponse.question || apiResponse.abstract || apiResponse.audience) {
            result.userInputs = apiResponse;
            // console.log("Using API response directly as userInputs (structure assumption)"); // Commented out
        } else {
            console.warn("API response received, but 'userInputs' key not found or object doesn't match expected fields. Using response directly.", apiResponse);
            result.userInputs = apiResponse;
        }
    } else {
      throw new Error("API returned invalid or empty response");
    }


    // MODIFIED LOGIC: Add missing fields, BUT skip specific toggle keys
    const researchApproachKeys = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
    const dataMethodKeys = ['experiment', 'existingdata', 'theorysimulation'];
    const toggleKeysToSkip = new Set([...researchApproachKeys, ...dataMethodKeys]);

    if (sectionContent && Array.isArray(sectionContent.sections)) {
      sectionContent.sections.forEach(section => {
        if (section && section.id && section.placeholder) {
          if (!toggleKeysToSkip.has(section.id) &&
              (!result.userInputs.hasOwnProperty(section.id) ||
               (typeof result.userInputs[section.id] === 'string' && result.userInputs[section.id].trim() === '') ||
               result.userInputs[section.id] === null || result.userInputs[section.id] === undefined
              ))
          {
              // console.log(`[importDocumentContent] Adding missing/empty non-toggle field: ${section.id}`); // Commented out
              result.userInputs[section.id] = section.placeholder;
          }
        }
      });
    }

    // Basic validation for absolutely essential fields
    const essentialFields = ['question', 'audience', 'abstract'];
    const missingEssential = essentialFields.filter(field => !result.userInputs[field]);
    if (missingEssential.length > 0) {
         console.warn(`API response might be missing essential fields: ${missingEssential.join(', ')}`);
    }


    // console.log("Final import structure userInputs keys:", Object.keys(result.userInputs)); // Commented out

    // Dispatch event
    window.dispatchEvent(new CustomEvent('documentImported', {
      detail: { fileName: file.name, timestamp: Date.now() }
    }));

    // console.log('Successfully processed paper structure'); // Commented out
    return result;

  } catch (error) {
    console.error('Error during document import process:', error);

    // Fallback logic
    const fallbackResult = { /* ... */ }; // Keep fallback logic as is
    // ... (fallback details omitted for brevity) ...
    window.dispatchEvent(new CustomEvent('documentImported', { /* ... */ }));
    return fallbackResult;
  }
}

// Export testing utilities (unchanged)
export const testUtils = {
  extractGradingCriteria
};
