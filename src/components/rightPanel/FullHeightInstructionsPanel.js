// Updated renderCustomMarkdown function in FullHeightInstructionsPanel.js
// This properly handles strikethrough for both the instruction text AND the regular text paragraphs

const renderCustomMarkdown = (content) => {
  if (!content) return null;
  
  // First, create segments by splitting on code blocks, so we don't process markdown inside code
  const segments = content.split(/(```[\s\S]*?```)/g);
  
  return (
    <div>
      {segments.map((segment, segmentIndex) => {
        // If this is a code block, render it directly without processing
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const code = segment.slice(3, -3);
          return (
            <pre key={segmentIndex} className="bg-gray-100 p-3 rounded overflow-auto my-4">
              <code>{code}</code>
            </pre>
          );
        }
        
        // Split the segment into paragraphs first
        const paragraphs = segment.split(/\n\n+/);
        
        return (
          <div key={segmentIndex}>
            {paragraphs.map((paragraph, paragraphIndex) => {
              // Skip empty paragraphs
              if (!paragraph.trim()) return null;
              
              // Check if paragraph has strikethrough (~~text~~)
              const hasStrikethrough = paragraph.includes('~~');
              
              // Process strikethrough for entire paragraph if needed
              if (hasStrikethrough) {
                // Check if the entire paragraph is strikethrough
                if (paragraph.startsWith('~~') && paragraph.endsWith('~~')) {
                  const innerContent = paragraph.substring(2, paragraph.length - 2);
                  return (
                    <p key={paragraphIndex} className="my-4 line-through text-gray-500 opacity-70">
                      {renderFormattedContent(innerContent)}
                    </p>
                  );
                }
              }
              
              // Check if this is a heading
              if (paragraph.startsWith('# ')) {
                const headingText = paragraph.substring(2);
                return <h1 key={paragraphIndex} className="text-3xl font-bold my-5">{renderFormattedContent(headingText)}</h1>;
              }
              
              if (paragraph.startsWith('## ')) {
                const headingText = paragraph.substring(3);
                return <h2 key={paragraphIndex} className="text-2xl font-bold my-4">{renderFormattedContent(headingText)}</h2>;
              }
              
              if (paragraph.startsWith('### ')) {
                const headingText = paragraph.substring(4);
                return <h3 key={paragraphIndex} className="text-xl font-bold my-3">{renderFormattedContent(headingText)}</h3>;
              }
              
              // Check if this is a list item
              if (paragraph.startsWith('* ') || paragraph.startsWith('- ') || /^\d+\.\s/.test(paragraph)) {
                // For list items, we'll split by line and create a list
                const listItems = paragraph.split(/\n/).filter(item => item.trim());
                
                // Check if this is a numbered list
                const isNumbered = /^\d+\.\s/.test(listItems[0]);
                
                const ListTag = isNumbered ? 'ol' : 'ul';
                const listClasses = isNumbered ? 'list-decimal pl-5 my-4' : 'list-disc pl-5 my-4';
                
                return (
                  <ListTag key={paragraphIndex} className={listClasses}>
                    {listItems.map((item, itemIndex) => {
                      // Remove the bullet or number
                      let itemText = item;
                      if (isNumbered) {
                        itemText = item.replace(/^\d+\.\s/, '');
                      } else {
                        itemText = item.replace(/^[*-]\s/, '');
                      }
                      
                      // Check if the entire item has strikethrough
                      const hasCompleteStrikethrough = 
                        itemText.startsWith('~~') && 
                        itemText.endsWith('~~') && 
                        itemText.length > 4;
                      
                      // Check if the entire text should be strikethrough
                      // FIXED: Now handle both cases - explicit strikethrough markers and bullets followed by strikethrough
                      if (hasCompleteStrikethrough) {
                        const innerText = itemText.substring(2, itemText.length - 2);
                        // Apply strikethrough to the entire list item content
                        return (
                          <li key={itemIndex} className={`${customStyles.listItem} line-through text-gray-500 opacity-70`}>
                            {renderFormattedContent(innerText)}
                          </li>
                        );
                      } 
                      // Check if the item contains a mix of strikethroughs
                      else if (itemText.includes('~~')) {
                        return (
                          <li key={itemIndex} className={customStyles.listItem}>
                            {renderFormattedContent(itemText)} 
                          </li>
                        );
                      }
                      // Regular item
                      else {
                        return (
                          <li key={itemIndex} className={customStyles.listItem}>
                            {renderFormattedContent(itemText)}
                          </li>
                        );
                      }
                    })}
                  </ListTag>
                );
              }
              
              // Regular paragraph - FIXED: Handle strikethrough at paragraph level too
              if (hasStrikethrough && paragraph.match(/~~[^~]+~~/)) {
                // This paragraph contains strikethrough sections but is not entirely strikethrough
                return (
                  <p key={paragraphIndex} className="my-4">
                    {renderFormattedContent(paragraph)}
                  </p>
                );
              } else {
                return (
                  <p key={paragraphIndex} className="my-4">
                    {renderFormattedContent(paragraph)}
                  </p>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

// Main helper for rendering formatted content with bold, italic (tooltips), strikethrough
const renderFormattedContent = (text) => {
  if (!text) return null;
  
  // FIXED: Process strikethrough first, before other formatting
  // This ensures strikethrough works consistently with other formatting
  const strikethroughParts = text.split(/(~~[^~]+~~)/g);
  
  return strikethroughParts.map((part, strikeIndex) => {
    // Check if this is strikethrough text
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      // Extract the strikethrough text and process remaining formatting
      const strikeText = part.substring(2, part.length - 2);
      return (
        <span key={`strike-${strikeIndex}`} className="line-through text-gray-500 opacity-70">
          {processFormattingExceptStrikethrough(strikeText, `strike-${strikeIndex}`)}
        </span>
      );
    } else {
      // Regular text, process other formatting
      return processFormattingExceptStrikethrough(part, `regular-${strikeIndex}`);
    }
  });
};

// Process bold and italic formatting
const processFormattingExceptStrikethrough = (text, keyPrefix) => {
  if (!text) return null;
  
  // Split by bold markers
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  
  // Process each part - either bold or regular text
  return boldParts.map((part, boldIndex) => {
    const partKey = `${keyPrefix}-bold-${boldIndex}`;
    
    // Check if this is bold text
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      // Extract the bold text and return as strong
      const boldText = part.substring(2, part.length - 2);
      return <strong key={partKey} className="font-bold">{processItalics(boldText, partKey)}</strong>;
    } else {
      // Regular text, check for italics
      return processItalics(part, partKey);
    }
  });
};

// Additional CSS to ensure strikethrough is visible
const additionalStyles = `
/* Ensure strikethrough is properly styled and visible */
.instructions-content .line-through,
.instructions-content strong.line-through,
.instructions-content p.line-through,
.instructions-content li.line-through,
.instructions-content *[style*="text-decoration: line-through"] {
  text-decoration: line-through !important;
  color: #6B7280 !important;
  opacity: 0.7 !important;
}

/* Ensure tooltips in strikethrough text still look right */
.instructions-content .line-through .tooltip-container .info-icon {
  color: #6B7280 !important;
  background-color: #F3F4F6 !important;
}

/* Make sure strikethrough applies to the entire content */
.instructions-content ul li.line-through,
.instructions-content ol li.line-through {
  text-decoration: line-through !important;
  color: #6B7280 !important;
  opacity: 0.7 !important;
}
`;
