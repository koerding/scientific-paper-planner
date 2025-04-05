// FILE: src/services/documentImportService.js

/**
 * Service for importing content from PDF and Word documents using text extraction.
 * Uses OpenAI to extract structured information from scientific papers.
 * MODIFIED: Uses CDN for pdf.js worker.
 * MODIFIED: Puts detailed errors in 'question' field and extracted text in 'hypothesis' field on AI/parse failure.
 * MODIFIED: Defines and passes its own system prompt to callOpenAI.
 */
import { callOpenAI } from './openaiService';

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
const extractTextFromDocument = async (file) => { //
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);

  return new Promise((resolve, reject) => { // Rejects on error
    const reader = new FileReader(); //

    reader.onload = async (event) => { //
      try {
        const arrayBuffer = event.target.result; //
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[Content Extraction Skipped - Library Error or Unsupported Type]`; // Default fallback

        // --- PDF Extraction Logic ---
        if ((file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) && typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions.workerSrc) { // Check workerSrc too
          console.log("Processing as PDF...");
            try {
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer }); //
              const pdf = await loadingTask.promise; //
              console.log(`PDF loaded: ${pdf.numPages} pages.`);
              let textContent = '';
              const maxPagesToProcess = Math.min(pdf.numPages, 20); // Limit pages
              console.log(`Processing up to ${maxPagesToProcess} pages...`);

              for (let i = 1; i <= maxPagesToProcess; i++) { //
                const page = await pdf.getPage(i); //
                const textContentStream = await page.getTextContent(); //
                textContent += textContentStream.items.map(item => item.str).join(' ') + '\n\n'; //
                 if (textContent.length > 15000) { // Limit length
                     console.log("Truncating PDF text content due to length limit...");
                     textContent = textContent.substring(0, 15000) + "... [TRUNCATED]"; //
                     break;
                 }
              }
              extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${textContent}\n\n--- Extracted Text End ---`; //
              console.log("PDF text extracted (potentially truncated). Length:", extractedText.length);

            } catch (pdfError) { //
              console.error('Error extracting PDF text:', pdfError);
              reject(new Error(`Failed to extract text from PDF: ${pdfError.message || pdfError.toString()}`)); // Reject
              return;
            }
        }
        // --- DOCX Extraction Logic ---
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) && typeof mammoth !== 'undefined') { // Check mammoth
          console.log("Processing as DOCX...");
           try {
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer }); //
                let docxText = result.value || ''; //
                 if (docxText.length > 15000) { // Limit length
                     console.log("Truncating DOCX text content due to length limit...");
                     docxText = docxText.substring(0, 15000) + "... [TRUNCATED]"; //
                 }
                extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${docxText}\n\n--- Extracted Text End ---`; //
                console.log("DOCX text extracted (potentially truncated). Length:", extractedText.length);
              } catch (docxError) { //
                console.error('Error extracting DOCX text:', docxError);
                reject(new Error(`Failed to extract text from DOCX: ${docxError.message || docxError.toString()}`)); // Reject
                return;
              }
        }
        // --- Handle other types or if libraries are missing/misconfigured ---
        else {
             const libraryMessage = (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) ? "[PDF Library/Worker Not Loaded/Configured]"
                               : (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) ? "[DOCX Library Not Loaded]"
                               : `[Unsupported File Type: ${file.type || 'unknown'}]`;

            console.warn(`Content extraction skipped. ${libraryMessage}`);
            // Reject for unsupported types or library issues if strict handling is needed
            reject(new Error(`Content extraction skipped: ${libraryMessage}`));
            return;
        }

        resolve(extractedText); // Resolve with the actual extracted text

      } catch (error) { //
        console.error('Error processing document content:', error);
        reject(new Error(`Failed to process document content: ${error.message}`)); // Reject on general processing error
      }
    };

    reader.onerror = (error) => { //
      console.error('Error reading file:', error);
      reject(new Error(`Failed to read file: ${error.message}`)); // Reject on read error
    };

    reader.readAsArrayBuffer(file); //
  });
};


/**
 * Processes extracted scientific paper text and generates structured data using AI.
 * On AI/Parsing error, puts error in 'question' and extracted text in 'hypothesis'.
 * @param {File} file - The document file object (used for filename in errors)
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importDocumentContent = async (file) => { //
  let documentText = ''; // Keep track of extracted text for error reporting
  try {
    // Step 1: Extract text from document
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file); // Will reject on extraction error
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // *** Define System Prompt for Document Import (Careful, Interpretative) ***
    const importSystemPrompt = `You are an AI assistant tasked with carefully extracting structured information from potentially messy scientific document text. Interpret the text cautiously, adhering strictly to the requested JSON format. Prioritize accuracy and explicitly note fields where information is missing or ambiguous in the source text. Avoid making assumptions beyond the provided text.`;

    // Step 2: Prepare the main prompt for OpenAI using extracted text
    // (This remains largely the same, defining the task and JSON structure)
    const mainPrompt = `
# Scientific Paper Extraction - Strict Format

## Task Overview
Extract key components from the provided scientific paper text and format them in a JSON structure that can be loaded by the Scientific Paper Planner tool. The provided text was automatically extracted and may contain formatting errors or be truncated.

## CRITICAL JSON FORMATTING REQUIREMENTS
1. Use ONLY plain ASCII characters.
2. Do NOT use any HTML tags.
3. Keep content simple and straightforward.
4. Replace mathematical variables with text descriptions.
5. Use only single quotes for nested strings if needed.
6. Use standard newlines only.
7. Ensure JSON remains valid.

## Research Approach Selection
Determine which research approach the paper likely uses based *only* on the provided text:
1. Hypothesis-driven (distinguish between hypotheses)
2. Needs-based (solve a problem, e.g. engineering or medicine)
3. Exploratory (take data and see what is there)

## Data Collection Method Selection
Determine which data collection method the paper likely uses based *only* on the provided text:
1. Experiment
2. Analysis of Existing Data

## Output Format
Output valid JSON matching this exact structure:
{
  "userInputs": {
    "question": "Research Question: [simple description based on text]\\n\\nSignificance/Impact: [simple description based on text]",
    "audience": "Target Audience/Community (research fields/disciplines):\\n1. [audience1 based on text]\\n2. [audience2 based on text]\\n3. [audience3 based on text]\\n4. [audience4 based on text]\\n5. [audience5 based on text] \\n\\nSpecific Researchers/Labs (individual scientists or groups):\\n1. [researcher1 based on text]\\n2. [researcher2 based on text]\\n3. [researcher1 based on text]\\n4. [researcher1 based on text]\\n5. [researcher1 based on text]",

    // CHOOSE ONE based on text:
    "hypothesis": "Hypothesis 1: [simple description based on text, only mention lack of clarity if it is truly unclear]\\n\\nHypothesis 2: [simple description based on text, only mention lack of clarity if it is truly unclear]\\n\\nWhy distinguishing these hypotheses matters:\\n- [reason1 based on text]\\n- [reason2 based on text]",
    "needsresearch": "Who needs this research:\\n[stakeholders based on text]\\n\\nWhy they need it:\\n[problem description based on text]\\n\\nCurrent approaches and limitations:\\n[existing solutions based on text]\\n\\nSuccess criteria:\\n[evaluation methods based on text]\\n\\nAdvantages of this approach:\\n[benefits based on text]",
    "exploratoryresearch": "Phenomena explored:\\n[description based on text]\\n\\nPotential discoveries your approach might reveal:\\n1. [finding1 based on text, if unspecified mention]\\n2. [finding2 based on text, if unspecified mention]\\n\\nValue of this exploration to the field:\\n[importance based on text, mention if there is lack of clarity]\\n\\nAnalytical approaches for discovery:\\n[methods based on text]\\n\\nStrategy for validating findings:\\n[validation based on text]",

    "relatedpapers": "Most similar papers that test related hypotheses:\\n1. [paper1 based on text, ideally give full reference]\\n2. [paper2 based on text, ideally give full reference]\\n3. [paper3 based on text, ideally give full reference]\\n4. [paper4 based on text, ideally give full reference]\\n5. [paper5 based on text, ideally give full reference]",

    // CHOOSE ONE based on text:
    "experiment": "Key Variables:\\n- Independent: [variables based on text, mention if the text does not mention any]\\n- Dependent: [variables based on text, mention if the text does not mention any]\\n- Controlled: [variables based on text, mention if the text does not mention any]\\n\\nSample & Size Justification: [simple description based on text, mention if the text does not mention any]\\n\\nData Collection Methods: [simple description based on text, mention if the text does not mention any]\\n\\nPredicted Results: [simple description based on text, mention if the text does not mention any]\\n\\nPotential Confounds & Mitigations: [simple description based on text, mention if the text does not mention any]",
    "existingdata": "Dataset name and source:\\n[description based on text, mention if the text does not specify]\\n\\nOriginal purpose of data collection:\\n[description based on text, mention if text does not specify]\\n\\nRights/permissions to use the data:\\n[description based on text, mention if the text does not specify]\\n\\nData provenance and quality information:\\n[description based on text, mention if the text does not specify]\\n\\nRelevant variables in the dataset:\\n[description based on text, mention if the text does not specify]\\n\\nPotential limitations of using this dataset:\\n[description based on text, mention if not specified]",

    "analysis": "Data Cleaning & Exclusions:\\n[simple description based on text, mention if the text does not specify]\\n\\nPrimary Analysis Method:\\n[simple description based on text]\\n\\nHow Analysis Addresses Research Question:\\n[simple description based on text, mention if this is not clear]\\n\\nUncertainty Quantification:\\n[simple description based on text, this includes any statistical method, mention if not specified]\\n\\nSpecial Cases Handling:\\n[simple description based on text]",
    "process": "Skills Needed vs. Skills I Have:\\n[simple description based on text, guess where necessary]\\n\\nCollaborators & Their Roles:\\n[simple description based on text, guess where necessary]\\n\\nData/Code Sharing Plan:\\n[simple description based on text]\\n\\nTimeline & Milestones:\\n[simple description based on text]\\n\\nObstacles & Contingencies:\\n[simple description based on text, guess where necessary]",
    "abstract": "Background: [simple description based on text]\\n\\nObjective/Question: [simple description based on text]\\n\\nMethods: [simple description based on text]\\n\\n(Expected) Results: [simple description based on text]\\n\\nConclusion/Implications: [simple description based on text]"
  },
  "chatMessages": {},
  "timestamp": "${new Date().toISOString()}",
  "version": "1.0-text-extraction"
}

## IMPORTANT:
- Base extraction *solely* on the provided text, which might be messy or truncated.
- If information for a field is not found, explicitly state 'Not found in text'.
- If educated guesses are needed, make sure to communicate the lack of clarity.
- Include ONLY ONE research approach field.
- Include ONLY ONE data collection field.
- Adhere STRICTLY to all JSON formatting rules.

Here is the extracted text from the document (potentially truncated):
---
${documentText}
---
Based *only* on the text above, create the scientific paper structure in the specified JSON format.
`;

    // Step 3: Send prompt to OpenAI, passing the specific system prompt
    console.log('Sending extracted document text to OpenAI for processing...');
    const response = await callOpenAI(
      mainPrompt,                 // The detailed task prompt
      'document_import_text',     // Context type
      {},                         // No user inputs needed here
      [],                         // No sections needed here
      { temperature: 0.2, max_tokens: 3000 }, // Options
      [],                         // No chat history needed here
      importSystemPrompt          // Pass the specific system prompt
    );

    // Step 4: Parse the response JSON (remains the same)
    try {
      const cleanResponse = response.replace(/```json\s*|\s*```/g, ''); //
      let parsedData;
      try {
        parsedData = JSON.parse(cleanResponse); //
      } catch (error) {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/); //
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]); //
        } else {
          throw new Error(`Could not extract valid JSON from AI response. Response started with: ${cleanResponse.substring(0, 100)}`); //
        }
      }

      if (!parsedData.userInputs) parsedData.userInputs = {}; //
      if (!parsedData.timestamp) parsedData.timestamp = new Date().toISOString(); //
      if (!parsedData.version) parsedData.version = '1.0-text-extraction'; //
      if (!parsedData.chatMessages) parsedData.chatMessages = {}; //

      console.log('Successfully processed extracted text to structured data');
      return parsedData;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw OpenAI response on parse error:', response);

      const detailedErrorMessage = `AI Response Parsing Error for ${file.name}:\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown parsing error'}\n\n--- Raw AI Response (Check Console Log) ---`;
      const fallbackData = {
        userInputs: {
          question: `Research Question: Error after text extraction\n\nSignificance/Impact: ${detailedErrorMessage}`,
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

    const detailedErrorMessage = `Import Error for ${file.name} (Stage: ${documentText ? 'AI Call/Processing' : 'Text Extraction'}):\nType: ${error.name || 'Error'}\nMessage: ${error.message || 'Unknown import error'}\n\n--- Error Stack Trace (for debugging) ---\n${error.stack || 'No stack trace available'}`;
    const hypothesisTextOnError = documentText
        ? `--- RAW EXTRACTED TEXT (for debugging AI failure) ---\n\n${documentText}`
        : "Text extraction failed. See error details in Question section.";

    return {
      userInputs: {
        question: `Research Question: Error during import\n\nSignificance/Impact: ${detailedErrorMessage}`,
        hypothesis: hypothesisTextOnError,
        abstract: `Document import failed for ${file.name}. See details in Question section.`,
      },
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-text-import-error',
    };
  }
};
