// FILE: src/services/documentImportService.js

/**
 * Modernized service for importing content from PDF and Word documents
 * Uses OpenAI's native JSON mode for reliable parsing with generous interpretation
 */
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

// Basic validation function to ensure we have the minimum required fields
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
  
  // Check research approach (exactly one should be present)
  const approachFields = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  const presentApproaches = approachFields.filter(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentApproaches.length !== 1) return false;
  
  // Check data collection method (exactly one should be present)
  const dataFields = ['experiment', 'existingdata'];
  const presentDataMethods = dataFields.filter(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentDataMethods.length !== 1) return false;
  
  return true;
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * Uses generous interpretation to extract the most positive examples possible.
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

    // Step 2: Build system prompt with research context - uses generous interpretation from promptContent.json
    const systemPrompt = buildSystemPrompt('documentImport', {
      needsResearchContext: true,
      documentText: documentText.substring(0, 500) // First 500 chars for context
    });

    // Step 3: Build the task prompt - updated in promptContent.json to emphasize generous interpretation
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
      { 
        temperature: 0.3,    // Low temperature for consistency
        max_tokens: 3000     // Generous token count for detailed responses
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );

    // Step 5: Validate the result, ensuring exactly one research approach and one data method
    if (!validateResearchPaper(result)) {
      console.warn("Received invalid paper structure from OpenAI, attempting to fix...");
      
      // Try a more direct approach if the first attempt didn't give valid results
      const simplifiedPrompt = `
        Extract a complete scientific paper structure from this document text.
        
        Be VERY GENEROUS in your interpretation - read between the lines, make positive assumptions,
        and create a high-quality example that students can learn from. The goal is educational, not critical.
        
        You MUST choose EXACTLY ONE research approach:
        - Either hypothesis-driven (testing competing explanations)
        - OR needs-based (solving a specific problem for stakeholders)
        - OR exploratory (discovering patterns without predetermined hypotheses)
        
        You MUST choose EXACTLY ONE data collection method:
        - Either experiment (collecting new data)
        - OR existingdata (analyzing already collected data)
        
        Return in this exact JSON format:
        {
          "userInputs": {
            "question": "Research Question: [question from paper]\\n\\nSignificance/Impact: [significance from paper]",
            "audience": "Target Audience/Community:\\n1. [audience1]\\n2. [audience2]\\n3. [audience3]\\n\\nSpecific Researchers/Labs:\\n1. [researcher1]\\n2. [researcher2]\\n3. [researcher3]",
            
            // Include EXACTLY ONE of these research approaches:
            "hypothesis": "Hypothesis 1: [hypothesis1]\\n\\nHypothesis 2: [hypothesis2]\\n\\nWhy distinguishing these hypotheses matters:\\n- [reason1]\\n- [reason2]",
            // OR
            "needsresearch": "Who needs this research:\\n[stakeholders based on text]\\n\\nWhy they need it:\\n[problem description based on text]\\n\\nCurrent approaches and limitations:\\n[existing solutions based on text]\\n\\nSuccess criteria:\\n[evaluation methods based on text]\\n\\nAdvantages of this approach:\\n[benefits based on text]",
            // OR
            "exploratoryresearch": "Phenomena explored:\\n[description based on text]\\n\\nPotential discoveries your approach might reveal:\\n1. [finding1 based on text, if unspecified mention]\\n2. [finding2 based on text, if unspecified mention]\\n\\nValue of this exploration to the field:\\n[importance based on text, mention if there is lack of clarity]\\n\\nAnalytical approaches for discovery:\\n[methods based on text]\\n\\nStrategy for validating findings:\\n[validation based on text]",
            
            "relatedpapers": "Most similar papers that test related hypotheses:\\n1. [paper1 based on text, ideally give full reference]\\n2. [paper2 based on text, ideally give full reference]\\n3. [paper3 based on text, ideally give full reference]\\n4. [paper4 based on text, ideally give full reference]\\n5. [paper5 based on text, ideally give full reference]",
            
            // Include EXACTLY ONE of these data collection methods:
            "experiment": "Key Variables:\\n- Independent: [variables based on text, mention if the text does not mention any]\\n- Dependent: [variables based on text, mention if the text does not mention any]\\n- Controlled: [variables based on text, mention if the text does not mention any]\\n\\nSample & Size Justification: [simple description based on text, mention if the text does not mention any]\\n\\nData Collection Methods: [simple description based on text, mention if the text does not mention any]\\n\\nPredicted Results: [simple description based on text, mention if the text does not mention any]\\n\\nPotential Confounds & Mitigations: [simple description based on text, mention if the text does not mention any]",
            // OR
            "existingdata": "Dataset name and source:\\n[description based on text, mention if the text does not specify]\\n\\nOriginal purpose of data collection:\\n[description based on text, mention if text does not specify]\\n\\nRights/permissions to use the data:\\n[description based on text, mention if the text does not specify]\\n\\nData provenance and quality information:\\n[description based on text, mention if the text does not specify]\\n\\nRelevant variables in the dataset:\\n[description based on text, mention if the text does not specify]\\n\\nPotential limitations of using this dataset:\\n[description based on text, mention if not specified]",
            
            "analysis": "Data Cleaning & Exclusions:\\n[simple description based on text, mention if the text does not specify]\\n\\nPrimary Analysis Method:\\n[simple description based on text]\\n\\nHow Analysis Addresses Research Question:\\n[simple description based on text, mention if this is not clear]\\n\\nUncertainty Quantification:\\n[simple description based on text, this includes any statistical method, mention if not specified]\\n\\nSpecial Cases Handling:\\n[simple description based on text]",
            "process": "Skills Needed vs. Skills I Have:\\n[simple description based on text, guess where necessary]\\n\\nCollaborators & Their Roles:\\n[simple description based on text, guess where necessary]\\n\\nData/Code Sharing Plan:\\n[simple description based on text]\\n\\nTimeline & Milestones:\\n[simple description based on text]\\n\\nObstacles & Contingencies:\\n[simple description based on text, guess where necessary]",
            "abstract": "Background: [simple description based on text]\\n\\nObjective/Question: [simple description based on text]\\n\\nMethods: [simple description based on text]\\n\\n(Expected) Results: [simple description based on text]\\n\\nConclusion/Implications: [simple description based on text]"
          },
          "chatMessages": {},
          "timestamp": "${new Date().toISOString()}",
          "version": "1.0-openai-json-extraction"
        }
        
        Document text:
        ${documentText.substring(0, 8000)}... [truncated]
      `;
      
      const retryResult = await callOpenAI(
        simplifiedPrompt,
        'document_import_simplified',
        {},
        [],
        { temperature: 0.3, max_tokens: 3000 },
        [],
        "You are creating educational examples from scientific papers. Be generous in your interpretation and create high-quality examples that demonstrate good scientific practice. Include EXACTLY ONE research approach and EXACTLY ONE data collection method.",
        true
      );
      
      if (validateResearchPaper(retryResult)) {
        console.log('Successfully fixed paper structure on second attempt');
        
        // Ensure essential fields exist
        retryResult.timestamp = retryResult.timestamp || new Date().toISOString();
        retryResult.version = retryResult.version || '1.0-openai-json-extraction-retry';
        retryResult.chatMessages = retryResult.chatMessages || {};
        
        return retryResult;
      }
      
      throw new Error("Failed to extract valid paper structure after multiple attempts");
    }

    console.log('Successfully processed extracted text to structured data with OpenAI JSON mode');
    
    // Ensure essential fields exist
    result.timestamp = result.timestamp || new Date().toISOString();
    result.version = result.version || '1.0-openai-json-extraction';
    result.chatMessages = result.chatMessages || {};
    
    return result;
    
  } catch (error) {
    console.error('Error during document import process:', error);

    // Try one more time with a simplified approach focused on creating a positive example
    try {
      console.log("Attempting final fallback extraction...");
      
      // Create a bare-minimum example
      const simplestPrompt = `
        The document extraction failed. Please create a reasonable scientific paper example
        based on whatever you can glean from this document, or create a generic example if needed.
        
        This is for EDUCATIONAL PURPOSES to help students learn scientific paper structure.
        
        You MUST include EXACTLY ONE research approach (hypothesis, needsresearch, or exploratoryresearch) 
        and EXACTLY ONE data collection method (experiment or existingdata).
        
        Return in valid JSON format with userInputs containing question, audience, one research approach,
        relatedpapers, one data collection method, analysis, process, and abstract fields.
        
        Document title: ${file.name}
        Document preview: ${documentText.substring(0, 3000)}...
      `;
      
      const fallbackResult = await callOpenAI(
        simplestPrompt,
        'document_import_fallback',
        {},
        [],
        { temperature: 0.4, max_tokens: 3000 },
        [],
        "You are creating educational examples for students. Generate a complete, well-structured scientific paper example with EXACTLY ONE research approach and ONE data collection method.",
        true
      );
      
      if (validateResearchPaper(fallbackResult)) {
        console.log('Created fallback example based on document');
        
        fallbackResult.timestamp = new Date().toISOString();
        fallbackResult.version = '1.0-fallback-example';
        fallbackResult.chatMessages = {};
        
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
    }

    // Create a structured error response as last resort
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
