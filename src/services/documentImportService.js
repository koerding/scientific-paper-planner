// FILE: src/services/documentImportService.js

/**
 * Document import service for PDF and Word documents
 * UPDATED: Improved prompt structure and validation for better import success
 * UPDATED: Enhanced grading criteria integration for more accurate extraction
 * FIXED: Now uses sectionContent.json placeholders as the single source of truth
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
import sectionContentData from '../data/sectionContent.json'; // Load the section content

// Import necessary libraries for document processing
import mammoth from 'mammoth';

// --- PDF Handling Functions ---

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

// --- Document Text Extraction ---

const extractTextFromDocument = async (file) => {
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[Content Extraction Skipped - Library Error or Unsupported Type]`; // Default fallback

        // PDF Extraction Logic
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          console.log("Processing as PDF...");
          try {
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

// --- Validation and Fixing Functions ---

/**
 * Generates placeholder content for missing sections using sectionContent.json
 * @param {string} sectionId - The section ID needing placeholder content
 * @param {string} fileName - The name of the imported file (used for context if needed)
 * @returns {string} - Placeholder content from sectionContent.json
 */
function generatePlaceholderContent(sectionId, fileName) {
  // Find the section in sectionContent.json
  const section = sectionContentData.sections.find(s => s.id === sectionId);
  if (section && section.placeholder) {
    // Use the placeholder from sectionContent.json as the single source of truth
    return section.placeholder;
  }
  
  // Fallback if section or placeholder is not found in sectionContent.json
  console.warn(`Placeholder not found for section: ${sectionId}, using default fallback`);
  return `[${sectionId} content not available]`;
}

/**
 * Validates and fixes paper structure to ensure it meets requirements
 * Uses placeholders from sectionContent.json for missing sections
 * @param {Object} paper - The paper object to validate and fix
 * @param {string} fileName - The name of the file for placeholder generation
 * @returns {Object|null} The fixed paper or null if validation completely fails
 */
function validateAndFixResearchPaper(paper, fileName) {
  console.log("VALIDATION - Full paper object structure:", JSON.stringify(paper, null, 2));
  console.log("VALIDATION - Available fields:", paper?.userInputs ? Object.keys(paper.userInputs) : "No userInputs");
  
  // Basic validation
  if (!paper || typeof paper !== 'object') {
    console.error("VALIDATION - No valid paper object provided");
    return null;
  }
  
  if (!paper.userInputs || typeof paper.userInputs !== 'object') {
    console.error("VALIDATION - No valid userInputs object found");
    return null;
  }

  // Create a fixed copy of the paper object
  const fixedPaper = {
    userInputs: { ...paper.userInputs },
    chatMessages: paper.chatMessages || {},
    timestamp: paper.timestamp || new Date().toISOString(),
    version: paper.version || "1.0-fixed-import"
  };

  // Track whether we had to make any fixes
  let fixesApplied = false;

  // Step 1: Ensure all essential fields exist with valid content
  const essentialSectionIds = ['question', 'audience', 'hypothesis', 'relatedpapers', 'analysis', 'process', 'abstract'];
  for (const field of essentialSectionIds) {
    if (!fixedPaper.userInputs[field] || typeof fixedPaper.userInputs[field] !== 'string' || fixedPaper.userInputs[field].length < 10) {
      console.warn(`Missing or invalid required field: ${field} - adding placeholder content from sectionContent.json`);
      fixedPaper.userInputs[field] = generatePlaceholderContent(field, fileName);
      fixesApplied = true;
    }
  }

  // Step 2: Check and fix research approach fields
  const approachFields = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  let approachFieldsFound = approachFields.filter(field => 
    fixedPaper.userInputs[field] && 
    typeof fixedPaper.userInputs[field] === 'string' && 
    fixedPaper.userInputs[field].length > 0 && 
    !fixedPaper.userInputs[field].includes('// Choose') && 
    !fixedPaper.userInputs[field].includes('// Include')
  );
  
  // Remove instructional comments from approach fields
  approachFields.forEach(field => {
    if (fixedPaper.userInputs[field]) {
      const originalValue = fixedPaper.userInputs[field];
      const cleanedValue = originalValue
        .replace(/\/\/ Choose either.*$/gm, '')
        .replace(/\/\/ Include EXACTLY ONE.*$/gm, '')
        .trim();
      
      if (cleanedValue !== originalValue) {
        fixedPaper.userInputs[field] = cleanedValue;
        fixesApplied = true;
      }
    }
  });
  
  // Recalculate after cleaning comments
  approachFieldsFound = approachFields.filter(field => 
    fixedPaper.userInputs[field] && 
    typeof fixedPaper.userInputs[field] === 'string' && 
    fixedPaper.userInputs[field].length > 10
  );
  
  // Fix case where no valid approach is found
  if (approachFieldsFound.length === 0) {
    console.warn("Invalid research approach: None found - using hypothesis as default");
    // Keep hypothesis even if it's short/empty and fill it with placeholder from sectionContent.json
    fixedPaper.userInputs['hypothesis'] = generatePlaceholderContent('hypothesis', fileName);
    fixesApplied = true;
  } 
  // Fix case where multiple approaches are found
  else if (approachFieldsFound.length > 1) {
    // Keep the first research approach and remove others
    const approachToKeep = approachFieldsFound[0];
    console.warn(`Invalid research approach: ${approachFieldsFound.length} approaches present - keeping only ${approachToKeep}`);
    
    approachFieldsFound.slice(1).forEach(field => {
      delete fixedPaper.userInputs[field];
    });
    fixesApplied = true;
  }

  // Step 3: Check and fix data collection method fields
  const dataFields = ['experiment', 'existingdata', 'theorysimulation'];
  let dataFieldsFound = dataFields.filter(field => 
    fixedPaper.userInputs[field] && 
    typeof fixedPaper.userInputs[field] === 'string' && 
    fixedPaper.userInputs[field].length > 0 && 
    !fixedPaper.userInputs[field].includes('// Choose') && 
    !fixedPaper.userInputs[field].includes('// Include')
  );
  
  // Remove instructional comments from data fields
  dataFields.forEach(field => {
    if (fixedPaper.userInputs[field]) {
      const originalValue = fixedPaper.userInputs[field];
      const cleanedValue = originalValue
        .replace(/\/\/ Choose either.*$/gm, '')
        .replace(/\/\/ Include EXACTLY ONE.*$/gm, '')
        .trim();
      
      if (cleanedValue !== originalValue) {
        fixedPaper.userInputs[field] = cleanedValue;
        fixesApplied = true;
      }
    }
  });
  
  // Recalculate after cleaning comments
  dataFieldsFound = dataFields.filter(field => 
    fixedPaper.userInputs[field] && 
    typeof fixedPaper.userInputs[field] === 'string' && 
    fixedPaper.userInputs[field].length > 10
  );
  
  // Fix case where no valid data collection method is found
  if (dataFieldsFound.length === 0) {
    console.warn("Invalid data method: None found - using experiment as default");
    // Use the placeholder from sectionContent.json
    fixedPaper.userInputs['experiment'] = generatePlaceholderContent('experiment', fileName);
    fixesApplied = true;
  } 
  // Fix case where multiple data collection methods are found
  else if (dataFieldsFound.length > 1) {
    // Keep the first data method and remove others
    const dataMethodToKeep = dataFieldsFound[0];
    console.warn(`Invalid data method: ${dataFieldsFound.length} methods present - keeping only ${dataMethodToKeep}`);
    
    dataFieldsFound.slice(1).forEach(field => {
      delete fixedPaper.userInputs[field];
    });
    fixesApplied = true;
  }

  if (fixesApplied) {
    console.log("Fixed paper with corrections using placeholders from sectionContent.json");
  }

  return fixedPaper;
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
  console.log("FULL GRADING CRITERIA FOR IMPORT:");
  console.log(criteriaStr);
  
  return criteriaStr;
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * UPDATED: Uses improved prompts with explicit required fields
 * FIXED: Now uses sectionContent.json placeholders as single source of truth
 * @param {File} file - The document file object (used for filename in errors)
 * @param {Object} sections - The sectionContent data for context (optional)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export async function importDocumentContent(file, sections = null) {
  // Ensure we have the section content data (either passed in or from import)
  const sectionContent = sections || sectionContentData;
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

    // Step 2: Extract grading criteria
    const gradingCriteria = extractGradingCriteria();
    console.log("Extracted grading criteria for prompt context");
    console.log("GRADING CRITERIA LENGTH:", gradingCriteria.length, "characters");

    // Step 3: Build improved system prompt with clear requirements
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
7. The text should be easily readable for students. Use line feeds and bullet points where useful for readability.
8. IMPORTANT: All field values MUST be simple strings, NOT nested objects or arrays


GRADING CRITERIA:
${gradingCriteria}

Document text (first part): ${documentText.substring(0, 500)}

Create comprehensive examples that address each criterion from the grading rubric.`;

    // Step 4: Create examples of placeholder structure from sectionContent.json
    const placeholderExamples = {};
    sectionContent.sections.forEach(section => {
      if (section && section.id && section.placeholder) {
        placeholderExamples[section.id] = section.placeholder;
      }
    });

    // Step 5: Build the enhanced task prompt with placeholder examples
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

    // Step 6: Call OpenAI with improved prompts
    console.log("Sending request to OpenAI with improved prompts");
    const result = await callOpenAI(
      enhancedTaskPrompt,
      'document_import_task',
      {}, [], { temperature: 0.3, max_tokens: 3000 }, [], enhancedSystemPrompt, true // Use JSON mode
    );

    // Step 7: Validate and fix the result rather than rejecting it
    if (!result || !result.userInputs) {
      throw new Error("API returned invalid or empty response");
    }
    
    console.log("API response received, proceeding to validation and fixing");
    
    // Validate and fix the response using placeholders from sectionContent.json
    const fixedResult = validateAndFixResearchPaper(result, file.name);
    if (!fixedResult) {
      throw new Error("Failed to validate and fix paper structure");
    }

    // Add metadata if needed
    fixedResult.timestamp = fixedResult.timestamp || new Date().toISOString();
    fixedResult.version = fixedResult.version || "1.0-extracted-and-fixed";
    fixedResult.chatMessages = fixedResult.chatMessages || {};

    console.log('Successfully processed and fixed paper structure using sectionContent.json placeholders');
    return fixedResult;

  } catch (error) {
    console.error('Error during document import process:', error);
    // Just show a direct error message - no fallback attempt
    throw new Error(`Unable to import document: ${error.message}. Please try a different file format or check if the PDF contains extractable text.`);
  }
}  
// --- PDF.js testing and preloading ---
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
