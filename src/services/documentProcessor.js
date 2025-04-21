// FILE: src/services/documentProcessor.js

/**
 * Document processor service for extracting text from various document formats
 * Provides a clean API for other services to use without duplicating code
 */

/**
 * Loads the necessary PDF.js library
 * @returns {Promise} Resolves when library is loaded
 */
export const loadPDFJS = async () => {
  // Only load if it's not already loaded
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      console.log("PDF.js loaded from CDN successfully");
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js loaded but pdfjsLib not found in window"));
      }
    };
    script.onerror = () => {
      console.error("Failed to load PDF.js from CDN");
      reject(new Error("Failed to load PDF.js from CDN"));
    };
    document.body.appendChild(script);
  });
};

/**
 * Extracts text from a PDF file
 * @param {ArrayBuffer} pdfData - The PDF data
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromPDF = async (pdfData) => {
  try {
    if (!window.pdfjsLib) await loadPDFJS();
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
                 file.name.toLowerCase().endsWith('.docx')) && typeof window.mammoth !== 'undefined') {
          console.log("Processing as DOCX...");
          try {
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

/**
 * Loads mammoth.js (DOCX parser) if not already loaded
 * @returns {Promise<void>} Resolves when library is loaded
 */
export const loadMammoth = async () => {
  if (window.mammoth) return window.mammoth;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.17/mammoth.browser.min.js';
    script.async = true;
    script.onload = () => {
      console.log("Mammoth.js loaded from CDN successfully");
      if (window.mammoth) {
        resolve(window.mammoth);
      } else {
        reject(new Error("Mammoth.js loaded but not found in window"));
      }
    };
    script.onerror = () => {
      console.error("Failed to load Mammoth.js from CDN");
      reject(new Error("Failed to load Mammoth.js from CDN"));
    };
    document.body.appendChild(script);
  });
};

// Preload libraries when appropriate
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload PDF.js in the background after page load
    loadPDFJS().catch(error => {
      console.warn("Preloading PDF.js failed:", error);
    });
  });
}
