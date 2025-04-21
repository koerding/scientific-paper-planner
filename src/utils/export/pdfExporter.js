// FILE: src/utils/export/pdfExporter.js

/**
 * PDF exporter for the Scientific Paper Planner
 */
import { getFormattedContent, promptForFilename } from './exportBase';
import { loadExternalLibrary } from '../cdnLoader';

/**
 * Exports the project as a PDF file using jsPDF
 * @param {Object} userInputs - The user inputs
 * @param {Object} chatMessages - The chat messages (unused but kept for consistency)
 * @param {Object} sectionContent - The section content (unused but kept for consistency)
 * @returns {boolean} - Success flag
 */
export const exportAsPdf = async (userInputs, chatMessages, sectionContent) => {
  try {
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    loadingMessage.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl">
        <div class="flex items-center">
          <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generating PDF document...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingMessage);
    
    // Get filename
    const safeFileName = promptForFilename('pdf');
    if (!safeFileName) {
      document.body.removeChild(loadingMessage);
      return false;
    }
    
    // Load the jsPDF library from CDN
    try {
      await Promise.all([
        loadExternalLibrary('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        loadExternalLibrary('https://unpkg.com/markdown-it@12.3.2/dist/markdown-it.min.js')
      ]);
    } catch (error) {
      console.error("Failed to load PDF libraries:", error);
      document.body.removeChild(loadingMessage);
      alert("Failed to load the PDF generation libraries. Please try again or use a different format.");
      return false;
    }
    
    // Check if the libraries loaded correctly
    if (!window.jspdf || !window.markdownit) {
      console.error("PDF libraries not found in global scope");
      document.body.removeChild(loadingMessage);
      alert("PDF generation libraries failed to initialize. Please try again or use a different format.");
      return false;
    }
    
    // Get formatted content
    const markdownContent = getFormattedContent(userInputs);
    
    // Convert markdown to HTML for better formatting
    const md = window.markdownit();
    const htmlContent = md.render(markdownContent);
    
    // Create a hidden div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set font settings
    pdf.setFont('helvetica');
    pdf.setFontSize(11);
    
    // Calculate page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // 20mm margins
    const contentWidth = pageWidth - (margin * 2);
    
    // Process HTML content into simpler structure for PDF
    const sections = [];
    
    // Process h1 headers (main title)
    const h1Elements = tempDiv.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      sections.push({
        type: 'h1',
        text: h1.textContent,
      });
    }
    
    // Process h2 headers (section headers) and paragraphs
    const h2Elements = tempDiv.querySelectorAll('h2');
    for (const h2 of h2Elements) {
      sections.push({
        type: 'h2',
        text: h2.textContent,
      });
      
      // Get all content until the next h2
      let nextElement = h2.nextElementSibling;
      while (nextElement && nextElement.tagName !== 'H2') {
        if (nextElement.tagName === 'P') {
          sections.push({
            type: 'p',
            text: nextElement.textContent,
          });
        }
        nextElement = nextElement.nextElementSibling;
      }
    }
    
    // Draw content to PDF
    let y = margin;
    
    for (const section of sections) {
      // Set styling based on content type
      if (section.type === 'h1') {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 139); // dark blue
      } else if (section.type === 'h2') {
        // Check if we need a new page
        if (y > pageHeight - margin * 2) {
          pdf.addPage();
          y = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 100); // medium blue
        
        // Add some extra spacing before new sections
        y += 5;
      } else {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // black
      }
      
      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(section.text, contentWidth);
      
      // Check if we need a new page
      if (y + (lines.length * 7) > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      
      // Draw text
      pdf.text(lines, margin, y);
      
      // Update y position for next content
      y += (lines.length * 7) + (section.type === 'h1' || section.type === 'h2' ? 5 : 3);
    }
    
    // Save the PDF
    pdf.save(safeFileName);
    
    // Clean up
    document.body.removeChild(tempDiv);
    document.body.removeChild(loadingMessage);
    
    console.log("Project exported successfully as PDF:", safeFileName);
    return true;
  } catch (error) {
    console.error("Error exporting project as PDF:", error);
    
    // Remove loading message if present
    const loadingMessage = document.querySelector('.fixed.inset-0.bg-gray-600.bg-opacity-50');
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
    
    alert("There was an error exporting the project as PDF: " + (error.message || "Unknown error"));
    return false;
  }
};
