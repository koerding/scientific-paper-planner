/**
 * Service for interacting with the OpenAI API.
 * Uses environment variables. Reads single 'instructions.text'. Logs removed.
 */
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
const model = process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo";

// Function to build the message history with context
const buildMessages = (prompt, contextType, userInputs, sections) => {
  const systemMessage = `You are a helpful assistant for planning scientific papers. Context type: ${contextType}.`;
  const messages = [{ role: 'system', content: systemMessage }];

  // Add section context safely using the new 'instructions.text'
  if (Array.isArray(sections)) {
    sections.forEach((section, index) => {
      // Strict check for valid section object at the start of the loop iteration
      if (!section || typeof section !== 'object' || !section.id || !section.title || !section.instructions || typeof section.instructions.text !== 'string') {
          // console.warn(`[openaiService buildMessages] Skipping invalid or incomplete section object at index ${index}:`, section); // Keep warn if needed
          return; // Skip this iteration entirely
      }

      const instructionText = section.instructions.text;
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

  messages.push({ role: 'user', content: prompt });
  return messages;
};

// Main function to call the OpenAI API
export const callOpenAI = async (
    prompt,
    contextType = "general",
    userInputs = {},
    sections = [],
    options = {}
 ) => {

  const apiUrl = "https://api.openai.com/v1/chat/completions";

  if (!apiKey) {
    console.error("OpenAI API key is missing. Ensure REACT_APP_OPENAI_API_KEY is set.");
    throw new Error("OpenAI API key not configured in environment variables.");
  }

  // console.log(`[openaiService callOpenAI] Calling API. Context: ${contextType}, Model: ${model}`); // Removed log
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
    // console.log("[openaiService callOpenAI] API Response OK"); // Removed log

    const responseContent = data.choices?.[0]?.message?.content?.trim();
    if (!responseContent) {
        console.error("No response content found in API data:", data);
        throw new Error("Received empty or invalid response content from API.");
    }
    return responseContent;

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};
