// FILE: src/services/documentImportService.js

/**
 * Modernized service for importing content from PDF and Word documents
 * Uses OpenAI's native JSON mode for reliable parsing
 */
import { z } from 'zod';
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

// Import necessary libraries for document processing
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// Configure PDF Worker
if (typeof window !== 'undefined' && 'Worker' in window) {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        console.log("pdf.js workerSrc set to local:", pdfjsLib.GlobalWorkerOptions.workerSrc);
    } catch (e) {
         console.error("Error setting pdf.js workerSrc:", e);
    }
} else {
   console.warn("Web Workers not available. pdf.js might run slower.");
}

/**
 * Extracts text from a document file (PDF or Word)
 * @param {File} file - The document file object
 * @returns {Promise<string>} - The extracted text (potentially truncated)
 */
const extractTextFromDocument = async (file) => {
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[Content Extraction Skipped - Library Error or Unsupported Type]`; // Default fallback

        // PDF Extraction Logic
        if ((file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) && 
            typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions.workerSrc) {
          console.log("Processing as PDF...");
          try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            console.log(`PDF loaded: ${pdf.numPages} pages.`);
            let textContent = '';
            const maxPagesToProcess = Math.min(pdf.numPages, 20); // Limit pages
            console.log(`Processing up to ${maxPagesToProcess} pages...`);

            for (let i = 1; i <= maxPagesToProcess; i++) {
              const page = await pdf.getPage(i);
              const textContentStream = await page.getTextContent();
              textContent += textContentStream.items.map(item => item.str).join(' ') + '\n\n';
              if (textContent.length > 15000) { // Limit length
                console.log("Truncating PDF text content due to length limit...");
                textContent = textContent.substring(0, 15000) + "... [TRUNCATED]";
                break;
              }
            }
            extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${textContent}\n\n--- Extracted Text End ---`;
            console.log("PDF text extracted (potentially truncated). Length:", extractedText.length);

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
            console.log("DOCX text extracted (potentially truncated). Length:", extractedText.length);
          } catch (docxError) {
            console.error('Error extracting DOCX text:', docxError);
            reject(new Error(`Failed to extract text from DOCX: ${docxError.message || docxError.toString()}`));
            return;
          }
        }
        // Handle other types or if libraries are missing/misconfigured
        else {
          const libraryMessage = (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) 
            ? "[PDF Library/Worker Not Loaded/Configured]"
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

// We'll use a simple validation function instead of Zod
function validateResearchPaper(paper) {
  // Basic validation
  if (!paper || typeof paper !== 'object') return false;
  if (!paper.userInputs || typeof paper.userInputs !== 'object') return false;
  
  // Check essential fields
  const requiredFields = ['question', 'audience', 'abstract'];
  for (const field of requiredFields) {
    if (typeof paper.userInputs[field] !== 'string' || paper.userInputs[field].length < 10) {
      return false;
    }
  }
  
  // Check research approach (at least one should be present)
  const approachFields = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  const hasApproach = approachFields.some(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (!hasApproach) return false;
  
  // Check data collection method (at least one should be present)
  const dataFields = ['experiment', 'existingdata'];
  const hasDataMethod = dataFields.some(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (!hasDataMethod) return false;
  
  return true;
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * @param {File} file - The document file object (used for filename in errors)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importDocumentContent = async (file) => {
  let documentText = '';
  try {
    // Step 1: Extract text from document
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Step 2: Build system prompt with research context
    const systemPrompt = buildSystemPrompt('documentImport', {
      needsResearchContext: true,
      documentText: documentText.substring(0, 500) // First 500 chars for context
    });

    // Step 3: Build the task prompt
    const taskPrompt = buildTaskPrompt('documentImport', {
      documentText: documentText,
      isoTimestamp: new Date().toISOString()
    });

    // Step 4: Call OpenAI with JSON mode enabled
    const result = await callOpenAI(
      taskPrompt,
      'document_import_task',
      {},
      [],
      { temperature: 0.2, max_tokens: 3000 },
      [],
      systemPrompt,
      true // Use JSON mode
    );

    // Step 5: Validate the result
    if (!validateResearchPaper(result)) {
      throw new Error("Received invalid paper structure from OpenAI");
    }

    console.log('Successfully processed extracted text to structured data with OpenAI JSON mode');
    
    // Ensure essential fields exist
    result.timestamp = result.timestamp || new Date().toISOString();
    result.version = result.version || '1.0-openai-json-extraction';
    result.chatMessages = result.chatMessages || {};
    
    return result;
    
  } catch (error) {
    console.error('Error during document import process:', error);

    // Create a structured error response
    const stage = documentText ? 'LLM Processing' : 'Text Extraction';
    const detailedErrorMessage = `Import Error for ${file.name} (Stage: ${stage}):\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown import error'}`;
    
    const hypothesisTextOnError = documentText
        ? `--- RAW EXTRACTED TEXT (for debugging) ---\n\n${documentText.substring(0, 5000)}...`
        : "Text extraction failed. See error details in Question section.";

    // Return a structured error object
    return {
      userInputs: {
        question: `Research Question: Error during import\n\nSignificance/Impact: ${detailedErrorMessage}`,
        hypothesis: hypothesisTextOnError,
        abstract: `Document import failed for ${file.name}. See details in Question section.`,
      },
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-extraction-error',
    };
  }
};
