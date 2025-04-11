// FILE: scripts/convertSectionContent.js
// Improved conversion script to migrate from the old text-based format to the new structured format
// - Extracts italicized text (*text*) as tooltips for each subsection
// - Removes llmInstructions fields that are no longer used
// Run this script from the project root: node scripts/convertSectionContent.js

const fs = require('fs');
const path = require('path');

/**
 * Generates a safe ID from a title
 * @param {string} title - The title to convert to an ID
 * @param {string} sectionId - The parent section ID
 * @param {number} index - The index of the subsection
 * @returns {string} - A safe ID
 */
function generateSafeId(title, sectionId, index) {
  if (!title) return `${sectionId}_subsection_${index}`;
  
  return `${sectionId}_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30)}`;
}

/**
 * Extract italicized text (marked with * *) for use as tooltip
 * @param {string} text - The instruction text
 * @returns {string} - Extracted tooltip text or empty string
 */
function extractTooltipFromText(text) {
  if (!text) return '';
  
  // Look for text enclosed in single asterisks: *tooltip text*
  const tooltipMatch = text.match(/\*([^*]+)\*/);
  return tooltipMatch ? tooltipMatch[1].trim() : '';
}

/**
 * Extract subsections from a text-based instruction format
 * @param {string} text - The instruction text
 * @param {string} sectionId - The parent section ID
 * @returns {Array} - Array of subsection objects
 */
function extractSubsections(text, sectionId) {
  if (!text) return [];
  
  const subsections = [];
  
  // Split text into paragraphs for processing
  const paragraphs = text.split(/\n\n+/);
  
  // Keep track of the current subsection
  let currentTitle = '';
  let currentInstruction = '';
  let currentTooltip = '';
  let subsectionIndex = 0;
  
  // Process each paragraph
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
    // Check if this is a subsection heading (bold text with a colon)
    // Pattern for bold headings like "**Title: Instruction.**"
    const boldHeadingMatch = paragraph.match(/\s*\*\*([^:*]+):([^*]+)\*\*\s*/);
    
    if (boldHeadingMatch) {
      // If we were collecting a previous subsection, save it
      if (currentTitle) {
        subsections.push({
          id: generateSafeId(currentTitle, sectionId, subsectionIndex++),
          title: currentTitle.trim(),
          instruction: currentInstruction.trim(),
          tooltip: currentTooltip.trim()
        });
        
        // Reset for next subsection
        currentTooltip = '';
      }
      
      // Extract new subsection title and instruction
      currentTitle = boldHeadingMatch[1].trim();
      currentInstruction = boldHeadingMatch[2].trim();
      
      // Look for an italicized paragraph following this heading for tooltip
      if (i + 1 < paragraphs.length) {
        const nextParagraph = paragraphs[i + 1].trim();
        // Check if it's enclosed in asterisks (italics)
        if (nextParagraph.startsWith('*') && nextParagraph.endsWith('*')) {
          // Extract tooltip text (remove the * markers)
          currentTooltip = nextParagraph.substring(1, nextParagraph.length - 1).trim();
          // Skip this paragraph in the next iteration
          i++;
        }
      }
    }
    // If the paragraph is not a heading and we're in a subsection
    else if (currentTitle && !paragraph.startsWith('*') && !paragraph.endsWith('*')) {
      // Append to current instruction
      currentInstruction += ' ' + paragraph;
    }
    // If it's an italicized paragraph and we don't have a tooltip yet
    else if (currentTitle && paragraph.startsWith('*') && paragraph.endsWith('*') && !currentTooltip) {
      // Extract tooltip text (remove the * markers)
      currentTooltip = paragraph.substring(1, paragraph.length - 1).trim();
    }
  }
  
  // Add the last subsection if there is one
  if (currentTitle) {
    subsections.push({
      id: generateSafeId(currentTitle, sectionId, subsectionIndex++),
      title: currentTitle.trim(),
      instruction: currentInstruction.trim(),
      tooltip: currentTooltip.trim()
    });
  }
  
  return subsections;
}

/**
 * Extract the introductory text (content before first subsection)
 * @param {string} text - The full instruction text
 * @returns {string} - The intro text without any italicized content
 */
function extractIntroText(text) {
  if (!text) return '';
  
  // Find the first bold heading
  const firstBoldHeadingMatch = text.match(/\s*\*\*[^*]+:/);
  if (!firstBoldHeadingMatch) return text.trim();
  
  const firstBoldHeadingIndex = text.indexOf(firstBoldHeadingMatch[0]);
  if (firstBoldHeadingIndex <= 0) return '';
  
  // Extract everything before the first heading
  let introText = text.substring(0, firstBoldHeadingIndex).trim();
  
  // Remove any italicized paragraphs (tooltips) from the intro
  introText = introText.replace(/\*[^*]+\*/g, '').trim();
  
  return introText;
}

/**
 * Convert the old section format to the new structured format
 * @param {Object} section - The section to convert
 * @returns {Object} - The converted section
 */
function convertSection(section) {
  if (!section || !section.id) return section;
  
  // Extract the text-based instructions
  const instructionsText = section.instructions?.text || '';
  
  // Create a new section object without the llmInstructions field
  const newSection = {
    ...section,
    introText: extractIntroText(instructionsText),
    subsections: extractSubsections(instructionsText, section.id)
  };
  
  // Remove the old instructions format
  if (newSection.instructions) {
    delete newSection.instructions.text;
    
    // If the instructions object is now empty, remove it entirely
    if (Object.keys(newSection.instructions).length === 0) {
      delete newSection.instructions;
    }
  }
  
  // Remove the llmInstructions field that's no longer used
  if (newSection.hasOwnProperty('llmInstructions')) {
    delete newSection.llmInstructions;
  }
  
  return newSection;
}

/**
 * Main conversion function
 */
async function convertSectionContent() {
  try {
    console.log('Starting conversion of section content...');
    
    // Load the original section content
    const sourcePath = path.join(__dirname, '../src/data/sectionContent.json');
    const originalData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    
    if (!originalData || !originalData.sections) {
      console.error('Error: Invalid source data structure');
      process.exit(1);
    }
    
    // Create the new structure
    const newData = {
      title: originalData.title,
      version: '2.0', // New version to indicate the structured format
      sections: originalData.sections.map(section => convertSection(section))
    };
    
    // Generate statistics for logging
    const sectionStats = newData.sections.map(section => ({
      id: section.id,
      subsectionCount: section.subsections?.length || 0,
      hasTooltips: section.subsections?.some(sub => sub.tooltip && sub.tooltip.length > 0) || false
    }));
    
    console.log('\nConversion statistics:');
    console.log('---------------------');
    sectionStats.forEach(stat => {
      console.log(`Section ${stat.id}: ${stat.subsectionCount} subsections | Tooltips: ${stat.hasTooltips ? 'Yes' : 'No'}`);
    });
    console.log(`Total sections: ${newData.sections.length}`);
    console.log(`Total subsections: ${sectionStats.reduce((sum, stat) => sum + stat.subsectionCount, 0)}`);
    
    // Check for sections without tooltips
    const sectionsWithoutTooltips = sectionStats.filter(stat => !stat.hasTooltips && stat.subsectionCount > 0);
    if (sectionsWithoutTooltips.length > 0) {
      console.warn('\nWARNING: The following sections have subsections without tooltips:');
      sectionsWithoutTooltips.forEach(stat => {
        console.warn(`- ${stat.id}`);
      });
    }
    
    // Write the new JSON file
    const jsonOutputPath = path.join(__dirname, '../src/data/sectionContent.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(newData, null, 2));
    console.log(`\nNew JSON file created at: ${jsonOutputPath}`);
    
    // Also create a JavaScript module version
    const jsOutputPath = path.join(__dirname, '../src/data/sectionContent.js');
    const jsContent = `// FILE: src/data/sectionContent.js
// Restructured data format with explicit subsections and tooltips extracted from italicized text
// Generated by conversion script on ${new Date().toISOString()}
// - Removed llmInstructions fields that are no longer used
// - Extracted italicized text as tooltips for each subsection

export const sectionContent = ${JSON.stringify(newData, null, 2)};

// For backward compatibility with existing code
export default sectionContent;
`;

    fs.writeFileSync(jsOutputPath, jsContent);
    console.log(`JavaScript module created at: ${jsOutputPath}`);
    
    // Create a backup of the original file for safety
    const backupPath = path.join(__dirname, '../src/data/sectionContent.json.bak');
    fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2));
    console.log(`Original data backed up to: ${backupPath}`);
    
    console.log('\nConversion complete!');
    
  } catch (error) {
    console.error('Conversion failed:', error);
    process.exit(1);
  }
}

// Run the conversion
convertSectionContent();
