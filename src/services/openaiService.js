// src/services/openaiService.js

// Replace this with your actual OpenAI API key (this will use the environment variable)
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// This is a helper function to call the OpenAI API
export const callOpenAI = async (prompt, currentSection, userInputs, sections) => {
  try {
    // Find the current section object
    const currentSectionObj = sections.find(s => s.id === currentSection);
    
    // Helper to format instructions text
    const formatInstructions = (section) => {
      return `${section.instructions.title}\n\n${section.instructions.description}\n\n${section.instructions.workStep.title}\n\n${section.instructions.workStep.content}`;
    };
    
    // Construct the system message based on current section
    let systemMessage = "You are an AI assistant helping a scientist design a research project. You are Konrad Kording, with a somewhat unconventional informal voice. You are a worldclass scientific writer.";
    
    // Add the section-specific instructions
    systemMessage += "\n\nHere are the instructions for this section:\n" + formatInstructions(currentSectionObj);
    
    // Add specific LLM instructions for this section
    if (currentSectionObj.llmInstructions) {
      systemMessage += "\n\nFollow these specific guidelines when responding:\n" + currentSectionObj.llmInstructions;
    }
    
    // Build conversation history with context
    const contextMessages = [];
    
    // Add the complete context from ALL sections
    contextMessages.push({
      role: "system",
      content: "CONTEXT FROM ALL SECTIONS:\n\n" + 
        sections.map(section => {
          if (section.id === 'philosophy') {
            // Import philosophyOptions from JSON file
            const philosophyOptions = {
              'descriptive': 'Descriptive questions/hypotheses aim to describe aspects of the world without assigning meaning to the finding.',
              'mechanistic': 'Mechanistic questions ask how components of a system give rise to outcomes at a higher level.',
              'normative': 'Normative questions ask how a given outcome at a high level can be seen as being useful in the niche of the animal.',
              'evolution': 'Evalution questions ask how a given outcome evolved by requiring distinct species or fossil records.',
              'representation': 'Representation questions ask how activities in brains relate to stimuli or behaviors.',
              'developmental': 'Developmental questions ask how change during an organism\'s lifetime gives rise to outcomes.',
              'combination': 'Combination questions ask how above questions relate, e.g. about the mechanism of development.'
            };
            
            const selectedPhilosophies = userInputs.philosophy
              .map(id => `- ${philosophyOptions[id]}`)
              .join('\n');
            
            return `SECTION: ${section.title}\n${selectedPhilosophies || "No selections made yet"}`;
          } else {
            return `SECTION: ${section.title}\n${userInputs[section.id] || "Not completed yet"}`;
          }
        }).join('\n\n')
    });
    
    // Add the specific content of the current section for emphasis
    if (userInputs[currentSection]) {
      if (currentSection === 'philosophy') {
        const philosophyOptions = {
          'descriptive': 'Descriptive questions/hypotheses',
          'mechanistic': 'Mechanistic questions',
          'normative': 'Normative questions',
          'evolution': 'Evolution questions',
          'representation': 'Representation questions',
          'developmental': 'Developmental questions',
          'combination': 'Combination questions'
        };
        
        const selectedPhilosophies = userInputs.philosophy
          .map(id => philosophyOptions[id])
          .join(', ');
        
        contextMessages.push({
          role: "system",
          content: `CURRENT FOCUS: The user has selected the following research philosophies: ${selectedPhilosophies}`
        });
      } else {
        contextMessages.push({
          role: "system",
          content: `CURRENT FOCUS: The user is working on the "${sections.find(s => s.id === currentSection).title}" section with the following current content:\n\n${userInputs[currentSection]}`
        });
      }
    }
    
    // Building the messages array for the API call
    const messages = [
      { role: "system", content: systemMessage },
      ...contextMessages,
      { role: "user", content: prompt }
    ];

    // Log the complete message payload being sent to OpenAI
    console.log("\n=== SENDING TO CHATGPT ===");
    console.log("Section:", currentSection);
    console.log("User Query:", prompt);
    console.log("Complete Message Payload:");
    console.log(JSON.stringify(messages, null, 2));
    console.log("===============================\n");

    // Make the API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo", // You can change this to a different model as needed
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error Response:", errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Log the response from OpenAI
    console.log("\n=== RECEIVED FROM CHATGPT ===");
    console.log("Response:", data.choices[0].message.content.substring(0, 100) + "...");
    console.log("===============================\n");
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Sorry, there was an error communicating with the AI assistant. Please check the browser console for more details.";
  }
};
