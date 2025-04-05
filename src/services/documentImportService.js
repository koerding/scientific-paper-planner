// FILE: src/services/documentImportService.js

/**
 * Service for importing content from PDF and Word documents using text extraction.
 * Uses OpenAI to extract structured information from scientific papers.
 * REFACTORED: Uses centralized prompt content via promptUtils.
 */
import { callOpenAI } from './openaiService';
// Import necessary prompt utility functions
import { buildSystemPrompt, buildTaskPrompt, generateMockResponse } from '../utils/promptUtils';

// --- Ensure Libraries are Installed ---
// Run: npm install pdfjs-dist mammoth (or yarn add)

// --- Uncomment these imports ---
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// --- Configure PDF Worker using Local File ---
if (typeof window !== 'undefined' && 'Worker' in window) {
    // Reference the local worker file (with .mjs extension) copied to /public
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // Use the correct .mjs extension
        console.log("pdf.js workerSrc set to local:", pdfjsLib.GlobalWorkerOptions.workerSrc);
    } catch (e) {
         console.error("Error setting pdf.js workerSrc:", e);
    }
} else {
   console.warn("Web Workers not available. pdf.js might run slower.");
}
// --- End Configuration ---

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

        // --- PDF Extraction Logic ---
        if ((file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) && typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions.workerSrc) {
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
        // --- DOCX Extraction Logic ---
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) && typeof mammoth !== 'undefined') {
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
        // --- Handle other types or if libraries are missing/misconfigured ---
        else {
             const libraryMessage = (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) ? "[PDF Library/Worker Not Loaded/Configured]"
                               : (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) ? "[DOCX Library Not Loaded]"
                               : `[Unsupported File Type: ${file.type || 'unknown'}]`;

            console.warn(`Content extraction skipped. ${libraryMessage}`);
            reject(new Error(`Content extraction skipped: ${libraryMessage}`));
            return;
        }

        resolve(extractedText); // Resolve with the actual extracted text

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


/**
 * Processes extracted scientific paper text and generates structured data using AI.
 * On AI/Parsing error, puts error in 'question' and extracted text in 'hypothesis'.
 * REFACTORED: Uses centralized prompt content via promptUtils.
 * @param {File} file - The document file object (used for filename in errors)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importDocumentContent = async (file) => {
  let documentText = ''; // Keep track of extracted text for error reporting
  try {
    // Step 1: Extract text from document
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file); // Will reject on extraction error
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Step 2: Build system prompt using promptUtils
    // Always include research context for document import analysis
    const systemPrompt = buildSystemPrompt('documentImport', {
      needsResearchContext: true,
      documentText: documentText // Pass full text for context building if needed by system prompt template
    });

    // Step 3: Build the main task prompt using promptUtils
    // Pass the full extracted text as a parameter for the task prompt template
    const mainTaskPrompt = buildTaskPrompt('documentImport', {
        documentText: documentText // Pass the extracted text here
    });

    // Check if mainTaskPrompt generation failed
    if (mainTaskPrompt.startsWith('System error:')) {
        throw new Error(mainTaskPrompt); // Propagate error if prompt building failed
    }

    // Use fallback if needed (check environment variable or API key status)
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const USE_FALLBACK = !apiKey || process.env.REACT_APP_USE_FALLBACK === 'true';

    let response;
    if (USE_FALLBACK) {
        console.warn("[documentImportService] Using FALLBACK mode for document import.");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        response = generateMockResponse('documentImport', file.name); // Get mock JSON structure
    } else {
        // Step 4: Send prompt to OpenAI with the systemPrompt generated by our utility
        console.log('Sending extracted document text to OpenAI for processing...');
        response = await callOpenAI(
          mainTaskPrompt,             // The detailed task prompt from promptUtils
          'document_import_task',     // Context type
          {},                         // No user inputs needed here
          [],                         // No sections needed here
          { temperature: 0.2, max_tokens: 3000 }, // Options
          [],                         // No chat history needed here
          systemPrompt               // The system prompt from promptUtils
        );
    }


    // Step 5: Parse the response JSON
    try {
      // Remove potential markdown formatting before parsing
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
      let parsedData;
      try {
        parsedData = JSON.parse(cleanResponse); // Attempt direct parse first
      } catch (error) {
        // If direct parse fails, try to extract JSON block if AI wrapped it unexpectedly
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.warn("Parsing required extraction of JSON block from response.");
          parsedData = JSON.parse(jsonMatch[0]); // Parse the extracted block
        } else {
          // If no JSON block found, throw the original error
          throw new Error(`Could not extract valid JSON from AI response. Response started with: ${cleanResponse.substring(0, 100)}`);
        }
      }

      // Ensure essential structure exists in the parsed data
      if (!parsedData.userInputs) parsedData.userInputs = {};
      if (!parsedData.timestamp) parsedData.timestamp = new Date().toISOString();
      // Ensure version reflects fallback mode if used
      if (!parsedData.version) parsedData.version = `1.0-text-extraction${USE_FALLBACK ? '-mock' : ''}`;
      if (!parsedData.chatMessages) parsedData.chatMessages = {};

      console.log('Successfully processed extracted text to structured data');
      return parsedData;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw OpenAI response on parse error:', response); // Log raw response

      const detailedErrorMessage = `AI Response Parsing Error for ${file.name}:\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown parsing error'}\n\n--- Raw AI Response (Check Console Log) ---`;
      // Construct fallback data including the raw text for easier debugging
      const fallbackData = {
        userInputs: {
          question: `Research Question: Error after text extraction\n\nSignificance/Impact: ${detailedErrorMessage}`,
          // Put raw text in a less critical field like 'hypothesis' for debugging
          hypothesis: `--- RAW EXTRACTED TEXT (for debugging AI failure) ---\n\n${documentText}`,
          abstract: `AI response parsing failed for ${file.name}. See details in Question section. Raw text in Hypothesis section.`,
        },
        chatMessages: {},
        timestamp: new Date().toISOString(),
        version: '1.0-text-parse-error',
      };
      return fallbackData;
    }
  } catch (error) {
    console.error('Error during document import process:', error);

    // Construct detailed error message including the stage of failure
    const stage = documentText ? 'AI Call/Processing' : 'Text Extraction';
    const detailedErrorMessage = `Import Error for ${file.name} (Stage: ${stage}):\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown import error'}\n\n--- Error Stack Trace (for debugging) ---\n${error.stack || 'No stack trace available'}`;
    // Include raw text if extraction was successful but AI failed
    const hypothesisTextOnError = documentText
        ? `--- RAW EXTRACTED TEXT (for debugging AI/Processing failure) ---\n\n${documentText}`
        : "Text extraction failed. See error details in Question section.";

    // Return a structured error object
    return {
      userInputs: {
        question: `Research Question: Error during import\n\nSignificance/Impact: ${detailedErrorMessage}`,
        hypothesis: hypothesisTextOnError, // Put raw text here for debugging
        abstract: `Document import failed for ${file.name}. See details in Question section.`,
      },
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-text-import-error',
    };
  }
};
