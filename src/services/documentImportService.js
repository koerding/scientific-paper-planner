// FILE: src/services/documentImportService.js

/**
 * Document import service using sectionContent.json as source of truth
 * Elegant implementation with minimal code duplication
 */
import { callOpenAI } from './openaiService';
import { buildSystemPrompt, buildTaskPrompt } from '../utils/promptUtils';
import sectionContent from '../data/sectionContent.json';
import mammoth from 'mammoth';

// Import PDF.js from CDN when needed
export const loadPDFJS = async () => {
  if (window.pdfjsLib) return window.pdfjsLib;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js loaded but pdfjsLib not found in window"));
      }
    };
    
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
    document.body.appendChild(script);
  });
};

/**
 * Extract text from PDF using PDF.js
 */
const extractTextFromPDF = async (pdfData) => {
  try {
    if (!window.pdfjsLib) await loadPDFJS();
    
    const pdf = await window.pdfjsLib.getDocument({data: pdfData}).promise;
    const maxPagesToProcess = Math.min(pdf.numPages, 20);
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
        
        // Limit text length
        if (fullText.length > 15000) {
          return fullText.substring(0, 15000) + "... [TRUNCATED]";
        }
      } catch (err) {
        fullText += `[Error extracting page ${pageNum}]\n\n`;
      }
    }
    
    return fullText;
  } catch (error) {
    throw new Error(`PDF extraction error: ${error.message}`);
  }
};

/**
 * Extract text from any document type (PDF/DOCX)
 */
const extractTextFromDocument = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = '';
        
        // PDF handling
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfText = await extractTextFromPDF(arrayBuffer);
          extractedText = `Filename: ${file.name}\n\n${pdfText}`;
        }
        // DOCX handling
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx')) && typeof mammoth !== 'undefined') {
          const result = await mammoth.extractRawText({ arrayBuffer });
          let docxText = result.value || '';
          if (docxText.length > 15000) {
            docxText = docxText.substring(0, 15000) + "... [TRUNCATED]";
          }
          extractedText = `Filename: ${file.name}\n\n${docxText}`;
        }
        // Unsupported file type
        else {
          reject(new Error(`Unsupported file type: ${file.type || file.name}`));
          return;
        }

        resolve(extractedText);
      } catch (error) {
        reject(new Error(`Document extraction error: ${error.message}`));
      }
    };
    
    reader.onerror = (error) => reject(new Error(`File reading error: ${error.message}`));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Get section metadata by ID
 */
const getSectionById = (id) => sectionContent.sections.find(s => s.id === id);

/**
 * Get all sections of a specific type (approach, data method, etc.)
 */
const getSectionsByType = (type) => {
  const typeMap = {
    'approach': ['hypothesis', 'needsresearch', 'exploratoryresearch'],
    'dataMethod': ['experiment', 'existingdata', 'theorysimulation'],
    'required': ['question', 'audience', 'relatedpapers', 'analysis', 'process', 'abstract']
  };
  
  return (typeMap[type] || []).map(id => getSectionById(id)).filter(Boolean);
};

/**
 * Validate the paper structure using sectionContent.json as reference
 */
function validateResearchPaper(paper) {
  if (!paper?.userInputs) return false;
  
  // Check required fields have content
  const requiredValid = getSectionsByType('required').every(section => 
    typeof paper.userInputs[section.id] === 'string' && 
    paper.userInputs[section.id].length > 10
  );
  
  // Check exactly one research approach is present
  const approachFields = getSectionsByType('approach').map(s => s.id);
  const presentApproaches = approachFields.filter(id => 
    paper.userInputs[id]?.length > 0
  );
  
  // Check exactly one data method is present
  const dataFields = getSectionsByType('dataMethod').map(s => s.id);
  const presentDataMethods = dataFields.filter(id => 
    paper.userInputs[id]?.length > 0
  );
  
  return requiredValid && presentApproaches.length === 1 && presentDataMethods.length === 1;
}

/**
 * Generate placeholder content using sectionContent.json
 */
function generatePlaceholderContent(sectionId, fileName) {
  const section = getSectionById(sectionId);
  if (!section) return "Content not available.";
  
  // Use placeholder from sectionContent but customize slightly
  const topic = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  
  return section.placeholder.replace(/\[.*?\]/g, match => {
    // Replace placeholders with topic-specific content
    if (match.includes("variable") || match.includes("Variable"))
      return `[Variables related to ${topic}]`;
    if (match.includes("description"))
      return `[Description about ${topic}]`;
    return match;
  });
}

/**
 * Build paper extraction prompt from sectionContent.json
 */
function buildExtractionPrompt(documentText, fileName) {
  // Get section information directly from sectionContent
  const approachSections = getSectionsByType('approach');
  const dataMethodSections = getSectionsByType('dataMethod');
  
  // Build a dynamic prompt using section metadata
  return `
    Extract a complete scientific paper structure from the document text.
    
    Be VERY GENEROUS in your interpretation - read between the lines and create a high-quality educational example.
    
    You MUST choose EXACTLY ONE research approach:
    ${approachSections.map(s => `- ${s.title}: ${s.introText?.substring(0, 100) || ''}`).join('\n')}
    
    You MUST choose EXACTLY ONE data collection method:
    ${dataMethodSections.map(s => `- ${s.title}: ${s.introText?.substring(0, 100) || ''}`).join('\n')}
    
    Return in this exact JSON format:
    {
      "userInputs": {
        ${sectionContent.sections.map(section => {
          // For each section, include format guidance based on the placeholder
          const format = section.placeholder.replace(/\n/g, '\\n');
          return `"${section.id}": "${format}"`;
        }).join(',\n        ')}
      },
      "chatMessages": {},
      "timestamp": "${new Date().toISOString()}",
      "version": "1.0-extraction"
    }
    
    Document text:
    ${documentText.substring(0, 8000)}... [truncated]
  `;
}

/**
 * Main import function using sectionContent.json as source of truth
 */
export async function importDocumentContent(file) {
  try {
    // Pre-load PDF.js if needed
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try { await loadPDFJS(); } catch (e) { console.warn("PDF.js loading failed:", e); }
    }
    
    // Extract document text
    const documentText = await extractTextFromDocument(file);
    
    // Build OpenAI prompts using sectionContent structure
    const systemPrompt = "You are creating educational scientific paper examples from documents.";
    const extractionPrompt = buildExtractionPrompt(documentText, file.name);
    
    // Call OpenAI with JSON mode
    const result = await callOpenAI(
      extractionPrompt,
      'document_import',
      {},
      [],
      { temperature: 0.3, max_tokens: 3000 },
      [],
      systemPrompt,
      true // Use JSON mode
    );
    
    // Validate result structure
    if (validateResearchPaper(result)) {
      // Add metadata and return
      result.timestamp = result.timestamp || new Date().toISOString();
      result.version = result.version || '1.0-extraction';
      result.chatMessages = result.chatMessages || {};
      return result;
    }
    
    // Attempt fallback with simplified prompt
    console.log("Attempting simplified extraction fallback...");
    const fallbackResult = await attemptFallbackExtraction(file.name, documentText);
    
    if (validateResearchPaper(fallbackResult)) {
      return fallbackResult;
    }
    
    throw new Error("Failed to extract valid paper structure");
  } catch (error) {
    console.error("Document import error:", error);
    
    // Return graceful error object
    return createErrorResponse(file.name, error.message);
  }
}

/**
 * Attempt fallback extraction with simpler prompt
 */
async function attemptFallbackExtraction(fileName, documentText = "") {
  try {
    // Build a more constrained prompt focused on exactly what we need
    const fallbackPrompt = `
      Create a scientific paper example based on "${fileName}".
      
      Include EXACTLY one research approach (${getSectionsByType('approach').map(s => s.id).join('/')}),
      and EXACTLY one data method (${getSectionsByType('dataMethod').map(s => s.id).join('/')}).
      
      Return JSON with these exact field names:
      ${JSON.stringify(sectionContent.sections.map(s => s.id))}
    `;
    
    // Create basic result with placeholder content for key sections
    const fallbackResult = await callOpenAI(
      fallbackPrompt,
      'document_import_fallback',
      {},
      [],
      { temperature: 0.4, max_tokens: 3000 },
      [],
      "Create an educational example with required sections. Be creative but precise.",
      true
    );
    
    // Fill any missing sections with placeholders
    const allSectionIds = sectionContent.sections.map(s => s.id);
    allSectionIds.forEach(id => {
      if (!fallbackResult.userInputs[id] || fallbackResult.userInputs[id].length < 20) {
        fallbackResult.userInputs[id] = generatePlaceholderContent(id, fileName);
      }
    });
    
    fallbackResult.timestamp = new Date().toISOString();
    fallbackResult.version = '1.0-fallback';
    fallbackResult.chatMessages = {};
    
    return fallbackResult;
  } catch (error) {
    throw new Error(`Fallback extraction failed: ${error.message}`);
  }
}

/**
 * Create error response object
 */
function createErrorResponse(fileName, errorMsg) {
  return {
    userInputs: {
      question: `Research Question: Import Error\n\nSignificance/Impact: Could not process ${fileName}. Error: ${errorMsg}`,
      hypothesis: "Import failed. Please try a different file or create content manually.",
      abstract: `Document import failed for ${fileName}. Please check the file format and try again.`,
    },
    chatMessages: {},
    timestamp: new Date().toISOString(),
    version: '1.0-error',
  };
}

// Preload PDF.js when the app starts
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    loadPDFJS().catch(error => {
      console.warn("Preloading PDF.js failed:", error);
    });
  });
}
