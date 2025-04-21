// FILE: src/utils/cdnLoader.js

/**
 * Utilities for dynamically loading external JavaScript libraries from CDN
 */

/**
 * Dynamically load an external library from CDN
 * @param {string} url - The URL of the library to load
 * @returns {Promise} - Resolves when the library is loaded
 */
export const loadExternalLibrary = (url) => {
  return new Promise((resolve, reject) => {
    // Check if the script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      console.log(`Library already loaded: ${url}`);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      console.log(`Library loaded: ${url}`);
      resolve();
    };
    script.onerror = () => {
      console.error(`Failed to load library: ${url}`);
      reject(new Error(`Failed to load library: ${url}`));
    };
    document.body.appendChild(script);
  });
};

/**
 * Dynamically load multiple libraries in parallel
 * @param {Array<string>} urls - Array of URLs to load
 * @returns {Promise} - Resolves when all libraries are loaded
 */
export const loadMultipleLibraries = async (urls) => {
  try {
    await Promise.all(urls.map(url => loadExternalLibrary(url)));
    return true;
  } catch (error) {
    console.error("Failed to load one or more libraries:", error);
    throw error;
  }
};

/**
 * Load common document processing libraries
 * @returns {Promise} - Resolves when libraries are loaded
 */
export const loadDocumentLibraries = async () => {
  try {
    await loadMultipleLibraries([
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.17/mammoth.browser.min.js'
    ]);
    
    // Configure PDF.js worker
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    return true;
  } catch (error) {
    console.error("Failed to load document libraries:", error);
    throw error;
  }
};

/**
 * Load export-related libraries (jsPDF, docx, markdown-it)
 * @returns {Promise} - Resolves when libraries are loaded
 */
export const loadExportLibraries = async () => {
  try {
    await loadMultipleLibraries([
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://unpkg.com/docx@5.0.2/build/index.js',
      'https://unpkg.com/markdown-it@12.3.2/dist/markdown-it.min.js'
    ]);
    return true;
  } catch (error) {
    console.error("Failed to load export libraries:", error);
    throw error;
  }
};
