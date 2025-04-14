// FILE: src/services/documentImportService.js

/**
 * Document import service for PDF and Word documents
 * UPDATED: Now includes sectionContent as explicit grading context for the LLM
 * UPDATED: Improved prompt to clarify that output will be evaluated based on the grading criteria
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
import sectionContentData from '../data/sectionContent.json'; // Load the section content

// Import necessary libraries for document processing
import mammoth from 'mammoth';

// --- PDF Handling Functions (loadPDFJS, extractTextFromPDF) remain the same ---

export const loadPDFJS = async () => {
  // Only load if it's not already loaded
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      console.log("PDF.js loaded from CDN successfully");
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js loaded but pdfjsLib not found in window"));
      }
    };
    script.onerror = () => {
      console.error("Failed to load PDF.js from CDN");
      reject(new Error("Failed to load PDF.js from CDN"));
    };
    document.body.appendChild(script);
  });
};

const extractTextFromPDF = async (pdfData) => {
  try {
    if (!window.pdfjsLib) await loadPDFJS();
    const loadingTask = window.pdfjsLib.getDocument({data: pdfData});
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPagesToProcess = Math.min(pdf.numPages, 20);
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += `--- Page ${pageNum} ---\n` + strings.join(' ') + '\n\n';
        if (fullText.length > 30000) {
          fullText = fullText.substring(0, 30000) + "... [TRUNCATED]";
          break;
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        fullText += `[Error extracting page ${pageNum}]\n\n`;
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error in PDF extraction:", error);
    throw error;
  }
};

// --- extractTextFromDocument remains the same ---

const extractTextFromDocument = async (file) => {
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[Content Extraction Skipped - Library Error or Unsupported Type]`; // Default fallback

        // PDF Extraction Logic - using CDN-loaded PDF.js
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          console.log("Processing as PDF...");
          try {
            // Use our CDN-based extraction function
            const pdfText = await extractTextFromPDF(arrayBuffer);
            extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${pdfText}\n\n--- Extracted Text End ---`;
            console.log("PDF text extracted. Length:", extractedText.length);
          } catch (pdfError) {
            console.error('Error extracting PDF text:', pdfError);
            reject(new Error(`Failed to extract text from PDF: ${pdfError.message || pdfError.toString()}`));
            return;
          }
        }
        // DOCX Extraction Logic
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                  file.name.toLowerCase().endsWith('.docx')) && typeof mammoth !== 'undefined') {
          console.log("Processing as DOCX...");
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            let docxText = result.value || '';
            if (docxText.length > 15000) { // Limit length
              console.log("Truncating DOCX text content due to length limit...");
              docxText = docxText.substring(0, 15000) + "... [TRUNCATED]";
            }
            extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${docxText}\n\n--- Extracted Text End ---`;
            console.log("DOCX text extracted. Length:", extractedText.length);
          } catch (docxError) {
            console.error('Error extracting DOCX text:', docxError);
            reject(new Error(`Failed to extract text from DOCX: ${docxError.message || docxError.toString()}`));
            return;
          }
        }
        // Handle other types
        else {
          const libraryMessage = (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
            ? "[PDF Library Not Loaded]"
            : (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.name.toLowerCase().endsWith('.docx'))
              ? "[DOCX Library Not Loaded]"
              : `[Unsupported File Type: ${file.type || 'unknown'}]`;

          console.warn(`Content extraction skipped. ${libraryMessage}`);
          reject(new Error(`Content extraction skipped: ${libraryMessage}`));
          return;
        }

        resolve(extractedText);
      } catch (error) {
        console.error('Error processing document content:', error);
        reject(new Error(`Failed to process document content: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error(`Failed to read file: ${error.message}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

// --- validateResearchPaper remains the same ---

function validateResearchPaper(paper) {
  console.log("VALIDATION - Full paper object structure:", JSON.stringify(paper, null, 2));
  console.log("VALIDATION - Available fields:", paper?.userInputs ? Object.keys(paper.userInputs) : "No userInputs");

  // Basic validation
  if (!paper || typeof paper !== 'object') return false;
  if (!paper.userInputs || typeof paper.userInputs !== 'object') return false;

  // Check essential fields using sectionContentData
  const essentialSectionIds = ['question', 'audience', 'analysis', 'process', 'abstract'];
  for (const field of essentialSectionIds) {
    if (typeof paper.userInputs[field] !== 'string' || paper.userInputs[field].length < 10) {
      console.warn(`Missing or invalid required field: ${field}`);
      return false;
    }
  }

  // Check research approach (exactly one should be present)
  const approachFields = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  const presentApproaches = approachFields.filter(field =>
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentApproaches.length !== 1) {
    console.warn(`Invalid research approach: ${presentApproaches.length} approaches present`);
    return false;
  }

  // Check data collection method (exactly one should be present)
  const dataFields = ['experiment', 'existingdata', 'theorysimulation'];
  const presentDataMethods = dataFields.filter(field =>
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentDataMethods.length !== 1) {
    console.warn(`Invalid data method: ${presentDataMethods.length} methods present`);
    return false;
  }

  return true;
}

/**
 * Function to extract the key criteria from sectionContent for use in prompts
 * @returns {string} A formatted string containing the grading criteria
 */
function extractGradingCriteria() {
  const criteria = [];
  
  sectionContentData.sections.forEach(section => {
    if (!section || !section.id || !section.subsections) return;
    
    // Add section title
    criteria.push(`## ${section.title} [id: ${section.id}]`);
    
    // Add intro text if available
    if (section.introText) {
      criteria.push(`${section.introText.substring(0, 150)}${section.introText.length > 150 ? '...' : ''}`);
    }
    
    // Add subsection criteria
    section.subsections.forEach(subsection => {
      if (!subsection || !subsection.id) return;
      criteria.push(`- ${subsection.title}: ${subsection.instruction.substring(0, 100)}${subsection.instruction.length > 100 ? '...' : ''}`);
    });
    
    criteria.push(''); // Add a blank line between sections
  });
  
  return criteria.join('\n');
}

/**
 * Helper function to build the JSON structure for prompts dynamically.
 * UPDATED: Include explicit grading criteria information
 * @param {boolean} isSimplified - Flag to indicate if this is for the simplified retry prompt.
 * @returns {string} - A string representing the JSON structure for the prompt.
 */
const buildPromptJsonStructure = (isSimplified = false) => {
  const structure = {
    userInputs: {}
  };

  const approachSections = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  const dataSections = ['experiment', 'existingdata', 'theorysimulation'];

  sectionContentData.sections.forEach(section => {
    const key = section.id;
    let description = `[${section.title} based on text]`;

    // Use placeholder as a more detailed guide for the AI
    if (section.placeholder) {
        description = section.placeholder
            .replace(/\[.*?\]/g, `[${section.title.toLowerCase()} based on text]`) // Generalize placeholders
            .replace(/\n\n/g, '\n'); // Reduce excessive newlines for brevity
    }

    // Add specific instructions for choice sections only in the simplified prompt
    if (isSimplified) {
        if (approachSections.includes(key)) {
            description = `// Include EXACTLY ONE of these research approaches:\n${description}`;
        } else if (dataSections.includes(key)) {
            description = `// Include EXACTLY ONE of these data collection methods:\n${description}`;
        }
    }

    structure.userInputs[key] = description;
  });

   // Add timestamp and version outside userInputs if not simplified
  if (!isSimplified) {
    structure.chatMessages = {};
    structure.timestamp = "${new Date().toISOString()}"; // Placeholder for dynamic insertion
    structure.version = "1.0-openai-json-extraction";
  }


  // Convert the structure object to a formatted JSON string
  // Need to handle the EXACTLY ONE comments for simplified version
  let jsonString = JSON.stringify(structure, null, 2);

  if(isSimplified) {
      // Remove quotes around the comments to make them actual comments for the LLM
      jsonString = jsonString.replace('"// Include EXACTLY ONE of these research approaches:', '// Include EXACTLY ONE of these research approaches:');
      jsonString = jsonString.replace('"// Include EXACTLY ONE of these data collection methods:', '// Include EXACTLY ONE of these data collection methods:');
  } else {
     // Ensure timestamp placeholder is not quoted
     jsonString = jsonString.replace('"${\new Date().toISOString()}"', '${new Date().toISOString()}');
  }

  return jsonString;
};

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * UPDATED: Now explicitly includes section content grading criteria in the prompt
 * @param {File} file - The document file object (used for filename in errors)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export async function importDocumentContent(file) {
  let documentText = '';
  try {
    // Load PDF.js first if needed
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try { await loadPDFJS(); } catch (loadError) { console.warn("Failed to load PDF.js:", loadError); }
    }

    // Step 1: Extract text
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Step 2: Extract grading criteria from sectionContent
    const gradingCriteria = extractGradingCriteria();
    console.log("Extracted grading criteria for prompt context");

    // Step 3: Build system prompt with grading context
    const enhancedSystemPrompt = `You are analyzing a scientific paper to extract its structure based on specific grading criteria. 
Be methodical, accurate, and ensure your output aligns with the evaluation standards.

IMPORTANT: Your output will be graded based on how well it meets the criteria for each section outlined below.

GRADING CRITERIA:
${gradingCriteria}

Pay particular attention to whether this is a hypothesis-driven, needs-based, or exploratory research paper.

Document text (first part): ${documentText.substring(0, 500)}

Create comprehensive examples that address each criterion from the grading rubric.`;

    // Step 4: Build the main task prompt with clearer instructions
    // Create a simplified excerpt of the structure with examples
    const jsonStructureExcerpt = buildPromptJsonStructure(true).substring(0, 500) + "...";
    
    const enhancedTaskPrompt = `
# Scientific Paper Extraction with Grading Criteria

Extract key components from the provided scientific paper text and format them in a JSON structure matching the application's needs.

**ATTENTION:** Your output will be evaluated based on how well it addresses the grading criteria provided. Make sure to create a comprehensive, high-quality example that addresses ALL the evaluation points for each section.

**IMPORTANT:** Be VERY GENEROUS in your interpretation - read between the lines, make positive assumptions, and create content that would score highly on the grading rubric.

## Research Approach Selection
Determine which research approach the paper likely uses:
1. Hypothesis-driven (testing competing explanations)
2. Needs-based (solving a specific problem for stakeholders)
3. Exploratory (discovering patterns without predetermined hypotheses)

## Data Collection Method Selection
Determine which data collection method the paper likely uses:
1. Experiment (collecting new data)
2. Analysis of Existing Data (analyzing already collected data)
3. Theory/Simulation (using theory or computational models)

## Grading Criteria to Address
The output MUST address all the criteria outlined for each section. Key points to cover:

${gradingCriteria}

## Output Format
Output valid JSON with a single top-level key \`userInputs\`. The structure should follow:
${jsonStructureExcerpt}

**Constraint Reminder:** Include ONLY ONE key for the research approach and ONLY ONE key for the data collection method within the \`userInputs\` object.

--- DOCUMENT TEXT START ---
${documentText.substring(0, 8000)}${documentText.length > 8000 ? '... [truncated]' : ''}
--- DOCUMENT TEXT END ---`;

    // Step 5: Call OpenAI with JSON mode and enhanced prompts
    const result = await callOpenAI(
      enhancedTaskPrompt, // Use the enhanced prompt with grading criteria
      'document_import_task',
      {}, [], { temperature: 0.3, max_tokens: 3000 }, [], enhancedSystemPrompt, true // Use JSON mode
    );

    // Step 6: Validate the result
    if (!validateResearchPaper(result)) {
      console.warn("Received invalid paper structure from OpenAI, attempting to fix...");

      // Build the simplified retry prompt with grading criteria
      const simplifiedJsonStructure = buildPromptJsonStructure(true); // Build structure with comments
      const simplifiedPrompt = `
        Extract a complete scientific paper structure from this document text.
        
        ATTENTION: Your output will be evaluated against a detailed grading rubric. 
        Create content that addresses these key evaluation criteria:
        
        ${gradingCriteria}
        
        You MUST choose EXACTLY ONE research approach (hypothesis, needsresearch, or exploratoryresearch).
        You MUST choose EXACTLY ONE data collection method (experiment, existingdata, or theorysimulation).

        Return in this exact JSON format, filling in the fields based on the document text
        and ensuring they meet the grading criteria:
        ${simplifiedJsonStructure}

        Document text (first ${Math.min(documentText.length, 8000)} characters):
        ${documentText.substring(0, 8000)}${documentText.length > 8000 ? '... [truncated]' : ''}
      `;

      const retryResult = await callOpenAI(
        simplifiedPrompt,
        'document_import_simplified',
        {}, [], { temperature: 0.3, max_tokens: 3000 }, [],
        "You are creating educational examples from scientific papers that will be graded against specific criteria. Be generous and follow the requested JSON structure precisely, including exactly one research approach and one data method. Your output should address all the evaluation points provided.",
        true // Use JSON mode
      );

      if (validateResearchPaper(retryResult)) {
        console.log('Successfully fixed paper structure on second attempt');
        retryResult.timestamp = retryResult.timestamp || new Date().toISOString();
        retryResult.version = retryResult.version || '1.0-openai-json-extraction-retry';
        retryResult.chatMessages = retryResult.chatMessages || {};

        // Check essential sections and add placeholders if missing
        const requiredSections = ['analysis', 'process'];
        let missingOrEmptySections = false;
        for (const section of requiredSections) {
          if (!retryResult.userInputs[section] || String(retryResult.userInputs[section]).length < 20) {
            console.warn(`Section ${section} is missing or too short after retry, adding placeholder content`);
            missingOrEmptySections = true;
            retryResult.userInputs[section] = generatePlaceholderContent(section, file.name); // Use refactored function
          }
        }
        if (missingOrEmptySections) console.log('Added placeholder content for missing sections');

        return retryResult;
      }

      throw new Error("Failed to extract valid paper structure after multiple attempts");
    }

    console.log('Successfully processed extracted text to structured data');
    result.timestamp = result.timestamp || new Date().toISOString();
    result.version = result.version || '1.0-openai-json-extraction';
    result.chatMessages = result.chatMessages || {};

    // Check essential sections and add placeholders if missing
    const requiredSections = ['analysis', 'process'];
    let missingOrEmptySections = false;
    for (const section of requiredSections) {
       if (!result.userInputs[section] || String(result.userInputs[section]).length < 20) {
         console.warn(`Section ${section} is missing or too short, adding placeholder content`);
         missingOrEmptySections = true;
         result.userInputs[section] = generatePlaceholderContent(section, file.name); // Use refactored function
       }
    }
    if (missingOrEmptySections) console.log('Added placeholder content for missing sections');

    return result;

  } catch (error) {
    console.error('Error during document import process:', error);

    // Fallback: Try to create a bare-minimum example
    try {
      console.log("Attempting final fallback extraction...");

      // Extract grading criteria for fallback
      const gradingCriteriaShort = extractGradingCriteria().split('\n').slice(0, 20).join('\n') + '\n... [truncated]';

      // Create a simplified prompt with grading criteria
      const simplestExampleStructure = { userInputs: {} };
      // Define the essential fields for the simplest fallback
      const essentialFields = ['question', 'audience', 'hypothesis', 'relatedpapers', 'experiment', 'analysis', 'process', 'abstract'];
      
      essentialFields.forEach(fieldId => {
          const section = sectionContentData.sections.find(s => s.id === fieldId);
          simplestExampleStructure.userInputs[fieldId] = section ? section.placeholder : `[${fieldId} placeholder]`;
      });

      const simplestPrompt = `
        The document extraction failed. Create a reasonable scientific paper example based ONLY on this document title: "${file.name}"
        This is for EDUCATIONAL PURPOSES.
        
        IMPORTANT: Your output will be graded based on these criteria:
        ${gradingCriteriaShort}
        
        Return JSON with these EXACT field names in the userInputs object:
        ${essentialFields.join(', ')}

        Use this structure as a guide, filling it with plausible content related to the title
        that would score well on the grading criteria:
        ${JSON.stringify(simplestExampleStructure, null, 2)}

        Generate a thoughtful, well-structured example based on the title "${file.name}" that addresses the grading criteria.
      `;

      const fallbackResult = await callOpenAI(
        simplestPrompt,
        'document_import_fallback',
        {}, [], { temperature: 0.4, max_tokens: 3000 }, [],
        "You are creating educational examples that will be graded against specific criteria. Generate a complete paper example using the title provided, addressing all the evaluation points required for each section.",
        true // Use JSON mode
      );

      // Basic validation for fallback
      if (fallbackResult && fallbackResult.userInputs && fallbackResult.userInputs.question) {
         // Manually ensure only one approach/data method exists in the fallback
         const approaches = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
         const dataMethods = ['experiment', 'existingdata', 'theorysimulation'];
         
         // Keep only the first found approach/data method if multiple exist
         const foundApproaches = approaches.filter(key => fallbackResult.userInputs[key]);
         const foundDataMethods = dataMethods.filter(key => fallbackResult.userInputs[key]);
         
         approaches.forEach((key, index) => {
             if (index > 0 && foundApproaches.includes(key)) delete fallbackResult.userInputs[key];
         });
         dataMethods.forEach((key, index) => {
             if (index > 0 && foundDataMethods.includes(key)) delete fallbackResult.userInputs[key];
         });
         
         // If none found, add default ones
         if (foundApproaches.length === 0) fallbackResult.userInputs['hypothesis'] = generatePlaceholderContent('hypothesis', file.name);
         if (foundDataMethods.length === 0) fallbackResult.userInputs['experiment'] = generatePlaceholderContent('experiment', file.name);

        console.log('Created fallback example based on document title');
        fallbackResult.timestamp = new Date().toISOString();
        fallbackResult.version = '1.0-fallback-example';
        fallbackResult.chatMessages = {};
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
    }

    // Last resort: Return a structured error object
    const stage = documentText ? 'LLM Processing' : 'Text Extraction';
    const detailedErrorMessage = `Import Error for ${file.name} (Stage: ${stage}):\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown import error'}`;
    const errorContent = documentText
        ? `--- RAW EXTRACTED TEXT (for debugging) ---\n\n${documentText.substring(0, 5000)}...`
        : "Text extraction failed. See error details.";

    // Use placeholders from sectionContent for the error structure
    const errorResult = {
      userInputs: {},
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-extraction-error',
    };
    
    // Add placeholder content for each section
    sectionContentData.sections.forEach(section => {
      if (section && section.id) {
        errorResult.userInputs[section.id] = generatePlaceholderContent(section.id, file.name);
      }
    });
    
    // Overwrite specific fields with error info
    errorResult.userInputs.question = `Research Question: Error during import\n\nSignificance/Impact: ${detailedErrorMessage}`;
    // Put raw text in a relevant field if extraction worked
    if (documentText) errorResult.userInputs.abstract = errorContent;
    else errorResult.userInputs.abstract = `Document import failed for ${file.name}. See details in Question section. ${errorContent}`;

    return errorResult;
  }
}

/**
 * REFACTORED: Generates placeholder content for missing sections using sectionContent.json
 * @param {string} sectionId - The section ID needing placeholder content
 * @param {string} fileName - The name of the imported file (used for context if needed)
 * @returns {string} - Placeholder content from sectionContent.json
 */
function generatePlaceholderContent(sectionId, fileName) {
  const section = sectionContentData.sections.find(s => s.id === sectionId);
  if (section && section.placeholder) {
    // Optionally, you could add context based on fileName here if needed
    // const paperTopic = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return section.placeholder;
  }
  // Fallback if section or placeholder is not found
  return `Placeholder content for section '${sectionId}'. Please review and update.`;
}

// --- testPdfExtraction and window event listener remain the same ---
window.testPdfExtraction = async function() {
  try {
    console.log("Testing PDF extraction...");
    await loadPDFJS();
    let pdfUrl = 'https://arxiv.org/pdf/1409.0473.pdf';
    console.log("Fetching test PDF from URL:", pdfUrl);
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error(`Failed to fetch sample PDF: ${response.status} ${response.statusText}`);
    const pdfData = await response.arrayBuffer();
    console.log("PDF fetched, size:", pdfData.byteLength);
    const extractedText = await extractTextFromPDF(pdfData);
    console.log("EXTRACTION RESULT:", extractedText);
    return extractedText;
  } catch (error) {
    console.error("PDF extraction test failed:", error);
    return "Test failed: " + error.message;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    loadPDFJS().catch(error => {
      console.warn("Preloading PDF.js failed:", error);
    });
  });
}
