/**
 * Service for importing content from PDF and Word documents
 * Uses OpenAI to extract structured information from scientific papers
 * MODIFIED: Uses CDN for pdf.js worker and includes mammoth integration.
 */
import { callOpenAI } from './openaiService';

// --- STEP 1: Ensure Libraries are Installed ---
// Run: npm install pdfjs-dist mammoth (or yarn add) if you haven't already

// --- STEP 2: Uncomment these imports ---
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// --- STEP 3: Configure PDF Worker using CDN ---
if (typeof window !== 'undefined' && 'Worker' in window) {
    // Find the installed version (run `npm list pdfjs-dist --depth=0`)
    // Replace X.Y.Z with the actual version number!
    const pdfjsVersion = '5.9.91'; // <-- IMPORTANT: REPLACE THIS WITH YOUR VERSION!

    if (pdfjsVersion === '5.9.91') {
         console.warn("PDF.js version not set in documentImportService.js! PDF functionality might fail. Please run 'npm list pdfjs-dist --depth=0' and update the pdfjsVersion constant.");
    }
    // Construct the CDN URL
    const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        console.log("pdf.js workerSrc set to CDN:", pdfjsLib.GlobalWorkerOptions.workerSrc);
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

        // --- PDF Extraction Logic (Requires pdfjs-dist installation and worker setup) ---
        if ((file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) && typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions.workerSrc) {
          console.log("Processing as PDF...");
            try {
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
              const pdf = await loadingTask.promise;
              console.log(`PDF loaded: ${pdf.numPages} pages.`);
              let textContent = '';
              // Limit pages processed for performance if needed (e.g., first 20 pages)
              const maxPagesToProcess = Math.min(pdf.numPages, 20);
              console.log(`Processing up to ${maxPagesToProcess} pages...`);

              for (let i = 1; i <= maxPagesToProcess; i++) {
                const page = await pdf.getPage(i);
                const textContentStream = await page.getTextContent();
                // Add space between items, newline between pages
                textContent += textContentStream.items.map(item => item.str).join(' ') + '\n\n';
                 // Limit total text length sent to AI
                 if (textContent.length > 15000) {
                     console.log("Truncating PDF text content due to length limit...");
                     textContent = textContent.substring(0, 15000) + "... [TRUNCATED]";
                     break;
                 }
              }
              // Add filename header to the extracted text
              extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${textContent}\n\n--- Extracted Text End ---`;
              console.log("PDF text extracted (potentially truncated). Length:", extractedText.length);

            } catch (pdfError) {
              console.error('Error extracting PDF text:', pdfError);
              // Use reject to signal failure clearly
              reject(new Error(`Failed to extract text from PDF: ${pdfError.message || pdfError.toString()}`));
              return;
            }
        }
        // --- DOCX Extraction Logic (Requires mammoth installation) ---
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) && typeof mammoth !== 'undefined') {
          console.log("Processing as DOCX...");
           try {
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                let docxText = result.value || '';
                 if (docxText.length > 15000) { // Limit length
                     console.log("Truncating DOCX text content due to length limit...");
                     docxText = docxText.substring(0, 15000) + "... [TRUNCATED]";
                 }
                // Add filename header
                extractedText = `Filename: ${file.name}\n\n--- Extracted Text Start ---\n\n${docxText}\n\n--- Extracted Text End ---`;
                console.log("DOCX text extracted (potentially truncated). Length:", extractedText.length);
              } catch (docxError) {
                console.error('Error extracting DOCX text:', docxError);
                // Use reject to signal failure clearly
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
            const fileInfo = {
                name: file.name,
                type: file.type || 'unknown',
                size: `${Math.round(file.size / 1024)} KB`,
                lastModified: new Date(file.lastModified).toISOString()
            };
            extractedText = `File Metadata (${libraryMessage} Content extraction not performed):\n${JSON.stringify(fileInfo, null, 2)}`;
            // Resolve with metadata if libraries aren't available, rather than rejecting
             resolve(extractedText);
             return; // Exit here for fallback
        }

        resolve(extractedText); // Resolve with the actual extracted text

      } catch (error) {
        console.error('Error processing document content:', error);
        reject(new Error(`Failed to process document: ${error.message}`)); // Reject on general processing error
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error(`Failed to read file: ${error.message}`)); // Reject on read error
    };

    // Read the file as an array buffer for processing
    reader.readAsArrayBuffer(file);
  });
};


/**
 * Processes a scientific paper document and extracts structured data
 * @param {File} file - The document file object
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importDocumentContent = async (file) => {
  try {
    // Step 1: Extract text from document (now attempts actual extraction)
    let documentText = '';
    try {
        console.log(`Starting text extraction for ${file.name}`);
        documentText = await extractTextFromDocument(file);
        console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);
    } catch (extractionError) {
        console.error(`Extraction failed for ${file.name}, creating fallback data.`, extractionError);
        // Create a basic fallback structure if extraction completely fails
        return {
          userInputs: { question: `Failed to process document: ${file.name}. Error: ${extractionError.message}` },
          chatMessages: {},
          timestamp: new Date().toISOString(),
          version: "1.0-extract-error"
        };
    }

    // Step 2: Prepare the prompt for OpenAI
    const prompt = `
# Scientific Paper Extraction - Strict Format

## Task Overview
Extract key components from the provided scientific paper text and format them in a JSON structure that can be loaded by the Scientific Paper Planner tool. The provided text might be truncated or might just contain metadata if extraction failed.

## CRITICAL JSON FORMATTING REQUIREMENTS
1. Use ONLY plain ASCII characters - no special symbols, mathematical notations, or Unicode
2. Do NOT use any HTML tags or special formatting
3. Keep all content extremely simple and straightforward
4. Do NOT use citations, footnotes, or references
5. Replace mathematical variables with simple text descriptions
6. Use only single quotes for nested strings if needed
7. Avoid overly complex or lengthy descriptions
8. Do NOT use subscripts, superscripts, or any special notation
9. Use standard newlines only
10. Ensure JSON remains valid and parseable by standard parsers

## Research Approach Selection
First, determine which research approach the paper likely uses based on the text:

1. **Hypothesis-driven** - Testing specific competing hypotheses
2. **Needs-based** - Solving a specific problem or addressing a need
3. **Exploratory** - Investigating patterns without specific hypotheses

Based on your selection, you will format the "hypothesis" field differently (see details below).

## Data Collection Method Selection
Next, determine which data collection method the paper likely uses based on the text:

1. **Experiment** - New experiment conducted
2. **Existing Data** - Analysis of pre-existing datasets

Based on your selection, you will format the "experiment" or "existingdata" field accordingly.

## Output Format
You must output valid JSON that matches this exact structure:
{
  "userInputs": {
    "question": "Research Question: [simple description based on text]\\n\\nSignificance/Impact: [simple description based on text]",
    "audience": "Target Audience/Community (research fields/disciplines):\\n1. [audience1 based on text]\\n2. [audience2 based on text]\\n\\nSpecific Researchers/Labs (individual scientists or groups):\\n1. [researcher1 based on text]\\n2. [researcher2 based on text]",

    // CHOOSE ONE OF THESE THREE OPTIONS BASED ON RESEARCH APPROACH:

    // OPTION 1: For Hypothesis-driven Research
    "hypothesis": "Hypothesis 1: [simple description based on text]\\n\\nHypothesis 2: [simple description based on text]\\n\\nWhy distinguishing these hypotheses matters:\\n- [reason1 based on text]\\n- [reason2 based on text]",

    // OPTION 2: For Needs-based Research
    "needsresearch": "Who needs this research:\\n[stakeholders based on text]\\n\\nWhy they need it:\\n[problem description based on text]\\n\\nCurrent approaches and limitations:\\n[existing solutions based on text]\\n\\nSuccess criteria:\\n[evaluation methods based on text]\\n\\nAdvantages of this approach:\\n[benefits based on text]",

    // OPTION 3: For Exploratory Research
    "exploratoryresearch": "Phenomena explored:\\n[description based on text]\\n\\nPotential discoveries your approach might reveal:\\n1. [finding1 based on text]\\n2. [finding2 based on text]\\n\\nValue of this exploration to the field:\\n[importance based on text]\\n\\nAnalytical approaches for discovery:\\n[methods based on text]\\n\\nStrategy for validating findings:\\n[validation based on text]",

    "relatedpapers": "Most similar papers that test related hypotheses:\\n1. [paper1 based on text]\\n2. [paper2 based on text]\\n3. [paper3 based on text]\\n4. [paper4 based on text]\\n5. [paper5 based on text]",

    // CHOOSE ONE OF THESE TWO OPTIONS BASED ON DATA COLLECTION:

    // OPTION 1: For New Experiments
    "experiment": "Key Variables:\\n- Independent: [variables based on text]\\n- Dependent: [variables based on text]\\n- Controlled: [variables based on text]\\n\\nSample & Size Justification: [simple description based on text]\\n\\nData Collection Methods: [simple description based on text]\\n\\nPredicted Results: [simple description based on text]\\n\\nPotential Confounds & Mitigations: [simple description based on text]",

    // OPTION 2: For Existing Data
    "existingdata": "Dataset name and source:\\n[description based on text]\\n\\nOriginal purpose of data collection:\\n[description based on text]\\n\\nRights/permissions to use the data:\\n[description based on text]\\n\\nData provenance and quality information:\\n[description based on text]\\n\\nRelevant variables in the dataset:\\n[description based on text]\\n\\nPotential limitations of using this dataset:\\n[description based on text]",

    "analysis": "Data Cleaning & Exclusions:\\n[simple description based on text]\\n\\nPrimary Analysis Method:\\n[simple description based on text]\\n\\nHow Analysis Addresses Research Question:\\n[simple description based on text]\\n\\nUncertainty Quantification:\\n[simple description based on text]\\n\\nSpecial Cases Handling:\\n[simple description based on text]",

    "process": "Skills Needed vs. Skills I Have:\\n[simple description based on text]\\n\\nCollaborators & Their Roles:\\n[simple description based on text]\\n\\nData/Code Sharing Plan:\\n[simple description based on text]\\n\\nTimeline & Milestones:\\n[simple description based on text]\\n\\nObstacles & Contingencies:\\n[simple description based on text]",

    "abstract": "Background: [simple description based on text]\\n\\nObjective/Question: [simple description based on text]\\n\\nMethods: [simple description based on text]\\n\\n(Expected) Results: [simple description based on text]\\n\\nConclusion/Implications: [simple description based on text]"
  },
  "chatMessages": {},
  "timestamp": "${new Date().toISOString()}",
  "version": "1.0"
}

## IMPORTANT:
- Include ONLY ONE of the research approach fields ("hypothesis", "needsresearch", or "exploratoryresearch")
- Include ONLY ONE of the data collection fields ("experiment" or "existingdata")
- Do not include the comments (lines starting with //) in your output
- Base your extraction *solely* on the provided text. If the text only contains metadata or extraction failed/was skipped, state that clearly in the fields (e.g., "Extraction failed - no content available") rather than inventing content. If text is present but incomplete, extract what you can and indicate missing parts if obvious (e.g., "[Abstract missing from text]").
- Create a coherent scientific paper structure *if possible* from the text.

## Section Creation Guidelines
For each section:
1. Create plausible content based *only* on the document text provided.
2. Use simple, straightforward language.
3. Remove/simplify technical jargon, notation, and special characters.
4. Keep content concise but complete according to the text. If text is just metadata, reflect that.

## Final Verification Steps
Before submitting:
1. Validate your JSON format.
2. Check that no forbidden special characters remain (use plain ASCII).
3. Ensure content is simplified but faithful to the source text/metadata provided.
4. Verify notation has been converted to plain language where possible.
5. Make sure all section formatting matches the template exactly.
6. Confirm you've included only ONE research approach and ONE data collection method.

Here is the extracted text/metadata from the document (potentially truncated):
---
${documentText}
---
Based *only* on the text/metadata above, create the scientific paper structure in the specified JSON format.
`;


        // Step 3: Send prompt to OpenAI with longer timeout
        console.log('Sending extracted document text/metadata to OpenAI for processing...');
        const response = await callOpenAI(
          prompt,
          'document_import',
          {},  // No user inputs needed for this specific call's context shaping
          [],  // No sections needed for this specific call's context shaping
          { temperature: 0.2, max_tokens: 3000 } // Lower temperature, more tokens for extraction
        );

        // Step 4: Parse the response JSON
        try {
          // Clean up the response - remove markdown code blocks if present
          const cleanResponse = response.replace(/```json\s*|\s*```/g, '');

          // Try to parse the JSON
          let parsedData;
          try {
            parsedData = JSON.parse(cleanResponse);
          } catch (error) {
            // If parsing fails, try to extract just the JSON part using regex
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("Could not extract valid JSON from response");
            }
          }

          // Basic validation
          if (!parsedData.userInputs) {
            console.warn("Response missing userInputs, creating empty object");
            parsedData.userInputs = {};
          }

          // Add timestamp if missing
          if (!parsedData.timestamp) {
            parsedData.timestamp = new Date().toISOString();
          }

          // Add version if missing
          if (!parsedData.version) {
            parsedData.version = "1.0";
          }

          // Initialize empty chat messages if missing
          if (!parsedData.chatMessages) {
            parsedData.chatMessages = {};
          }

          console.log('Successfully processed document text/metadata to structured data');
          return parsedData;
        } catch (error) {
          console.error('Error parsing OpenAI response:', error);
          console.log('Raw OpenAI response on parse error:', response); // Log raw response

          // Create a fallback structure indicating parsing failure
          const fallbackData = {
            userInputs: {
              question: `Research Question: Analysis of ${file.name}\n\nSignificance/Impact: Failed to parse the structured data returned by the AI. The raw AI response might contain useful information.`,
              abstract: `AI Response Parsing Error for ${file.name}. Raw response logged to console.`
            },
            chatMessages: {},
            timestamp: new Date().toISOString(),
            version: "1.0-parse-error"
          };

          return fallbackData;
        }
      } catch (error) {
        // Catch errors from the overall import process (e.g., OpenAI call failure)
        console.error('Error in importDocumentContent:', error);

        // Return a basic fallback structure indicating a general failure
        return {
          userInputs: {
            question: `Research Question: Analysis of document ${file.name}\n\nSignificance/Impact: Document processing failed. Error: ${error.message}`
          },
          chatMessages: {},
          timestamp: new Date().toISOString(),
          version: "1.0-error"
        };
      }
    };
