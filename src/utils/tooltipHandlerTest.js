// FILE: src/utils/tooltipHandlerTest.js
// This file is for testing the tooltip extraction and restoration functionality

/**
 * Extracts tooltips from text and replaces them with special markers
 * Handles both single tooltips and tooltip pairs in the same italic block
 * @param {string} text - Original text with tooltips
 * @returns {object} - Object with processed text and tooltips map
 */
export const extractTooltipsBeforeAI = (text) => {
  if (!text) return { text: '', tooltips: {} };
  
  const tooltips = {};
  
  // First look for tooltip pairs (*__TOOLTIP_X____TOOLTIP_Y__Content*)
  // These are the special cases where two tooltips share the same content
  let processedText = text;
  const tooltipPairsRegex = /\*(__TOOLTIP_\d+__)(__TOOLTIP_\d+__)([^*]+)\*/g;
  
  processedText = processedText.replace(tooltipPairsRegex, (match, tooltip1, tooltip2, content) => {
    // Extract the tooltip numbers
    const num1 = tooltip1.match(/\d+/)[0];
    const num2 = tooltip2.match(/\d+/)[0];
    
    // Store the content for each tooltip
    tooltips[tooltip1] = content.trim();
    tooltips[tooltip2] = content.trim();
    
    // Replace with a special marker format that's more likely to be preserved
    return `[TOOLTIP_MARKER_${num1}][TOOLTIP_MARKER_${num2}]`;
  });
  
  // Then handle regular single tooltips with standard approach
  let counter = Object.keys(tooltips).length;
  
  // Protect any existing __TOOLTIP_N__ placeholders that weren't part of pairs
  const protectedText = processedText.replace(/__TOOLTIP_(\d+)__/g, (match, num) => {
    // Only replace if not already in our tooltips map
    if (!tooltips[match]) {
      return `[TOOLTIP_MARKER_${num}]`;
    }
    return match;
  });
  
  // Then replace remaining *italic* with numbered placeholders
  const finalText = protectedText.replace(/\*([^*\n]+)\*/g, (match, content) => {
    // Skip if it already contains tooltip markers
    if (content.includes('[TOOLTIP_MARKER_')) {
      return match;
    }
    
    const placeholder = `[TOOLTIP_MARKER_${counter}]`;
    tooltips[`__TOOLTIP_${counter}__`] = content.trim();
    counter++;
    return placeholder;
  });
  
  return { 
    text: finalText, 
    tooltips 
  };
};

/**
 * Restores tooltips from placeholders
 * Handles tooltip markers in the enhanced format
 * @param {string} text - Text with tooltip placeholders
 * @param {Object} tooltips - Map of placeholders to tooltip contents
 * @returns {string} - Text with tooltips restored
 */
export const restoreTooltipsAfterAI = (text, tooltips) => {
  if (!text || !tooltips || Object.keys(tooltips).length === 0) return text;
  
  // Replace each marker with the original tooltip content
  let restoredText = text;
  
  for (const [placeholder, content] of Object.entries(tooltips)) {
    // Get the tooltip number
    const num = placeholder.match(/\d+/)[0];
    
    // Look for the enhanced marker format first
    const markerPattern = new RegExp(`\\[TOOLTIP_MARKER_${num}\\]`, 'g');
    restoredText = restoredText.replace(markerPattern, `*${content}*`);
    
    // Also try the original format as fallback
    restoredText = restoredText.replace(new RegExp(placeholder, 'g'), `*${content}*`);
  }
  
  return restoredText;
};

/**
 * Run test cases for tooltip extraction and restoration
 */
export const runTooltipTests = () => {
  console.log("Running tooltip extraction and restoration tests:");
  
  // Test Case 1: Single Tooltip
  const test1 = "A test with a *simple tooltip* in it";
  console.log("\nTest Case 1: Single tooltip");
  console.log("Original:", test1);
  const result1 = extractTooltipsBeforeAI(test1);
  console.log("Processed:", result1.text);
  console.log("Tooltips:", result1.tooltips);
  const restored1 = restoreTooltipsAfterAI(result1.text, result1.tooltips);
  console.log("Restored:", restored1);
  console.log("Test 1 success:", restored1 === test1);
  
  // Test Case 2: Tooltip Pair
  const test2 = "A test with *__TOOLTIP_0____TOOLTIP_1__shared tooltip content* in it";
  console.log("\nTest Case 2: Tooltip pair");
  console.log("Original:", test2);
  const result2 = extractTooltipsBeforeAI(test2);
  console.log("Processed:", result2.text);
  console.log("Tooltips:", result2.tooltips);
  const restored2 = restoreTooltipsAfterAI(result2.text, result2.tooltips);
  console.log("Restored:", restored2);
  console.log("Test 2 success:", test2.includes("shared tooltip content") && restored2.includes("*shared tooltip content*"));
  
  // Test Case 3: Mixed Content with Multiple Tooltips
  const test3 = "Text with *__TOOLTIP_0____TOOLTIP_1__first shared content* and then *__TOOLTIP_2____TOOLTIP_3__second shared content* plus a *regular tooltip*";
  console.log("\nTest Case 3: Mixed tooltips");
  console.log("Original:", test3);
  const result3 = extractTooltipsBeforeAI(test3);
  console.log("Processed:", result3.text);
  console.log("Tooltips:", result3.tooltips);
  const restored3 = restoreTooltipsAfterAI(result3.text, result3.tooltips);
  console.log("Restored:", restored3);
  console.log("Test 3 contains first content:", restored3.includes("*first shared content*"));
  console.log("Test 3 contains second content:", restored3.includes("*second shared content*"));
  console.log("Test 3 contains regular tooltip:", restored3.includes("*regular tooltip*"));
  
  // Test Case 4: OpenAI Response Simulation (markers get removed)
  const test4 = "A test with *__TOOLTIP_0____TOOLTIP_1__shared tooltip content* in it";
  console.log("\nTest Case 4: OpenAI handling simulation (markers removed)");
  console.log("Original:", test4);
  const result4 = extractTooltipsBeforeAI(test4);
  console.log("Processed with markers:", result4.text);
  
  // Simulate what OpenAI might do - replace markers with empty strings
  const aiProcessed = result4.text.replace(/\[TOOLTIP_MARKER_\d+\]/g, '');
  console.log("After AI (markers removed):", aiProcessed);
  
  // Try to restore anyway
  const restored4 = restoreTooltipsAfterAI(aiProcessed, result4.tooltips);
  console.log("Restoration attempt:", restored4);
  console.log("NOTE: In real usage, if OpenAI removes markers completely, restoration won't be possible");
  
  // Test Case 5: Enhanced Format - with different marker format
  const test5 = "A test with *__TOOLTIP_0____TOOLTIP_1__shared tooltip content* in it";
  console.log("\nTest Case 5: Enhanced marker format");
  console.log("Original:", test5);
  const { text: processedText, tooltips } = extractTooltipsBeforeAI(test5);
  console.log("Processed with enhanced markers:", processedText);
  
  // Simulate what OpenAI might do with the enhanced markers - hopefully preserve them
  const aiPreserved = processedText;
  const restored5 = restoreTooltipsAfterAI(aiPreserved, tooltips);
  console.log("Restored with preserved markers:", restored5);
  console.log("Test 5 success:", restored5.includes("*shared tooltip content*"));
  
  console.log("\nAll tests completed. Using [TOOLTIP_MARKER_X] format should improve tooltip handling.");
};

// Run the tests if this file is executed directly
if (typeof window !== 'undefined' && window.location.href.includes('tooltipTest')) {
  runTooltipTests();
}

// Export functions for use in the application
export default {
  extractTooltipsBeforeAI,
  restoreTooltipsAfterAI,
  runTooltipTests
};
