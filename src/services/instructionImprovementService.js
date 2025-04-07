// FILE: src/services/documentImportService.js

/**
 * Enhanced document import service with better error handling and fallbacks
 * FIXED: PDF.js worker loading issues and storage access errors
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

// Define fallback implementation that doesn't rely on external libraries
// This avoids issues with PDF.js and mammoth

// Flag to determine if we should even try to use the libraries
// Set this to false to bypass all library-based extraction
const USE_DOCUMENT_LIBRARIES = true;

// Import the document processing libraries - but with safer fallbacks
let pdfjsLib = null;
let mammoth = null;

// Only try to load libraries if the flag is true
if (USE_DOCUMENT_LIBRARIES) {
  // Safely try to import PDF.js
  try {
    pdfjsLib = require('pdfjs-dist/build/pdf');
    console.log("PDF.js library loaded successfully");
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
}

// Configure PDF Worker - with much better fallback handling
if (pdfjsLib) {
  try {
    // Try different worker source strategies
    const possibleWorkerSources = [
      // Try our custom wrapper first
      `${window.location.origin}/pdf.worker.wrapper.js`,
      `${window.location.origin}/pdf.worker.min.mjs`,
      `${window.location.origin}/pdf.worker.min.js`, 
      `${window.location.origin}/pdf.worker.js`,
      // Add CDN fallbacks if local fails
      'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
    ];
    
    // Try each source until one works
    let workerSet = false;
    
    for (const workerSrc of possibleWorkerSources) {
      try {
        console.log("Attempting to set pdf.js workerSrc to:", workerSrc);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        
        // Create a test worker to verify it works
        const testWorker = new Worker(workerSrc);
        testWorker.terminate();
        
        console.log("Successfully set PDF.js worker to:", workerSrc);
        workerSet = true;
        break;
      } catch (workerError) {
        console.warn(`Worker source ${workerSrc} failed:`, workerError);
        // Continue to next worker source
      }
    }
    
    if (!workerSet) {
      console.error("All worker sources failed. Will try inline worker as last resort");
      // Set up an inline worker as absolute last resort
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
  } catch (e) {
    console.error("Failed to configure PDF.js worker:", e);
  }
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
 * Extracts text from a document file with enhanced error handling
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

        // Skip library-based extraction completely if flag is false
        if (!USE_DOCUMENT_LIBRARIES) {
          console.log("Skipping library-based extraction as configured");
          extractedText += `[Library-based extraction disabled]\n\n`;
          extractedText += `Using filename and metadata to create an example instead.`;
          resolve(extractedText);
          return;
        }
        
        // PDF Extraction - with better error handling
        if (isPdf && pdfjsLib) {
          try {
            console.log("Processing as PDF...");
            
            // Check if pdfjsLib is properly configured
            if (!pdfjsLib.getDocument) {
              throw new Error("PDF.js library not properly initialized");
            }
            
            // Create a loading task with enhanced options for compatibility
            const loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              useWorkerFetch: false,
              isEvalSupported: false,
              disableFontFace: true,
              nativeImageDecoderSupport: 'none'
            });
            
            // Add extra error handler to the promise
            loadingTask.promise.catch(err => {
              console.error("PDF loading task error:", err);
              throw err;
            });
            
            const pdf = await loadingTask.promise;
            console.log(`PDF loaded: ${pdf.numPages} pages.`);
            
            let textContent = '';
            const maxPagesToProcess = Math.min(pdf.numPages, 10); // Process fewer pages for stability
            
            // Process each page with individual try/catch
            for (let i = 1; i <= maxPagesToProcess; i++) {
              try {
                const page = await pdf.getPage(i);
                const textContentStream = await page.getTextContent();
                const pageText = textContentStream.items.map(item => item.str).join(' ');
                textContent += pageText + '\n\n';
                
                if (textContent.length > 10000) {
                  console.log("Truncating PDF text content due to length...");
                  textContent = textContent.substring(0, 10000) + "... [TRUNCATED]";
                  break;
                }
              } catch (pageError) {
                console.warn(`Error extracting text from page ${i}:`, pageError);
                textContent += `[Error extracting page ${i}]\n\n`;
              }
            }
            
            extractedText += `--- Extracted Text Start ---\n\n${textContent || '[No text content extracted]'}\n\n--- Extracted Text End ---`;
            
          } catch (pdfError) {
            console.error('Error extracting PDF text:', pdfError);
            extractedText += `[PDF EXTRACTION FAILED: ${pdfError.message || pdfError.toString()}]\n\n`;
            extractedText += `We'll use the filename and metadata to create an example instead.`;
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
            extractedText += `We'll use the filename and metadata to create an example instead.`;
          }
        }
        // DOC Extraction (older Word format) - just use metadata
        else if (isDoc) {
          console.log("Classic DOC format detected - using metadata only");
          extractedText += `[Classic DOC format detected - Only metadata available]\n\n`;
          extractedText += `We'll use the filename and metadata to create an example for you.`;
        }
        // Other file types
        else {
          console.log(`Unsupported file type: ${file.type || 'unknown'}`);
          extractedText += `[Unsupported file type: ${file.type || 'unknown'}]\n\n`;
          extractedText += `We'll use the filename to create an example for you.`;
        }

        // Always resolve with some text, even if extraction failed
        resolve(extractedText);
      } catch (error) {
        console.error('Error processing document content:', error);
        const errorText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n`;
        resolve(errorText + `[EXTRACTION ERROR: ${error.message || error.toString()}]\n\nWe'll use the filename to create an example for you.`);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      const errorText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[FILE READ ERROR]\n\n`;
      resolve(errorText + `We'll use the filename to create an example for you.`);
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

    // Step 2: Use OpenAI to generate a project structure based on whatever text we have
    console.log("Generating project structure from extracted text...");
    
    // Simplified prompt for more reliable results
    const simplifiedPrompt = `
      The document extraction ${documentText.includes("[EXTRACTION FAILED") ? "failed" : "completed"}.
      Please create a reasonable scientific paper example based on this document:
      
      Document title: ${file.name}
      Document preview: ${documentText.substring(0, 3000)}...
      
      Create a complete scientific paper plan with:
      - A clear research question and significance
      - Appropriate target audience
      - EXACTLY ONE research approach (hypothesis, needsresearch, or exploratoryresearch)
      - Related papers
      - EXACTLY ONE data collection method (experiment or existingdata)
      - Analysis plan, process description, and abstract
      
      This is for EDUCATIONAL PURPOSES to help students learn scientific paper structure.
      
      Return in valid JSON format with userInputs containing all necessary fields.
    `;
    
    const fallbackResult = await callOpenAI(
      simplifiedPrompt,
      'document_import_fallback',
      {},
      [],
      { temperature: 0.4, max_tokens: 3000 },
      [],
      "You are creating educational examples for students. Generate a complete, well-structured scientific paper example with EXACTLY ONE research approach and ONE data collection method.",
      true
    );
    
    // Format and process the result
    console.log('Successfully created example based on document');
    
    // Clean up the result to ensure it has the proper structure
    const processedResult = {
      userInputs: fallbackResult.userInputs || {},
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-example-from-document'
    };
    
    // Fill in any missing required fields with placeholders
    const requiredSections = [
      'question', 'audience', 'hypothesis', 'relatedpapers', 
      'experiment', 'analysis', 'process', 'abstract'
    ];
    
    requiredSections.forEach(section => {
      if (!processedResult.userInputs[section]) {
        processedResult.userInputs[section] = `[${section} content would be here]`;
      }
    });
    
    // Ensure we have exactly one research approach
    const hasHypothesis = !!processedResult.userInputs.hypothesis;
    const hasNeedsResearch = !!processedResult.userInputs.needsresearch;
    const hasExploratory = !!processedResult.userInputs.exploratoryresearch;
    
    // If we have more than one or none, fix it
    if ((!hasHypothesis && !hasNeedsResearch && !hasExploratory) || 
        (hasHypothesis + hasNeedsResearch + hasExploratory > 1)) {
      // Keep only hypothesis and delete others
      if (!hasHypothesis) {
        processedResult.userInputs.hypothesis = "Hypothesis 1: The effect described in the document is significant.\n\nHypothesis 2: Alternative explanation based on document context.\n\nWhy distinguishing these hypotheses matters:\n- Important for theoretical understanding\n- Has practical implications";
      }
      delete processedResult.userInputs.needsresearch;
      delete processedResult.userInputs.exploratoryresearch;
    }
    
    // Ensure we have exactly one data collection method
    const hasExperiment = !!processedResult.userInputs.experiment;
    const hasExistingData = !!processedResult.userInputs.existingdata;
    
    // If we have more than one or none, fix it
    if ((!hasExperiment && !hasExistingData) || (hasExperiment && hasExistingData)) {
      // Keep only experiment and delete others
      if (!hasExperiment) {
        processedResult.userInputs.experiment = "Key Variables:\n- Independent: Treatment condition\n- Dependent: Measured outcome\n- Controlled: Participant characteristics\n\nSample & Size Justification: Appropriate sample size based on power analysis\n\nData Collection Methods: Standardized measurement procedures\n\nPredicted Results: Results will align with research hypothesis\n\nPotential Confounds & Mitigations: Randomization and careful experimental control";
      }
      delete processedResult.userInputs.existingdata;
    }
    
    return processedResult;
    
  } catch (error) {
    console.error('Error during document import process:', error);

    // Create a simplified fallback example based just on the filename
    try {
      console.log("Creating simple fallback example from filename...");
      
      // Generate a topic idea from the filename
      const filename = file.name;
      const topicHint = filename.replace(/\.\w+$/, '')  // Remove extension
                               .replace(/[_\-\d]+/g, ' ')  // Replace underscores, hyphens, numbers with spaces
                               .trim();
      
      return {
        userInputs: {
          question: `Research Question: What factors influence ${topicHint || 'the phenomenon described in the document'}?\n\nSignificance/Impact: Understanding these factors could lead to important applications and theoretical advances.`,
          
          audience: `Target Audience/Community (research fields/disciplines):\n1. Researchers in ${topicHint || 'this'} field\n2. Applied practitioners\n3. Educational institutions\n\nSpecific Researchers/Labs (individual scientists or groups):\n1. Leading research labs in this area\n2. Interdisciplinary research teams\n3. Industry R&D departments`,
          
          hypothesis: `Hypothesis 1: There is a significant relationship between key variables in ${topicHint || 'this topic'}.\n\nHypothesis 2: Alternative mechanisms explain the observed phenomena.\n\nWhy distinguishing these hypotheses matters:\n- Advances theoretical understanding\n- Has implications for practical applications`,
          
          relatedpapers: `Most similar papers that test related hypotheses:\n1. Smith et al. (2020) "Key advances in ${topicHint || 'this field'}"\n2. Jones & Brown (2019) "Experimental approaches to ${topicHint || 'this topic'}"\n3. Zhang et al. (2021) "Theoretical framework for ${topicHint || 'understanding these phenomena'}"\n4. Williams (2018) "Meta-analysis of ${topicHint || 'related studies'}"\n5. Miller & Davis (2022) "Future directions in ${topicHint || 'this research area'}"`,
          
          experiment: `Key Variables:\n- Independent: Treatment conditions\n- Dependent: Measured outcomes\n- Controlled: Participant characteristics\n\nSample & Size Justification: Sample size determined by power analysis for detecting medium effect sizes\n\nData Collection Methods: Standardized procedures following established protocols\n\nPredicted Results: Results will show significant effects supporting the primary hypothesis\n\nPotential Confounds & Mitigations: Randomization and careful experimental controls will minimize confounding variables`,
          
          analysis: `Data Cleaning & Exclusions:\nStandard preprocessing procedures and clear exclusion criteria\n\nPrimary Analysis Method:\nMixed-effects regression analysis\n\nHow Analysis Addresses Research Question:\nDirectly tests the relationship between independent and dependent variables\n\nUncertainty Quantification:\nConfidence intervals and effect size estimates\n\nSpecial Cases Handling:\nRobust methods for outlier detection and handling`,
          
          process: `Skills Needed vs. Skills I Have:\nExperimental design, statistical analysis, and domain expertise\n\nCollaborators & Their Roles:\nMethodology expert, statistical consultant, and subject matter specialist\n\nData/Code Sharing Plan:\nOpen data and code repositories following completion\n\nTimeline & Milestones:\nThree-month preparation, six-month data collection, three-month analysis\n\nObstacles & Contingencies:\nAlternative approaches identified for potential challenges`,
          
          abstract: `Background: ${topicHint || 'This topic'} represents an important area of scientific inquiry with significant implications.\n\nObjective/Question: This study investigates the factors that influence ${topicHint || 'key phenomena'} and tests competing explanations.\n\nMethods: A controlled experimental design with appropriate statistical analysis will be used to test the hypotheses.\n\n(Expected) Results: Results are expected to support the primary hypothesis and provide insights into underlying mechanisms.\n\nConclusion/Implications: Findings will advance both theoretical understanding and practical applications in this field.`
        },
        chatMessages: {},
        timestamp: new Date().toISOString(),
        version: '1.0-simple-fallback'
      };
    } catch (fallbackError) {
      console.error('Simple fallback also failed:', fallbackError);
      
      // Return minimal valid structure as absolute last resort
      return {
        userInputs: {
          question: `Research Question: Error during import: ${error.message || 'Unknown error'}\n\nSignificance/Impact: Please try a different file format or create a new project.`,
          hypothesis: `Document import failed for ${file.name}. Please try a different approach.`,
          abstract: `Document import failed. Please try again with a different file format.`,
        },
        chatMessages: {},
        timestamp: new Date().toISOString(),
        version: '1.0-extraction-error',
      };
    }
  }
};
