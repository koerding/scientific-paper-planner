/**
 * Service for interacting with the OpenAI API.
 * UPDATED: Reads API Key and Model from environment variables instead of storageService.
 * Includes previous debugging logs inside buildMessages.
 */
// Removed: import { getStoredPreferences } from './storageService';

// Function to build the message history with context
const buildMessages = (prompt, contextType, userInputs, sections) => {
  const systemMessage = `You are a helpful assistant for planning scientific papers. Context type: ${contextType}.`;
  const messages = [{ role: 'system', content: systemMessage }];

  // *** DEBUG LOG: Log the entire received sections array ***
  console.log(`[openaiService buildMessages] Received sections (${Array.isArray(sections) ? sections.length : 'Not an array'}):`, JSON.stringify(sections, null, 2)); // Pretty print JSON

  // Add section context safely
  if (Array.isArray(sections)) {
    sections.forEach((section, index) => { // Add index for logging

      // *** DEBUG LOG: Log each section being processed ***
      console.log(`[openaiService buildMessages] Processing section index ${index}:`, JSON.stringify(section)); // Log the raw section object

      // Check if section and its properties are valid before accessing
      if (section && typeof section === 'object' && section.id && section.title && section.instructions) {
          const instructionDesc = section.instructions.description || '';
          const workStepTitle = section.instructions.workStep?.title || '';
          const workStepContent = section.instructions.workStep?.content || '';

          const instructionText = `${instructionDesc} ${workStepTitle} ${workStepContent}`.trim();
          const userInput = userInputs && section.id ? (userInputs[section.id] || '') : ''; // Should be string or check type

          // Ensure userInput is a string if userInputs exists
          const safeUserInput = (typeof userInput === 'string' ? userInput : JSON.stringify(userInput)) || 'N/A';

          messages.push({
              role: 'user', // Or 'assistant'? Decide based on desired AI perspective
              content: `Context for Section "${section.title}" (ID: ${section.id}):
Instructions: ${instructionText || 'N/A'}
Current User Input: ${safeUserInput}`
          });
      } else {
          // Log if a section object is invalid/incomplete
          console.error(`[openaiService buildMessages] Invalid or incomplete section object at index ${index}:`, section);
      }
    });
  } else {
       console.error("[openaiService buildMessages] Received 'sections' argument is not an array:", sections);
  }

  // Add the main prompt message
  messages.push({ role: 'user', content: prompt });
  console.log("[openaiService buildMessages] Final messages array:", messages); // Log final structure
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
  // *** FIX: Read API Key and Model from Environment Variables ***
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo"; // Use env variable or default

  const apiUrl = "https://api.openai.com/v1/chat/completions"; // Standard API endpoint

  if (!apiKey) {
    console.error("OpenAI API key is missing. Ensure REACT_APP_OPENAI_API_KEY is set.");
    // Return an error message that will be caught by the calling service
    throw new Error("OpenAI API key not configured in environment variables.");
  }

  console.log(`[openaiService callOpenAI] Calling API. Context: ${contextType}, Model: ${model}`);

  const messages = buildMessages(prompt, contextType, userInputs, sections);

  const body = JSON.stringify({
    model: model, // Use the model from env var or default
    messages: messages,
    temperature: options.temperature ?? 0.7, // Use provided temp or default
    max_tokens: options.max_tokens ?? 1024, // Use provided max_tokens or default
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
    console.log("[openaiService callOpenAI] API Response OK:", data);

    // Extract the response content
    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        console.error("No response content found in API data:", data);
        throw new Error("Received empty or invalid response content from API.");
    }
    return responseContent;

  } catch (error) {
    console.error("Error calling OpenAI API:", error); // Log the specific error here
    // Re-throw the error so the calling service can handle it appropriately
    throw error; // Make sure the calling function (in instructionImprovementService) catches this
  }
};
