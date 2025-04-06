// FILE: src/services/documentImportService.js

/**
 * Modernized service for importing content from PDF and Word documents
 * Uses LangChain and Zod for reliable parsing and validation
 */
import { z } from 'zod';
import { LangChain, ChatOpenAI, StructuredOutputParser } from 'langchain/chat_models';
import { PromptTemplate } from 'langchain/prompts';
import { buildSystemPrompt } from '../utils/promptUtils';

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

// Define the Zod schema for the extracted paper structure
const ResearchPaperSchema = z.object({
  userInputs: z.object({
    question: z.string().min(10),
    audience: z.string().min(10),
    // Only one of the research approaches will be filled
    hypothesis: z.string().optional(),
    needsresearch: z.string().optional(),
    exploratoryresearch: z.string().optional(),
    relatedpapers: z.string().min(10),
    // Only one of the data collection methods will be filled
    experiment: z.string().optional(),
    existingdata: z.string().optional(),
    analysis: z.string().min(10),
    process: z.string().optional(),
    abstract: z.string().min(10)
  }),
  chatMessages: z.record(z.array(z.any())).default({}),
  timestamp: z.string().datetime(),
  version: z.string()
});

/**
 * Processes extracted scientific paper text and generates structured data using LangChain.
 * Uses Zod for validation of the extracted structure.
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

    // Step 3: Create LangChain parser with our Zod schema
    const parser = StructuredOutputParser.fromZodSchema(ResearchPaperSchema);
    
    // Get the format instructions
    const formatInstructions = parser.getFormatInstructions();

    // Step 4: Create a LangChain prompt template
    const promptTemplate = new PromptTemplate({
      template: `
        You are analyzing a scientific paper to extract its structure. Be methodical and accurate.
        
        Extract key components from the provided scientific paper text and format them according to these rules:
        {format_instructions}
        
        Determine which research approach the paper likely uses:
        1. Hypothesis-driven (distinguish between hypotheses)
        2. Needs-based (solve a problem, e.g. engineering or medicine)
        3. Exploratory (take data and see what is there)
        
        Determine which data collection method the paper likely uses:
        1. Experiment
        2. Analysis of Existing Data
        
        Based on the following text, create the scientific paper structure:
        
        {text}
      `,
      inputVariables: ["text"],
      partialVariables: { format_instructions: formatInstructions }
    });

    // Step 5: Create a new ChatOpenAI instance
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0.2,
    });

    // Step 6: Call the model with the prompt
    const chain = promptTemplate.pipe(model).pipe(parser);
    
    const result = await chain.invoke({
      text: documentText
    });

    console.log('Successfully processed extracted text to structured data with LangChain and Zod validation');
    
    // Ensure essential fields exist
    result.timestamp = result.timestamp || new Date().toISOString();
    result.version = result.version || '1.0-langchain-extraction';
    
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
