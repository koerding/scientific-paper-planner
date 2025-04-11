// FILE: scripts/convertSectionContent.js
// Complete conversion script to migrate from the old text-based format to the new structured format
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
  let collectingTooltip = false;
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
      collectingTooltip = false;
    }
    // If paragraph is in italics, it's likely a tooltip
    else if (paragraph.startsWith('*') && paragraph.endsWith('*') && !paragraph.startsWith('**')) {
      // Extract the tooltip content (remove the * markers)
      currentTooltip = paragraph.substring(1, paragraph.length - 1).trim();
      collectingTooltip = false;
    }
    // If we're not in any special case, it could be additional instruction text
    else if (currentTitle && !collectingTooltip && !currentTooltip) {
      // Append to current instruction if we haven't found a tooltip yet
      currentInstruction += ' ' + paragraph;
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
 * @returns {string} - The intro text
 */
function extractIntroText(text) {
  if (!text) return '';
  
  // Find the first bold heading
  const firstBoldHeadingMatch = text.match(/\s*\*\*[^*]+:/);
  if (!firstBoldHeadingMatch) return text.trim();
  
  const firstBoldHeadingIndex = text.indexOf(firstBoldHeadingMatch[0]);
  if (firstBoldHeadingIndex <= 0) return '';
  
  // Extract everything before the first heading
  return text.substring(0, firstBoldHeadingIndex).trim();
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
  
  // Create the new section structure with intro text and subsections
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
      subsectionCount: section.subsections?.length || 0
    }));
    
    console.log('\nConversion statistics:');
    console.log('---------------------');
    sectionStats.forEach(stat => {
      console.log(`Section ${stat.id}: ${stat.subsectionCount} subsections`);
    });
    console.log(`Total sections: ${newData.sections.length}`);
    console.log(`Total subsections: ${sectionStats.reduce((sum, stat) => sum + stat.subsectionCount, 0)}`);
    
    // Write the new JSON file (replacing the old one)
    const jsonOutputPath = path.join(__dirname, '../src/data/sectionContent.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(newData, null, 2));
    console.log(`\nNew JSON file created at: ${jsonOutputPath}`);
    
    // Also create a JavaScript module version
    const jsOutputPath = path.join(__dirname, '../src/data/sectionContent.js');
    const jsContent = `// FILE: src/data/sectionContent.js
// Restructured data format with explicit subsections for cleaner AI processing
// Generated by conversion script on ${new Date().toISOString()}

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
