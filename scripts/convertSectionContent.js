// FILE: scripts/convertSectionContent.js
// Fixed conversion script to migrate from the old text-based format to the new structured format
// - Correctly handles distinction between bold (**) and italic (*) text
// - Extracts only italic text (*text*) as tooltips for each subsection
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
 * Check if a paragraph is in italics (starts and ends with a single asterisk)
 * This carefully avoids matching bold text with double asterisks
 * @param {string} text - The paragraph to check
 * @returns {boolean} - True if the text is formatted as italics
 */
function isItalicText(text) {
  // Trims the text and checks if it starts with exactly one asterisk and ends with exactly one asterisk
  const trimmed = text.trim();
  return trimmed.startsWith('*') && 
         trimmed.endsWith('*') && 
         !trimmed.startsWith('**') && 
         !trimmed.endsWith('**');
}

/**
 * Extract tooltip text from an italicized paragraph
 * @param {string} text - The italicized text (with * markers)
 * @returns {string} - The extracted tooltip text without the markers
 */
function extractTooltipFromItalicText(text) {
  if (!isItalicText(text)) return '';
  
  // Remove the first and last asterisk
  const trimmed = text.trim();
  return trimmed.substring(1, trimmed.length - 1).trim();
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
    // Pattern specifically for bold headings like "**Title: Instruction.**"
    const boldHeadingMatch = paragraph.match(/^\s*\*\*([^:*]+):\s*([^*]+)\*\*\s*$/);
    
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
      
      // Look ahead for an italicized paragraph that might be the tooltip
      if (i + 1 < paragraphs.length && isItalicText(paragraphs[i + 1])) {
        currentTooltip = extractTooltipFromItalicText(paragraphs[i + 1]);
        // Skip this paragraph in the next iteration
        i++;
      }
    }
    // If the paragraph is italic text and we're in a subsection but no tooltip yet
    else if (currentTitle && isItalicText(paragraph) && !currentTooltip) {
      currentTooltip = extractTooltipFromItalicText(paragraph);
    }
    // If the paragraph is not a heading or italic and we're in a subsection
    else if (currentTitle && !isItalicText(paragraph)) {
      // Append to current instruction
      currentInstruction += (currentInstruction ? ' ' : '') + paragraph;
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
  // Split into paragraphs and keep only non-italic ones
  const introParagraphs = introText.split(/\n\n+/).filter(para => !isItalicText(para.trim()));
  
  return introParagraphs.join('\n\n').trim();
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
      subsectionsWithTooltips: section.subsections?.filter(sub => sub.tooltip && sub.tooltip.length > 0).length || 0
    }));
    
    console.log('\nConversion statistics:');
    console.log('---------------------');
    sectionStats.forEach(stat => {
      console.log(`Section ${stat.id}: ${stat.subsectionCount} subsections | With tooltips: ${stat.subsectionsWithTooltips}/${stat.subsectionCount}`);
    });
    console.log(`Total sections: ${newData.sections.length}`);
    console.log(`Total subsections: ${sectionStats.reduce((sum, stat) => sum + stat.subsectionCount, 0)}`);
    console.log(`Total tooltips: ${sectionStats.reduce((sum, stat) => sum + stat.subsectionsWithTooltips, 0)}`);
    
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
// - Extracted only italicized text (*text*) as tooltips for each subsection
// - Properly distinguished between bold (**text**) and italic (*text*) formatting

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
