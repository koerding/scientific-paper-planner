/**
 * Service for interacting with the OpenAI API.
 * UPDATED: Added stricter check inside forEach loop in buildMessages to prevent processing undefined elements.
 * Corrected syntax error (removed extra trailing brace).
 */
// Reads API Key and Model from Environment Variables
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo"; // Use env variable or default

// Function to build the message history with context
const buildMessages = (prompt, contextType, userInputs, sections) => {
  const systemMessage = `You are a helpful assistant for planning scientific papers. Context type: ${contextType}.`;
  const messages = [{ role: 'system', content: systemMessage }];

  // Log the received sections array once
  console.log(`[openaiService buildMessages] Received sections (${Array.isArray(sections) ? sections.length : 'Not an array'}):`, sections);

  // Add section context safely
  if (Array.isArray(sections)) {
    sections.forEach((section, index) => {
      // *** FIX: Add strict check for valid section object at the start of the loop iteration ***
      if (!section || typeof section !== 'object' || !section.id || !section.title || !section.instructions) {
          console.warn(`[openaiService buildMessages] Skipping invalid or incomplete section object at index ${index}:`, section);
          return; // Skip this iteration entirely
      }

      // Now we know 'section' and its core properties are valid
      const instructionDesc = section.instructions.description || '';
      const workStepTitle = section.instructions.workStep?.title || '';
      const workStepContent = section.instructions.workStep?.content || '';
      const instructionText = `${instructionDesc} ${workStepTitle} ${workStepContent}`.trim();

      // Check userInputs exists before accessing section.id
      const userInput = userInputs && section.id ? (userInputs[section.id] || '') : '';
      const safeUserInput = (typeof userInput === 'string' ? userInput : JSON.stringify(userInput)) || 'N/A';

      messages.push({
          role: 'user',
          content: `Context for Section "${section.title}" (ID: ${section.id}):
Instructions: ${instructionText || 'N/A'}
Current User Input: ${safeUserInput}`
      });
    });
  } else {
       console.error("[openaiService buildMessages] Received 'sections' argument is not an array:", sections);
  }

  // Add the main prompt message
  messages.push({ role: 'user', content: prompt });
  // console.log("[openaiService buildMessages] Final messages array:", messages); // Optional: keep if you want to see final structure
  return messages;
};


// Main function to call the OpenAI API
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [], // Default to empty array
    options = {}
 ) => {

  const apiUrl = "https://api.openai.com/v1/chat/completions";

  if (!apiKey) {
    console.error("OpenAI API key is missing. Ensure REACT_APP_OPENAI_API_KEY is set.");
    throw new Error("OpenAI API key not configured in environment variables.");
  }

  console.log(`[openaiService callOpenAI] Calling API. Context: ${contextType}, Model: ${model}`);

  // Build messages using the refined function
  const messages = buildMessages(prompt, contextType, userInputs, sections);

  const body = JSON.stringify({
    model: model,
    messages: messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
  });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("OpenAI API Error:", response.status, errorBody);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorBody?.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    console.log("[openaiService callOpenAI] API Response OK"); // Simplified log on success

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        console.error("No response content found in API data:", data);
        throw new Error("Received empty or invalid response content from API.");
    }
    return responseContent;

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    // Re-throw error so the calling service (instructionImprovementService) can handle it
    throw error;
  }
};

// Removed extra closing brace from here
