// FILE: src/services/documentImportService.js

/**
 * Document import service for PDF and Word documents
 * UPDATED: Improved prompt structure and validation for better import success
 * UPDATED: Enhanced grading criteria integration for more accurate extraction
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
 * Validates and fixes paper structure to ensure it meets requirements
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
      console.warn(`Missing or invalid required field: ${field} - adding placeholder content`);
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
    // Keep hypothesis even if it's short/empty and fill it with placeholder
    fixedPaper.userInputs['hypothesis'] = fixedPaper.userInputs['hypothesis'] || generatePlaceholderContent('hypothesis', fileName);
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
    console.warn("Invalid data method: None found - using theorysimulation as default");
    // Prefer theorysimulation as default if the paper seems theoretical
    fixedPaper.userInputs['theorysimulation'] = generatePlaceholderContent('theorysimulation', fileName);
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
    console.log("Fixed paper with corrections");
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
 * Generates placeholder content for missing sections
 * @param {string} sectionId - The section ID needing placeholder content
 * @param {string} fileName - The name of the imported file (used for context if needed)
 * @returns {string} - Placeholder content from sectionContent.json
 */
function generatePlaceholderContent(sectionId, fileName) {
  const section = sectionContentData.sections.find(s => s.id === sectionId);
  if (section && section.placeholder) {
    // Use the placeholder from sectionContent.json
    return section.placeholder;
  }
  
  // Fallback if section or placeholder is not found
  return `[${sectionId} content not available]`;
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * UPDATED: Uses improved prompts with explicit required fields
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

    // Step 2: Extract grading criteria
    const gradingCriteria = extractGradingCriteria();
    console.log("Extracted grading criteria for prompt context");

    // Step 3: Build improved system prompt with clear requirements
    const enhancedSystemPrompt = `You are analyzing a scientific paper to extract its structure based on specific grading criteria. 
Be methodical, accurate, and ensure your output aligns with the evaluation standards.

IMPORTANT: Your output will be graded based on how well it meets the criteria for each section outlined below.

CRITICAL REQUIREMENTS:
1. Your response MUST include ALL of these REQUIRED fields: question, audience, hypothesis, relatedpapers, analysis, process, abstract
2. You MUST choose EXACTLY ONE research approach: either hypothesis OR needsresearch OR exploratoryresearch
3. You MUST choose EXACTLY ONE data collection method: either experiment OR existingdata OR theorysimulation
4. DO NOT include placeholder comments in your response
5. Each field must contain detailed, relevant content based on the paper

GRADING CRITERIA:
${gradingCriteria}

Document text (first part): ${documentText.substring(0, 500)}

Create comprehensive examples that address each criterion from the grading rubric.`;

    // Step 4: Build JSON structure for the prompt
    // A simplified structure showing the exact fields required
    const jsonStructure = {
      userInputs: {
        // REQUIRED - these fields must all be populated
        question: "Research Question: [specific question] \nSignificance/Impact: [why it matters]",
        audience: "Target Audience/Community: [list relevant fields/disciplines]\nSpecific Researchers: [name specific researchers]",
        hypothesis: "Hypothesis 1: [specific testable hypothesis]\nHypothesis 2: [alternative testable hypothesis]\nWhy distinguishing these hypotheses matters: [explanation]",
        relatedpapers: "Most similar papers: [list at least 5 related papers]",
        analysis: "Data Cleaning & Exclusions: [approach]\nPrimary Analysis Method: [method]\nHow Analysis Addresses Research Question: [explanation]\nUncertainty Quantification: [approach]\nSpecial Cases Handling: [approach]",
        process: "Skills Needed vs. Skills I Have: [skills assessment]\nCollaborators & Their Roles: [collaboration plan]\nData/Code Sharing Plan: [plan]\nTimeline & Milestones: [timeline]\nObstacles & Contingencies: [risks and mitigation]",
        abstract: "Background: [context]\nObjective/Question: [question]\nMethods: [approach]\n(Expected) Results: [findings]\nConclusion/Implications: [implications]",
        
        // CHOOSE ONE data method (only include one in your output)
        experiment: "Key Variables: [variables]\nSample & Size Justification: [justification]\nData Collection Methods: [methods]\nPredicted Results: [predictions]\nPotential Confounds & Mitigations: [confounds]",
        existingdata: "Dataset Source: [source]\nKey Variables Available: [variables]\nData Quality Assessment: [quality]\nEthical/Legal Considerations: [considerations]\nLimitations of Dataset: [limitations]",
        theorysimulation: "Key Theoretical Assumptions: [assumptions]\nRelationship to Real-world Phenomena: [relevance]\nMathematical/Computational Framework: [framework]\nSolution/Simulation Approach: [approach]\nValidation Strategy: [validation]\nPotential Limitations: [limitations]",
        
        // Alternative research approaches - CHOOSE ONLY ONE of these approaches (including hypothesis)
        // and DELETE the others from your output
        needsresearch: "Who needs this research: [beneficiaries]\nWhy they need it: [problem statement]\nCurrent approaches and limitations: [gaps]\nSuccess criteria: [metrics]\nAdvantages of proposed approach: [benefits]",
        exploratoryresearch: "Phenomena to explore: [description]\nPotential discoveries: [list potential findings]\nValue to the field: [significance]\nAnalytical approaches: [methods]\nValidation strategy: [validation approach]"
      }
    };

    // Convert to string for the prompt
    const jsonStructureStr = JSON.stringify(jsonStructure, null, 2);
    
    // Step 5: Build the enhanced task prompt
    const enhancedTaskPrompt = `
# Scientific Paper Extraction with Essential Fields

Extract key components from the provided scientific paper text and format them in a JSON structure.

**CRITICAL REQUIREMENTS:**
1. Your response MUST include ALL of these REQUIRED fields: question, audience, hypothesis, relatedpapers, analysis, process, abstract
2. You MUST choose EXACTLY ONE research approach: either hypothesis OR needsresearch OR exploratoryresearch
3. You MUST choose EXACTLY ONE data collection method: either experiment OR existingdata OR theorysimulation
4. Delete any fields that aren't required or aren't part of your chosen approach/method
5. Each field must be populated with substantial content

**IMPORTANT:** Be VERY GENEROUS in your interpretation - read between the lines and create a high-quality educational example.

## Output Format
Your output must be valid JSON with this structure (only keep one research approach and one data method):
${jsonStructureStr}

--- DOCUMENT TEXT START ---
${documentText.substring(0, 8000)}${documentText.length > 8000 ? '... [truncated]' : ''}
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
    
    // Validate and fix the response
    const fixedResult = validateAndFixResearchPaper(result, file.name);
    if (!fixedResult) {
      throw new Error("Failed to validate and fix paper structure");
    }

    // Add metadata if needed
    fixedResult.timestamp = fixedResult.timestamp || new Date().toISOString();
    fixedResult.version = fixedResult.version || "1.0-extracted-and-fixed";
    fixedResult.chatMessages = fixedResult.chatMessages || {};

    console.log('Successfully processed and fixed paper structure');
    return fixedResult;

  } catch (error) {
    console.error('Error during document import process:', error);

    // Fallback using simplified approach with just the filename
    try {
      console.log("Attempting fallback extraction based on filename");
      
      // Build a simplified prompt for fallback extraction
      const fallbackSystemPrompt = `You are creating educational examples that will be graded against specific criteria. Generate a complete paper example using the title provided, addressing all the evaluation points required for each section.`;
      
      // Simple prompt focused on producing a complete example with all required fields
      const fallbackPrompt = `
        The document extraction failed. Create a reasonable scientific paper example based ONLY on this document title: "${file.name}"
        This is for EDUCATIONAL PURPOSES.
        
        IMPORTANT: Your output will be graded based on these criteria:
        ${gradingCriteria.substring(0, 500)}... [truncated]
        
        Return JSON with these EXACT field names in the userInputs object:
        question, audience, hypothesis, relatedpapers, experiment, analysis, process, abstract

        Generate a thoughtful, well-structured example based on the title "${file.name}" that addresses the grading criteria.
      `;

      const fallbackResult = await callOpenAI(
        fallbackPrompt,
        'document_import_fallback',
        {}, [], { temperature: 0.4, max_tokens: 3000 }, [], fallbackSystemPrompt, true // Use JSON mode
      );
      
      // Validate and fix the fallback result
      const fixedFallbackResult = validateAndFixResearchPaper(fallbackResult, file.name);
      if (!fixedFallbackResult) {
        throw new Error("Failed to create valid fallback example");
      }

      console.log('Created fallback example based on document title');
      fixedFallbackResult.timestamp = new Date().toISOString();
      fixedFallbackResult.version = '1.0-fallback-example';
      fixedFallbackResult.chatMessages = {};
      return fixedFallbackResult;
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      // Inform the user about the failure without creating a minimal example
      throw new Error(`Unable to import document. Please try a different file or format. Error: ${error.message}`);
    }
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
