// FILE: scripts/migrateSectionContent.js
// Script to migrate the old text-based instruction format to the new structured format with subsections
// Run this script from the project root: node scripts/migrateSectionContent.js

const fs = require('fs');
const path = require('path');

// Function to extract subsections from text instructions
function extractSubsections(text) {
  if (!text) return [];
  
  const subsections = [];
  
  // Split text into lines for processing
  const lines = text.split('\n');
  
  // Variables to track current subsection
  let currentTitle = '';
  let currentInstruction = '';
  let tooltipText = '';
  let collectingTooltip = false;
  let subsectionId = 0;
  
  // Process lines sequentially
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Pattern for bold headings like "**Instruction: Detail.**"
    const boldHeadingMatch = line.match(/\*\*([^:*]+):([^*]+)\*\*/);
    
    // Start of a new subsection
    if (boldHeadingMatch) {
      // Save previous subsection if there is one
      if (currentTitle && (currentInstruction || tooltipText)) {
        subsections.push({
          id: `subsection_${subsectionId++}`,
          title: currentTitle.trim(),
          instruction: currentInstruction.trim(),
          tooltip: tooltipText.trim()
        });
        
        // Reset for next subsection
        tooltipText = '';
      }
      
      // Extract new subsection title and instruction
      currentTitle = boldHeadingMatch[1].trim();
      currentInstruction = boldHeadingMatch[2].trim();
      collectingTooltip = false;
    }
    // Start collecting tooltip text when we see an italic marker
    else if (line.startsWith('*') && !line.startsWith('**')) {
      collectingTooltip = true;
      // Add the content without the * markers
      tooltipText += line.replace(/^\*|\*$/g, '').trim() + ' ';
    }
    // Continue collecting tooltip text
    else if (collectingTooltip && line && !line.startsWith('**')) {
      tooltipText += line + ' ';
    }
    // End of tooltip when we hit a blank line
    else if (collectingTooltip && !line.trim()) {
      collectingTooltip = false;
    }
  }
  
  // Add the last subsection if there is one
  if (currentTitle && (currentInstruction || tooltipText)) {
    subsections.push({
      id: `subsection_${subsectionId++}`,
      title: currentTitle.trim(),
      instruction: currentInstruction.trim(),
      tooltip: tooltipText.trim()
    });
  }
  
  return subsections;
}

// Function to extract intro text (before the first subsection)
function extractIntroText(text) {
  if (!text) return '';
  
  // Find the first bold heading
  const firstBoldHeadingIndex = text.indexOf('**');
  if (firstBoldHeadingIndex <= 0) return text.trim();
  
  // Extract everything before the first heading
  return text.substring(0, firstBoldHeadingIndex).trim();
}

// Main migration function
async function migrateSectionContent() {
  try {
    // Load the original section content
    const sourcePath = path.join(__dirname, '../src/data/sectionContent.json');
    const originalData = require(sourcePath);
    
    if (!originalData || !originalData.sections) {
      console.error('Invalid source data structure');
      return;
    }
    
    // Create the new structure
    const newData = {
      title: originalData.title,
      version: '2.0',
      sections: []
    };
    
    // Process each section
    for (const section of originalData.sections) {
      if (!section || !section.id) continue;
      
      const instructionsText = section.instructions?.text || '';
      
      // Create the new section structure
      const newSection = {
        ...section,
        introText: extractIntroText(instructionsText),
        subsections: extractSubsections(instructionsText)
      };
      
      // Add to new sections array
      newData.sections.push(newSection);
      
      console.log(`Processed section ${section.id}: Found ${newSection.subsections.length} subsections`);
    }
    
    // Write the new data to a JavaScript module file
    const outputPath = path.join(__dirname, '../src/data/sectionContent.js');
    const jsContent = `// FILE: src/data/sectionContent.js
// Restructured data format with explicit subsections for cleaner AI processing

export const sectionContent = ${JSON.stringify(newData, null, 2)};

// To maintain backward compatibility with existing code
export default {
  title: sectionContent.title,
  sections: sectionContent.sections
};
`;

    // Write the file
    fs.writeFileSync(outputPath, jsContent);
    console.log(`Migration complete! New file created at: ${outputPath}`);
    
    // Also create a JSON backup for reference
    const jsonOutputPath = path.join(__dirname, '../src/data/sectionContent-structured.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(newData, null, 2));
    console.log(`Backup JSON created at: ${jsonOutputPath}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateSectionContent();
