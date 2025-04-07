// FILE: src/services/documentImportService.js

/**
 * Enhanced document import service with robust PDF extraction
 * Multiple extraction methods with fallbacks
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

// Safely try to import PDF.js and mammoth libraries
let pdfjsLib = null;
let mammoth = null;

// Safely try to import PDF.js
try {
  pdfjsLib = require('pdfjs-dist/build/pdf');
  console.log("PDF.js library loaded successfully");

  // Configure the worker
  if (typeof window !== 'undefined') {
    try {
      // Always use our custom worker
      const customWorkerUrl = `${window.location.origin}/pdf.worker.js`;
      console.log("Setting PDF.js worker to:", customWorkerUrl);
      
      // Set the worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = customWorkerUrl;
      
      // Use fake worker mode to avoid cross-origin issues
      pdfjsLib.GlobalWorkerOptions.disableWorker = true;
      
      console.log("PDF.js worker configured successfully");
    } catch (e) {
      console.error("Failed to configure PDF.js worker:", e);
    }
  }
} catch (e) {
  console.warn("Failed to load PDF.js library:", e);
  pdfjsLib = null;
}

// Safely try to import mammoth for DOCX
try {
  mammoth = require('mammoth');
  console.log("Mammoth library loaded successfully");
} catch (e) {
  console.warn("Failed to load Mammoth library:", e);
  mammoth = null;
}

/**
 * Safely checks if localStorage is available in the current context
 * @returns {boolean} Whether localStorage can be used safely
 */
const canUseStorage = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn("localStorage not available:", e);
    return false;
  }
};

/**
 * Primary PDF extraction using PDF.js
 * @param {ArrayBuffer} pdfBuffer - The PDF file as ArrayBuffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractPdfTextPrimary(pdfBuffer) {
  try {
    console.log("Using primary PDF extraction method");
    
    if (!pdfjsLib || !pdfjsLib.getDocument) {
      throw new Error("PDF.js library not available");
    }
    
    // Set up loading task with maximum compatibility options
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      useWorker: false,        // Force fake worker mode
      disableAutoFetch: true,  // Disable streaming
      disableStream: true,     // Disable streaming
      disableFontFace: true,   // Disable font loading
      nativeImageDecoderSupport: 'none',
      isEvalSupported: false,
      isOffscreenCanvasSupported: false
    });
    
    // Process PDF
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded: ${pdf.numPages} pages.`);
          
    let textContent = '';
    const maxPagesToProcess = Math.min(pdf.numPages, 5); // Process fewer pages for stability
    
    // Process each page with individual try/catch
    for (let i = 1; i <= maxPagesToProcess; i++) {
      try {
        console.log(`Processing page ${i}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const pageText = content.items
          .map(item => item.str || '')
          .join(' ');
          
        textContent += `--- Page ${i} ---\n${pageText}\n\n`;
        
        if (textContent.length > 5000) {
          console.log("Truncating PDF text content due to length...");
          textContent = textContent.substring(0, 5000) + "... [TRUNCATED]";
          break;
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent += `[Error extracting page ${i}]\n\n`;
      }
    }
    
    if (!textContent || textContent.trim() === '') {
      throw new Error("No text content extracted from PDF");
    }
    
    return textContent;
  } catch (error) {
    console.error("Primary PDF extraction failed:", error);
    throw error; // Let caller try alternative methods
  }
}

/**
 * Alternative, simpler method to extract text from PDF
 * @param {ArrayBuffer} pdfBuffer - The PDF file as ArrayBuffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractPdfTextAlternative(pdfBuffer) {
  try {
    console.log("Using alternative PDF extraction method");
    
    if (!pdfjsLib || !pdfjsLib.getDocument) {
      throw new Error("PDF.js library not available");
    }
    
    // Force absolute simplest configuration
    const pdf = await pdfjsLib.getDocument({
      data: pdfBuffer,
      useWorker: false,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true
    }).promise;
    
    // Get the first page only to avoid complexity
    const page = await pdf.getPage(1);
    
    // Get raw text using getTextContent
    const textContent = await page.getTextContent();
    
    // Extract text from items
    let extractedText = textContent.items
      .map(item => item.str || '')
      .join(' ');
    
    if (extractedText.length < 20 && pdf.numPages > 1) {
      // Try page 2 if page 1 has very little text
      const page2 = await pdf.getPage(2);
      const textContent2 = await page2.getTextContent();
      
      extractedText += "\n\n" + textContent2.items
        .map(item => item.str || '')
        .join(' ');
    }
    
    return extractedText;
  } catch (error) {
    console.error("Alternative PDF extraction failed:", error);
    throw error;
  }
}

/**
 * Text extraction with DOM method (most compatible)
 * @param {ArrayBuffer} pdfBuffer - The PDF file as ArrayBuffer
 * @returns {string} - Basic information
 */
function extractTextWithDOM(pdfBuffer) {
  try {
    console.log("Attempting text extraction with DOM method");
    
    // This method doesn't actually extract text but tries to display the
    // PDF in the browser, which might help during debugging
    return `[PDF loaded but text extraction not supported in this browser environment. Using filename and metadata instead.]`;
  } catch (error) {
    console.error("DOM text extraction failed:", error);
    return `[DOM extraction error: ${error.message}]`;
  }
}

/**
 * Extracts text from a document file (PDF or Word)
 * @param {File} file - The document file object
 * @returns {Promise<string>} - The extracted text
 */
const extractTextFromDocument = async (file) => {
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n`;

        // Determine file type from extension if MIME type is generic
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       file.name.toLowerCase().endsWith('.docx');
        const isDoc = file.type === 'application/msword' || file.name.toLowerCase().endsWith('.doc');

        // PDF Extraction - with multiple fallback methods
        if (isPdf) {
          try {
            console.log("Processing as PDF...");
            
            // Try multiple extraction methods in sequence
            let pdfText = '';
            let extractionMethod = '';
            
            try {
              // Method 1: Primary PDF.js extraction
              pdfText = await extractPdfTextPrimary(arrayBuffer);
              extractionMethod = 'Primary PDF.js';
            } catch (method1Error) {
              console.warn("Primary extraction failed, trying alternative:", method1Error);
              
              try {
                // Method 2: Alternative simpler PDF.js extraction
                pdfText = await extractPdfTextAlternative(arrayBuffer);
                extractionMethod = 'Alternative PDF.js';
              } catch (method2Error) {
                console.warn("Alternative extraction failed, trying DOM method:", method2Error);
                
                // Method 3: DOM method (last resort)
                pdfText = extractTextWithDOM(arrayBuffer);
                extractionMethod = 'DOM method';
              }
            }
            
            // Format the extracted text
            if (pdfText && pdfText.length > 10) {
              extractedText += `--- Extracted Text (${extractionMethod}) ---\n\n${pdfText}\n\n--- Extraction End ---`;
            } else {
              extractedText += `[PDF text extraction produced insufficient content with ${extractionMethod}]`;
              extractedText += `\nWill use filename to create an example instead.`;
            }
          } catch (pdfError) {
            console.error('Error in PDF extraction:', pdfError);
            extractedText += `[PDF EXTRACTION ERROR: ${pdfError.message || pdfError.toString()}]\n\n`;
            extractedText += `Unable to extract text content from PDF. Using filename to create an example instead.`;
          }
        }
        // DOCX Extraction
        else if (isDocx && mammoth) {
          try {
            console.log("Processing as DOCX...");
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            let docxText = result.value || '';
            if (docxText.length > 10000) {
              console.log("Truncating DOCX text content due to length...");
              docxText = docxText.substring(0, 10000) + "... [TRUNCATED]";
            }
            extractedText += `--- Extracted Text Start ---\n\n${docxText}\n\n--- Extracted Text End ---`;
          } catch (docxError) {
            console.error('Error extracting DOCX text:', docxError);
            extractedText += `[DOCX EXTRACTION FAILED: ${docxError.message || docxError.toString()}]\n\n`;
            extractedText += `Using filename to create an example instead.`;
          }
        }
        // DOC Extraction (older Word format) - just use metadata
        else if (isDoc) {
          console.log("Classic DOC format detected - using metadata only");
          extractedText += `[Classic DOC format detected - Only metadata available]\n\n`;
          extractedText += `Using filename to create an example for you.`;
        }
        // Other file types
        else {
          console.log(`Unsupported file type: ${file.type || 'unknown'}`);
          extractedText += `[Unsupported file type: ${file.type || 'unknown'}]\n\n`;
          extractedText += `Using filename to create an example for you.`;
        }

        // Always resolve with some text, even if extraction failed
        resolve(extractedText);
      } catch (error) {
        console.error('Error processing document content:', error);
        const errorText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n`;
        resolve(errorText + `[EXTRACTION ERROR: ${error.message || error.toString()}]\n\nUsing filename to create an example for you.`);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      const errorText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[FILE READ ERROR]\n\n`;
      resolve(errorText + `Using filename to create an example for you.`);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Processes extracted scientific paper text and generates structured data
 * @param {File} file - The document file object
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export const importDocumentContent = async (file) => {
  let documentText = '';
  
  try {
    // Step 1: Extract text from document - with robust error handling
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Text extraction completed for ${file.name}. Length: ${documentText.length}`);

    // Step 2: Generate project structure from extracted text
    console.log("Generating project structure from extracted text...");
    
    // Extract filename without extension
    const fileName = file.name.replace(/\.\w+$/, '');
    
    // Create a prompt that uses both the filename and any extracted text
    const prompt = `
      Create a scientific paper example based on this:
      
      Document: "${fileName}"
      
      Extracted text (which may be partial):
      ${documentText.substring(0, 5000)}${documentText.length > 5000 ? '...[truncated]' : ''}
      
      Please provide a complete, well-structured scientific paper plan with:
      1. A research question and significance statement
      2. Target audience (academic fields and researchers)
      3. A hypothesis-driven research approach with two competing hypotheses
      4. Five related papers (mentioned in the text if possible)
      5. An experimental approach to data collection
      6. Data analysis plan
      7. Process description with timeline and collaborators
      8. Abstract
      
      Make sure to have exactly ONE research approach (hypothesis) and ONE data collection method (experiment).
      
      This is for EDUCATIONAL PURPOSES to help students learn scientific paper structure.
      Return in valid JSON format with userInputs containing all needed fields:
      question, audience, hypothesis, relatedpapers, experiment, analysis, process, abstract
    `;
    
    // Call OpenAI with the prompt
    const result = await callOpenAI(
      prompt,
      'document_import',
      {},
      [],
      { temperature: 0.7, max_tokens: 3000 },
      [],
      "You are creating educational examples for students. Generate a complete, well-structured scientific paper example with EXACTLY ONE research approach and ONE data collection method. Base your example on the document text provided.",
      true
    );
    
    console.log('Successfully created example based on document');
    
    // Format and return the result
    return {
      userInputs: result.userInputs || createDefaultExample(fileName),
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-document-extraction'
    };
    
  } catch (error) {
    console.error('Error during document import process:', error);
    
    // Create a fallback example based on the filename
    return {
      userInputs: createDefaultExample(file.name),
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-fallback'
    };
  }
};

/**
 * Testing function for PDF extraction - call from browser console
 * @returns {Promise<string>} Extracted text
 */
window.testPdfExtraction = async function() {
  try {
    console.log("Testing PDF extraction...");
    const response = await fetch('/sample.pdf');
    const pdfData = await response.arrayBuffer();
    
    console.log("PDF loaded, size:", pdfData.byteLength);
    
    // Try each extraction method
    try {
      const primaryResult = await extractPdfTextPrimary(pdfData);
      console.log("PRIMARY METHOD SUCCESS:", primaryResult);
      return primaryResult;
    } catch (error) {
      console.error("Primary method failed:", error);
      
      try {
        const alternativeResult = await extractPdfTextAlternative(pdfData);
        console.log("ALTERNATIVE METHOD SUCCESS:", alternativeResult);
        return alternativeResult;
      } catch (error2) {
        console.error("Alternative method failed:", error2);
        const domResult = extractTextWithDOM(pdfData);
        console.log("DOM METHOD RESULT:", domResult);
        return domResult;
      }
    }
  } catch (error) {
    console.error("PDF extraction test failed:", error);
    return "Test failed: " + error.message;
  }
};

/**
 * Creates a default example structure based on filename
 * @param {string} fileName - The filename to base the example on
 * @returns {Object} - Default example structure
 */
function createDefaultExample(fileName) {
  // Clean up the filename to use as a topic
  const topic = fileName.replace(/\.\w+$/, '')  // Remove extension
                       .replace(/[_\-\d]+/g, ' ')  // Replace underscores, hyphens, numbers with spaces
                       .trim();
  
  return {
    question: `Research Question: How do mechanisms in ${topic} affect outcomes in controlled settings?\n\nSignificance/Impact: Understanding these mechanisms could lead to advances in both theory and application.`,
    
    audience: `Target Audience/Community (research fields/disciplines):\n1. Researchers in ${topic} field\n2. Applied practitioners\n3. Interdisciplinary scientists\n\nSpecific Researchers/Labs (individual scientists or groups):\n1. Leading research labs studying ${topic}\n2. Interdisciplinary teams working on related problems\n3. Research centers specializing in relevant methods`,
    
    hypothesis: `Hypothesis 1: The primary mechanism in ${topic} operates through direct causal pathways.\n\nHypothesis 2: The effects observed in ${topic} are mediated by previously unidentified factors.\n\nWhy distinguishing these hypotheses matters:\n- Would clarify fundamental mechanisms\n- Has implications for intervention design`,
    
    relatedpapers: `Most similar papers that test related hypotheses:\n1. Smith et al. (2022) "Recent advances in ${topic}"\n2. Johnson & Williams (2021) "Experimental approaches to ${topic}"\n3. Chen et al. (2023) "Theoretical framework for ${topic}"\n4. Patel (2020) "Meta-analysis of ${topic} research"\n5. Garcia & Lopez (2022) "Future directions in ${topic} studies"`,
    
    experiment: `Key Variables:\n- Independent: Treatment conditions representing different aspects of ${topic}\n- Dependent: Measurable outcomes related to the hypothesized mechanisms\n- Controlled: Participant characteristics and environmental factors\n\nSample & Size Justification: Sample size determined through power analysis to detect medium effect sizes\n\nData Collection Methods: Standardized measurement protocols with validated instruments\n\nPredicted Results: The first hypothesis will be supported by showing direct effects on primary outcomes\n\nPotential Confounds & Mitigations: Randomization and balanced design to control for confounding variables`,
    
    analysis: `Data Cleaning & Exclusions:\nStandard preprocessing procedures with pre-registered exclusion criteria\n\nPrimary Analysis Method:\nMixed-effects regression modeling with appropriate covariates\n\nHow Analysis Addresses Research Question:\nDirectly tests the causal pathways specified in the hypotheses\n\nUncertainty Quantification:\nBootstrap confidence intervals and Bayesian credible intervals\n\nSpecial Cases Handling:\nRobust methods for outlier detection and missing data`,
    
    process: `Skills Needed vs. Skills I Have:\nRequired: experimental design, statistical analysis, domain expertise\nHave: experimental design, need to collaborate for advanced statistics\n\nCollaborators & Their Roles:\nMethodologist for study design, statistician for analysis, domain expert for interpretation\n\nData/Code Sharing Plan:\nPre-registration and open data/code repositories\n\nTimeline & Milestones:\nThree months preparation, six months data collection, three months analysis and writing\n\nObstacles & Contingencies:\nRecruitment challenges addressed through multiple pathways, analysis plan includes alternatives`,
    
    abstract: `Background: ${topic} represents an important area of scientific inquiry with significant implications for theory and practice.\n\nObjective/Question: This study investigates the causal mechanisms underlying ${topic} by testing competing hypotheses about direct versus mediated pathways.\n\nMethods: A controlled experimental design with appropriate randomization and controls will be used to test the specified hypotheses.\n\n(Expected) Results: Results are expected to support the hypothesis of direct causal pathways, providing a clearer understanding of the fundamental mechanisms.\n\nConclusion/Implications: Findings will advance both theoretical understanding and inform practical applications in this field.`
  };
}
