// FILE: src/services/documentImportService.js
// Fixed: Escaped backslashes in documentText before embedding in template literal.
// MODIFIED: Prevent adding missing toggle section placeholders during import

/**
 * Document import service for PDF and Word documents
 * UPDATED: Now uses the refactored documentProcessor
 * UPDATED: Removed import from deleted sectionStateService
 */
import { callOpenAI } from './openaiService';
import { loadPDFJS, extractTextFromDocument } from './documentProcessor';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
// REMOVED: import { initializeSectionStates } from './sectionStateService';
import sectionContentData from '../data/sectionContent.json';
import { getApproachSectionIds, getDataMethodSectionIds } from '../utils/sectionOrderUtils'; // Import toggle IDs

/**
 * Extract grading criteria from sectionContent.json for the AI prompt
 * @returns {string} Formatted criteria string
 */
function extractGradingCriteria() {
  // ... (function remains the same) ...
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
  const criteriaStr = criteria.join('\n');
  return criteriaStr;
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
      try { await loadPDFJS(); } catch (loadError) { console.warn("Failed to load PDF.js:", loadError); }
    }

    // Extract text
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Extract grading criteria
    const gradingCriteria = extractGradingCriteria();
    console.log("Extracted grading criteria for prompt context");

    // Build prompts (enhancedSystemPrompt, enhancedTaskPrompt remain the same)
    const enhancedSystemPrompt = `You are analyzing a scientific paper to extract its structure based on specific grading criteria. Be methodical, accurate, and ensure your output aligns with the evaluation standards. IMPORTANT: Your output will be graded based on how well it meets the criteria for each section outlined below. **CRITICAL REQUIREMENTS:** 1. Your response MUST include ALL of these REQUIRED fields: question, audience, hypothesis, relatedpapers, analysis, process, abstract 2. You MUST choose EXACTLY ONE research approach: either hypothesis OR needsresearch OR exploratoryresearch 3. You MUST choose EXACTLY ONE data collection method: either experiment OR existingdata OR theorysimulation 4. DO NOT include placeholder comments in your response 5. Each field must be populated with substantial content 6. Fill out every component that the placeholders ask for 7. The text should be easily readable for masters students. Use line feeds and bullet points where useful for readability and always when separating distinct placeholder points. 8. IMPORTANT: All field values MUST be simple strings, NOT nested objects or arrays GRADING CRITERIA:\n${gradingCriteria}\n\nDocument text (first part): ${documentText.substring(0, 500)}\n\nCreate comprehensive examples that address each criterion from the grading rubric.`;
    const placeholderExamples = {};
    sectionContent.sections.forEach(section => { if (section && section.id && section.placeholder) { placeholderExamples[section.id] = section.placeholder; } });
    const escapedDocumentText = (documentText || '').replace(/\\/g, '\\\\');
    const enhancedTaskPrompt = `# Scientific Paper Extraction with Essential Fields\n\nExtract key components from the provided scientific paper text and format them in a JSON structure. Be VERY GENEROUS in your interpretation - read between the lines and create a high-quality educational example - the user should see how a great scientist thinks about all this.\n\n## Output Format\nYour output should follow this general structure for each field (shown here with examples from our template system):\n\nquestion: ${placeholderExamples.question || "..."}\naudience: ${placeholderExamples.audience || "..."}\nhypothesis: ${placeholderExamples.hypothesis || "..."}\nrelatedpapers: ${placeholderExamples.relatedpapers || "..."}\nanalysis: ${placeholderExamples.analysis || "..."}\nprocess: ${placeholderExamples.process || "..."}\nabstract: ${placeholderExamples.abstract || "..."}\n\nFor data methods, choose ONE of:\nexperiment: ${placeholderExamples.experiment || "..."}\nexistingdata: ${placeholderExamples.existingdata || "..."}\ntheorysimulation: ${placeholderExamples.theorysimulation || "..."}\n\nYour output must be valid JSON with "userInputs" as the top-level key.\n\n--- DOCUMENT TEXT START ---\n${escapedDocumentText.substring(0, 8000)}${escapedDocumentText.length > 10000 ? '... [truncated]' : ''}\n--- DOCUMENT TEXT END ---`;


    // Call OpenAI
    console.log("Sending request to OpenAI with improved prompts");
    const apiResponse = await callOpenAI(
      enhancedTaskPrompt, 'document_import_task', {}, [],
      { temperature: 0.3, max_tokens: 3000 }, [], enhancedSystemPrompt, true
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
         console.log("Processed userInputs from API response structure");
       } else if (Object.keys(apiResponse).length > 0 && (apiResponse.question || apiResponse.abstract || apiResponse.audience)) {
         result.userInputs = apiResponse;
         console.log("Using API response directly as userInputs");
       } else {
          result.userInputs = apiResponse; // Fallback, might be risky
          console.log("Using entire API response as userInputs (fallback)");
       }
     } else {
       throw new Error("API returned invalid or empty response");
     }

     // Validate required fields
     const validateFields = ['question', 'audience', 'abstract']; // Basic required fields
     const missingRequiredFields = validateFields.filter(field =>
       !result.userInputs[field] || typeof result.userInputs[field] !== 'string' ||
       result.userInputs[field].trim() === ''
     );

     if (missingRequiredFields.length > 0) {
       console.warn("API response missing some non-critical required fields:", missingRequiredFields);
       // Decide if this is an error or just needs placeholders added
       // For now, let's allow it but add placeholders below.
       // throw new Error(`API response missing required fields: ${missingRequiredFields.join(', ')}`);
     }

     // --- MODIFIED: Add missing fields logic ---
     const approachIds = getApproachSectionIds();
     const dataMethodIds = getDataMethodSectionIds();
     const allToggleIds = [...approachIds, ...dataMethodIds];

     if (sectionContent && Array.isArray(sectionContent.sections)) {
       sectionContent.sections.forEach(section => {
         const sectionId = section?.id;
         if (!sectionId || !section.placeholder) return; // Skip if no ID or placeholder

         // Check if the field is missing or empty in the AI response
         const isMissingOrEmpty = !result.userInputs.hasOwnProperty(sectionId) ||
                                  typeof result.userInputs[sectionId] !== 'string' ||
                                  result.userInputs[sectionId].trim() === '';

         if (isMissingOrEmpty) {
           // Only add placeholder if it's NOT a toggle field
           if (!allToggleIds.includes(sectionId)) {
              console.log(`DEBUG: Adding placeholder for missing non-toggle field: ${sectionId}`);
              result.userInputs[sectionId] = section.placeholder;
           } else {
              console.log(`DEBUG: Skipping placeholder for missing toggle field: ${sectionId}`);
           }
         }
       });
     }
     // --- END MODIFIED ---


     console.log("Final import structure with userInputs:", Object.keys(result.userInputs).length, "fields");

     // Dispatch event
     window.dispatchEvent(new CustomEvent('documentImported', {
       detail: { fileName: file.name, timestamp: Date.now() }
     }));

     console.log('Successfully processed paper structure');
     return result;

   } catch (error) {
     console.error('Error during document import process:', error);
     // Fallback result generation (remains the same)
     const fallbackResult = { /* ... */ };
     if (sectionContent && Array.isArray(sectionContent.sections)) { /* ... */ }
     // ... generate fallback based on filename ...
     window.dispatchEvent(new CustomEvent('documentImported', { /* ... */ }));
     return fallbackResult;
   }
}

// Export testing utilities (remains the same)
export const testUtils = {
  extractGradingCriteria
};
