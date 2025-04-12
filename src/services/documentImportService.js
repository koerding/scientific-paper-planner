// FILE: src/services/documentImportService.js

/**
 * Enhanced document import service for PDF and Word documents
 * UPDATED: Now integrates with sectionContent.json for better alignments
 * IMPROVED: Enhanced prompt construction with section details
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';

// Import necessary libraries for document processing
// We'll use mammoth for DOCX but load PDF.js from CDN
import mammoth from 'mammoth';

// Load PDF.js from CDN when the component mounts
// This function should be called from a useEffect in a component that needs PDF functionality
export const loadPDFJS = async () => {
  // Only load if it's not already loaded
  if (window.pdfjsLib) return window.pdfjsLib;
  
  return new Promise((resolve, reject) => {
    // Create script element for PDF.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    // Handle load event
    script.onload = () => {
      console.log("PDF.js loaded from CDN successfully");
      
      // PDF.js is now available as pdfjsLib in the global scope
      if (window.pdfjsLib) {
        // Basic configuration
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js loaded but pdfjsLib not found in window"));
      }
    };
    
    // Handle error
    script.onerror = () => {
      console.error("Failed to load PDF.js from CDN");
      reject(new Error("Failed to load PDF.js from CDN"));
    };
    
    // Add to document
    document.body.appendChild(script);
  });
};

/**
 * Extracts text from a PDF using the CDN-loaded PDF.js
 * @param {ArrayBuffer} pdfData - The PDF file as ArrayBuffer
 * @returns {Promise<string>} - The extracted text
 */
const extractTextFromPDF = async (pdfData) => {
  try {
    // Ensure PDF.js is loaded
    if (!window.pdfjsLib) {
      await loadPDFJS();
    }
    
    // Load the PDF
    const loadingTask = window.pdfjsLib.getDocument({data: pdfData});
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded: ${pdf.numPages} pages.`);
    
    // Extract text from all pages
    let fullText = '';
    
    // Limit to reasonable number of pages
    const maxPagesToProcess = Math.min(pdf.numPages, 20);
    
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += `--- Page ${pageNum} ---\n` + strings.join(' ') + '\n\n';
        
        // Limit text length
        if (fullText.length > 15000) {
          fullText = fullText.substring(0, 15000) + "... [TRUNCATED]";
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
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n[Content Extraction Skipped - Library Error or Unsupported Type]`; // Default fallback

        // PDF Extraction Logic - using CDN-loaded PDF.js
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          console.log("Processing as PDF...");
          try {
            // Use our CDN-based extraction function
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

/**
 * Validates loaded project data
 * @param {Object} data - The data to validate
 * @param {Object} sectionContent - The section content to validate against
 * @returns {boolean} - Whether the data is valid
 */
function validateResearchPaper(paper, sectionContent) {
  // Basic validation
  if (!paper || typeof paper !== 'object') return false;
  if (!paper.userInputs || typeof paper.userInputs !== 'object') return false;
  
  // Get required fields from sectionContent
  const requiredFields = ['question', 'audience', 'analysis', 'process', 'abstract'];
  for (const field of requiredFields) {
    if (typeof paper.userInputs[field] !== 'string' || paper.userInputs[field].length < 10) {
      console.warn(`Missing or invalid required field: ${field}`);
      return false;
    }
  }
  
  // Check research approach (exactly one should be present)
  const approachFields = ['hypothesis', 'needsresearch', 'exploratoryresearch'];
  const presentApproaches = approachFields.filter(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentApproaches.length !== 1) {
    console.warn(`Invalid research approach: ${presentApproaches.length} approaches present`);
    return false;
  }
  
  // Check data collection method (exactly one should be present)
  const dataFields = ['experiment', 'existingdata', 'theorysimulation'];
  const presentDataMethods = dataFields.filter(field => 
    paper.userInputs[field] && typeof paper.userInputs[field] === 'string' && paper.userInputs[field].length > 0
  );
  if (presentDataMethods.length !== 1) {
    console.warn(`Invalid data method: ${presentDataMethods.length} methods present`);
    return false;
  }
  
  return true;
}

/**
 * Generates placeholder content for missing sections
 * @param {string} sectionId - The section ID needing placeholder content
 * @param {string} fileName - The name of the imported file
 * @param {Object} sectionContent - The full section content structure
 * @returns {string} - Meaningful placeholder content for the section
 */
function generatePlaceholderContent(sectionId, fileName, sectionContent) {
  // Try to get the placeholder from sectionContent
  const section = sectionContent?.sections?.find(s => s.id === sectionId);
  if (section && section.placeholder) {
    return section.placeholder;
  }
  
  const paperTopic = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  
  switch(sectionId) {
    case 'theorysimulation':
      return `Key Theoretical Assumptions:
- The system exhibits certain properties that can be described mathematically
- Interactions between components follow established principles
- The model captures essential features while simplifying non-essential details

Relationship to Real-world Phenomena:
This theoretical framework provides insights into how the underlying mechanisms operate in real-world systems, allowing predictions about behavior under various conditions.

Mathematical/Computational Framework:
The approach uses differential equations to model system dynamics, with numerical methods to solve equations that cannot be addressed analytically.

Solution/Simulation Approach:
We will implement the model using standard numerical methods with adaptive step size to ensure accuracy, running multiple simulations with varying initial conditions.

Validation Strategy:
The model predictions will be compared with existing empirical data from the literature. Qualitative patterns and quantitative predictions will both be assessed.

Potential Limitations:
The theoretical framework makes simplifying assumptions that may not hold in all real-world contexts. Edge cases may not be well-represented by the model.

Theoretical Significance:
This work will advance understanding by providing a unified framework that connects previously disparate observations.`;
      
    case 'analysis':
      return `Data Cleaning & Exclusions:
The data will be preprocessed to remove outliers (values exceeding 3 standard deviations from the mean) and missing values will be imputed using appropriate methods based on data distribution.

Primary Analysis Method:
Statistical analysis will include descriptive statistics, correlation analysis, and appropriate inferential methods such as t-tests or ANOVA depending on the final data structure.

How Analysis Addresses Research Question:
This analysis will directly test the relationship between the variables of interest while controlling for potential confounding factors, directly addressing our primary hypotheses.

Uncertainty Quantification:
95% confidence intervals will be calculated for all estimates, and p-values will be adjusted for multiple comparisons using the Benjamini-Hochberg procedure.

Special Cases Handling:
Any data points identified as influential (Cook's distance > 1) will be analyzed separately to determine their impact on the overall findings.`;

    case 'process':
      return `Skills Needed vs. Skills I Have:
This project requires expertise in statistical analysis, data visualization, and domain knowledge of the subject matter. I have experience with statistical methods but may need to consult with domain experts on specific aspects of the interpretation.

Collaborators & Their Roles:
I plan to collaborate with methodology experts for advanced statistical analysis and domain specialists who can provide context for the findings.

Data/Code Sharing Plan:
All analysis code will be made available via a GitHub repository, and de-identified data will be shared through an appropriate data repository with proper documentation.

Timeline & Milestones:
Month 1: Data collection and cleaning
Month 2-3: Primary analysis and initial results
Month 4: Interpretation and manuscript preparation
Month 5-6: Manuscript submission and revision

Obstacles & Contingencies:
In case of unexpected data quality issues, we have identified alternative data sources. If the primary analysis methods prove insufficient, we have prepared alternative approaches to test our key hypotheses.`;

    default:
      return `This section requires additional content from the imported document. Please review and update based on your research needs.`;
  }
}

/**
 * Builds an enhanced prompt that includes section structure from sectionContent
 * @param {string} documentText - The extracted document text
 * @param {Object} sectionContent - The section content structure
 * @returns {string} - Enhanced prompt
 */
function buildEnhancedPrompt(documentText, sectionContent) {
  // Extract section information from sectionContent to improve prompt
  let sectionStructure = "SECTION STRUCTURE DETAILS:\n";
  
  if (sectionContent && Array.isArray(sectionContent.sections)) {
    sectionContent.sections.forEach(section => {
      if (section && section.id) {
        sectionStructure += `\n${section.title} (${section.id}):\n`;
        
        // Add subsection details if available
        if (Array.isArray(section.subsections)) {
          section.subsections.forEach(subsection => {
            sectionStructure += `- ${subsection.title}: ${subsection.instruction}\n`;
          });
        }
        
        // Add example format from placeholder if available
        if (section.placeholder) {
          sectionStructure += `Example format: ${section.placeholder.substring(0, 100)}...\n`;
        }
      }
    });
  }
  
  return `
    Extract a complete scientific paper structure from this document text.
    
    Be VERY GENEROUS in your interpretation - read between the lines, make positive assumptions,
    and create a high-quality example that students can learn from. The goal is educational, not critical.
    
    ${sectionStructure}
    
    You MUST choose EXACTLY ONE research approach:
    - Either hypothesis-driven (testing competing explanations)
    - OR needs-based (solving a specific problem for stakeholders)
    - OR exploratory (discovering patterns without predetermined hypotheses)
    
    You MUST choose EXACTLY ONE data collection method:
    - Either experiment (collecting new data)
    - OR existingdata (analyzing already collected data)
    - OR theorysimulation (using theory or computational models)
    
    Return in this exact JSON format:
    {
      "userInputs": {
        "question": "Research Question: [question from paper]\\n\\nSignificance/Impact: [significance from paper]",
        "audience": "Target Audience/Community (research fields/disciplines):\\n1. [audience1]\\n2. [audience2]\\n3. [audience3]\\n\\nSpecific Researchers/Labs (individual scientists or groups):\\n1. [researcher1]\\n2. [researcher2]\\n3. [researcher3]",
        
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
        // OR
        "theorysimulation": "Key Theoretical Assumptions:\\n- [assumption1 based on text]\\n- [assumption2 based on text]\\n- [assumption3 based on text]\\n\\nRelationship to Real-world Phenomena:\\n[description based on text]\\n\\nMathematical/Computational Framework:\\n[description based on text]\\n\\nSolution/Simulation Approach:\\n[description based on text]\\n\\nValidation Strategy:\\n[description based on text]\\n\\nPotential Limitations:\\n[description based on text]\\n\\nTheoretical Significance:\\n[description based on text]",
        
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
}

/**
 * Processes extracted scientific paper text and generates structured data using OpenAI's JSON mode.
 * Now integrates with sectionContent.json for better alignment with expected structure.
 * @param {File} file - The document file object (used for filename in errors)
 * @param {Object} sectionContent - The section content structure for better alignment
 * @returns {Promise<Object>} - The structured data for loading into the planner
 */
export async function importDocumentContent(file, sectionContent) {
  let documentText = '';
  try {
    // Load PDF.js first if this is a PDF
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        await loadPDFJS();
      } catch (loadError) {
        console.warn("Failed to load PDF.js from CDN:", loadError);
        // Continue anyway - we'll handle fallback later
      }
    }
    
    // Step 1: Extract text from document
    console.log(`Starting text extraction for ${file.name}`);
    documentText = await extractTextFromDocument(file);
    console.log(`Extraction successful for ${file.name}. Text length: ${documentText.length}`);

    // Step 2: Build system prompt with sectionContent awareness
    const systemPrompt = buildSystemPrompt('documentImport', {
      documentText: documentText.substring(0, 500) // First 500 chars for context
    });

    // Step 3: Build the task prompt with section structure incorporated
    const taskPrompt = buildTaskPrompt('documentImport', {
      documentText: documentText,
      isoTimestamp: new Date().toISOString(),
      // Add section structure data for better alignment
      sectionStructure: JSON.stringify(sectionContent.sections.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type
      })))
    });

    // Step 4: Call OpenAI with JSON mode enabled
    const result = await callOpenAI(
      taskPrompt,
      'document_import_task',
      {},
      sectionContent.sections, // Pass the full sections data
      { 
        temperature: 0.3,    // Low temperature for consistency
        max_tokens: 3000     // Generous token count for detailed responses
      },
      [],
      systemPrompt,
      true // Use JSON mode
    );

    // Step 5: Validate the result with sectionContent
    if (!validateResearchPaper(result, sectionContent)) {
      console.warn("Received invalid paper structure from OpenAI, attempting to fix...");
      
      // Enhanced prompt with complete section structure
      const enhancedPrompt = buildEnhancedPrompt(documentText, sectionContent);
      
      const retryResult = await callOpenAI(
        enhancedPrompt,
        'document_import_enhanced',
        {},
        sectionContent.sections, // Pass sections again
        { temperature: 0.3, max_tokens: 3000 },
        [],
        "You are creating educational examples from scientific papers. Be generous in your interpretation and create high-quality examples that demonstrate good scientific practice. Include EXACTLY ONE research approach and EXACTLY ONE data collection method. Follow the section structure provided.",
        true
      );
      
      if (validateResearchPaper(retryResult, sectionContent)) {
        console.log('Successfully fixed paper structure on second attempt');
        
        // Ensure essential fields exist
        retryResult.timestamp = retryResult.timestamp || new Date().toISOString();
        retryResult.version = retryResult.version || '1.0-openai-json-extraction-retry';
        retryResult.chatMessages = retryResult.chatMessages || {};
        
        // Validate all required sections against sectionContent
        const allSectionIds = sectionContent.sections.map(s => s.id);
        let missingOrEmptySections = false;
        
        for (const sectionId of allSectionIds) {
          if (!retryResult.userInputs[sectionId] || retryResult.userInputs[sectionId].length < 20) {
            console.warn(`Section ${sectionId} is missing or too short after retry, adding placeholder content`);
            missingOrEmptySections = true;
            // Add placeholder content from sectionContent if available
            retryResult.userInputs[sectionId] = generatePlaceholderContent(sectionId, file.name, sectionContent);
          }
        }
        
        if (missingOrEmptySections) {
          console.log('Added placeholder content for missing sections from sectionContent.json');
        }
        
        return retryResult;
      }
      
      throw new Error("Failed to extract valid paper structure after multiple attempts");
    }

    console.log('Successfully processed extracted text to structured data with OpenAI JSON mode');
    
    // Ensure essential fields exist
    result.timestamp = result.timestamp || new Date().toISOString();
    result.version = result.version || '1.0-openai-json-extraction';
    result.chatMessages = result.chatMessages || {};
    
    // Verify all required sections from sectionContent
    const allSectionIds = sectionContent.sections.map(s => s.id);
    let missingOrEmptySections = false;
    
    for (const sectionId of allSectionIds) {
      if (!result.userInputs[sectionId] || result.userInputs[sectionId].length < 20) {
        console.warn(`Section ${sectionId} is missing or too short, adding placeholder content`);
        missingOrEmptySections = true;
        // Add placeholder content from sectionContent
        result.userInputs[sectionId] = generatePlaceholderContent(sectionId, file.name, sectionContent);
      }
    }
    
    if (missingOrEmptySections) {
      console.log('Added placeholder content for missing sections from sectionContent');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error during document import process:', error);

    // Try one more time with a simplified approach focused on creating a positive example
    try {
      console.log("Attempting final fallback extraction with sectionContent...");
      
      // Use sectionContent to create a more aligned fallback prompt
      const sectionIds = sectionContent.sections.map(s => s.id).join(', ');
      const sectionPlaceholders = {};
      sectionContent.sections.forEach(s => {
        if (s.placeholder) {
          sectionPlaceholders[s.id] = s.placeholder.substring(0, 100) + '...';
        }
      });
      
      // Create a fallback prompt with section structure
      const simplestPrompt = `
        The document extraction failed. Please create a reasonable scientific paper example
        based on this document title: "${file.name}" and these sections: ${sectionIds}
        
        This is for EDUCATIONAL PURPOSES to help students learn scientific paper structure.
        
        Create a structure that follows the format used in our sections. Here are some examples:
        ${JSON.stringify(sectionPlaceholders, null, 2)}
        
        You MUST return JSON with these EXACT field names in the userInputs object:
        - question
        - audience
        - ONE of: hypothesis, needsresearch, exploratoryresearch
        - relatedpapers
        - ONE of: experiment, existingdata, theorysimulation
        - analysis
        - process
        - abstract
        
        Create a thoughtful, well-structured scientific paper example focusing on the topic in the document title.
      `;
      
      const fallbackResult = await callOpenAI(
        simplestPrompt,
        'document_import_fallback',
        {},
        sectionContent.sections,
        { temperature: 0.4, max_tokens: 3000 },
        [],
        "You are creating educational examples for students. Generate a complete, well-structured scientific paper example with EXACTLY the field names requested. Do not use alternative field names. Follow the structure provided in sectionContent.",
        true
      );
      
      if (validateResearchPaper(fallbackResult, sectionContent)) {
        console.log('Created fallback example based on document title and sectionContent');
        
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
    
    // Use sectionContent placeholder for question if available
    const questionSection = sectionContent.sections.find(s => s.id === 'question');
    const questionPlaceholder = questionSection?.placeholder || "Error during import. Please try again with a different file.";
    
    // Return a structured error object
    return {
      userInputs: {
        question: `Research Question: Error during import\n\nSignificance/Impact: ${detailedErrorMessage}`,
        hypothesis: "Text extraction failed. See error details in Question section.",
        abstract: `Document import failed for ${file.name}. See details in Question section.`,
      },
      chatMessages: {},
      timestamp: new Date().toISOString(),
      version: '1.0-extraction-error',
    };
  }
}

// Add testing function for convenience
window.testPdfExtraction = async function() {
  try {
    console.log("Testing PDF extraction...");
    
    // Load PDF.js first
    await loadPDFJS();
    
    // Test with a URL
    let pdfUrl = 'https://arxiv.org/pdf/1409.0473.pdf'; // Neural Machine Translation paper
    
    console.log("Fetching test PDF from URL:", pdfUrl);
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample PDF: ${response.status} ${response.statusText}`);
    }
    
    const pdfData = await response.arrayBuffer();
    console.log("PDF fetched, size:", pdfData.byteLength);
    
    // Extract text directly using our CDN-based function
    const extractedText = await extractTextFromPDF(pdfData);
    
    console.log("EXTRACTION RESULT:", extractedText);
    return extractedText;
  } catch (error) {
    console.error("PDF extraction test failed:", error);
    return "Test failed: " + error.message;
  }
};

// Preload PDF.js when the app starts
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Try to preload PDF.js
    loadPDFJS().catch(error => {
      console.warn("Preloading PDF.js failed, will try again when needed:", error);
    });
  });
}
