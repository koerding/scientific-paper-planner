// FILE: src/services/documentProcessor.js

/**
 * Document processor service for extracting text from various document formats
 * Refactored to use centralized CDNLoader for library loading
 */
import { loadPdfJs, loadMammoth, loadDocumentLibraries } from '../utils/cdnLoader';

/**
 * Loads the necessary PDF.js library - using centralized CDNLoader
 * @returns {Promise} Resolves when library is loaded
 */
export const loadPDFJS = async () => {
  return loadPdfJs();
};

/**
 * Extracts text from a PDF file
 * @param {ArrayBuffer} pdfData - The PDF data
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromPDF = async (pdfData) => {
  try {
    // Make sure PDF.js is loaded using our centralized loader
    if (!window.pdfjsLib) await loadPdfJs();
    
    const loadingTask = window.pdfjsLib.getDocument({data: pdfData});
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPagesToProcess = Math.min(pdf.numPages, 20);
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += `--- Page ${pageNum} ---\n` + strings.join(' ') + '\n\n';
        if (fullText.length > 30000) {
          fullText = fullText.substring(0, 30000) + "... [TRUNCATED]";
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
 * Extract text from a document file
 * @param {File} file - The document file
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromDocument = async (file) => {
  console.log(`Attempting to extract text from: ${file.name}, type: ${file.type}`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        let extractedText = `Filename: ${file.name}\nFiletype: ${file.type}\nSize: ${Math.round(file.size / 1024)} KB\n\n`;

        // PDF Extraction Logic
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          console.log("Processing as PDF...");
          try {
            // Ensure PDF.js is loaded
            await loadPdfJs();
            const pdfText = await extractTextFromPDF(arrayBuffer);
            extractedText = `${extractedText}\n\n${pdfText}`;
            console.log("PDF text extracted. Length:", extractedText.length);
            resolve(extractedText);
          } catch (pdfError) {
            console.error('Error extracting PDF text:', pdfError);
            extractedText = `${extractedText}\n\n[Error extracting PDF text: ${pdfError.message}]`;
            resolve(extractedText);
          }
        }
        // Handle DOCX files (if mammoth is available)
        else if ((file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 file.name.toLowerCase().endsWith('.docx'))) {
          console.log("Processing as DOCX...");
          try {
            // Load mammoth through our centralized loader
            await loadMammoth();
            
            if (typeof window.mammoth === 'undefined') {
              throw new Error("Mammoth library not available");
            }
            
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            let docxText = result.value || '';
            if (docxText.length > 15000) { // Limit length
              docxText = docxText.substring(0, 15000) + "... [TRUNCATED]";
            }
            extractedText = `${extractedText}\n\n${docxText}`;
            console.log("DOCX text extracted. Length:", extractedText.length);
            resolve(extractedText);
          } catch (docxError) {
            console.error('Error extracting DOCX text:', docxError);
            extractedText = `${extractedText}\n\n[Error extracting DOCX text: ${docxError.message}]`;
            resolve(extractedText);
          }
        }
        // Handle other types - just extract filename and metadata
        else {
          extractedText = `${extractedText}\n\n[This file format cannot be processed directly. Processing metadata only.]`;
          resolve(extractedText);
        }
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

// Preload libraries when appropriate - using our centralized loaders
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload document libraries in the background after page load
    loadDocumentLibraries().catch(error => {
      console.warn("Preloading document libraries failed:", error);
    });
  });
}
