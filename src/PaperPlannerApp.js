import React, { useState, useEffect } from 'react';
import { callOpenAI } from './services/openaiService';
import ReactMarkdown from 'react-markdown';

const PaperPlannerApp = () => {
  // Define sections with instructions from document
  const sections = [
    { 
      id: 'question', 
      title: 'Question', 
      type: 'text',
      instructions: `A SPECIFIED QUESTION

The cornerstone of scientific inquiry is selecting a well-defined question. Ask yourself: What do you want to study and why? A strong question can drive understanding, foster innovation, and solve real-world problems. Consider who else might share your interest. Often, a well-crafted question serves as a conceptual model that frames reality in distinct ways.

WORK STEP 1A: QUESTION

Draft your question in detail—spend about 5 minutes on your initial version and plan to refine it as you gain new insights. You may have to revisit this as you go through this design work. It is ok if it starts out being suboptimal. Just write your best idea of the question you want to work on. Include a brief explanation of why this question matters to you (objectives).

Make a list of scientists who will also care about the question. We recommend starting with about 5 to have a crosssection of the field.`,
      llmInstructions: `Above I wrote down the scientific question I want to ask. I also wrote down why this question is important to me and who else would be interested in this question. I want you to check if the question feels like a good question for scientific inquiry. I want you to list strengths and weaknesses of this question. I want you to check if the question well matches the expressed reasons for wanting to answer that question, and I want you to make a list of strengths/weaknesses in the match between question and objectives. I want you to evaluate to which level the listed scientists really would find this question interesting, again in terms of pros and cons. For the list I would also like you to give me 5 more professors that may be interested, ideally some that may be even more interested in the topic.`
    },
    { 
      id: 'hypothesis', 
      title: 'Hypothesis', 
      type: 'text',
      instructions: `MULTIPLE SPECIFIED HYPOTHESES

A strong scientific question invites at least two plausible explanations, leading to distinct interpretations. It thus has a consequential answer—the result will change how you or others approach the field in the future. A detailed question asks if we should prefer one hypothesis over others, which can be decided by data. Ideally, hypotheses should be expressed in precise terms—whether mathematically or through computational models.

When formulating your hypotheses, clarify whether they are novel or have been previously tested, and if the latter, emphasize the importance of replication. And make sure they are fully specified with every word clearly defined. They should specify which exact scenarios they apply to. Finally, verify that you can express your hypotheses as a mathematical model or equation that predicts data probabilities—a key step for robust statistical analysis.

WORK STEP 1B: HYPOTHESES

Draft your hypotheses in detail (spend about 5 minutes initially), and remember that early versions can be refined later. You may also have to revisit this as you go through this design work. It is ok if it starts out being suboptimal. Just write your best idea of the hypotheses you want to distinguish.

Also include relevance: why it matters to distinguish these hypotheses.

Make a list of papers that are most similar at the hypotheses they test so far. We recommend starting with about 5 to somewhat define the field.`,
      llmInstructions: `Only work on Step 1b. Above I wrote down the scientific hypotheses I want to test. I also wrote down why it matters to distinguish these hypotheses. I also wrote out a list of relevant papers. I want you to list strengths and weaknesses of the hypotheses. To check if distinguishing between the hypotheses would be consequential, if it would change the research others would do or lead to products. To check if they are mutually exclusive. I want you to check to which level the listed papers are among the closest to the proposed test and to also supply a list of five more papers that may be more relevant.`
    },
    { 
      id: 'philosophy', 
      title: 'Philosophy', 
      type: 'checklist',
      instructions: `WORK STEP 1D: NEUROSCIENCE PHILOSOPHY

Clarity about question logic is essential. There are a small number of canonical questions in neuroscience (ignore this list if you are not a neuroscientist). Choose one question type and confirm the requirement.`,
      llmInstructions: `Only work on step 1C -really lets only talk philosophy here. Check the users choice of a question time and make sure it logically agrees with both their question and their hypotheses. If it does not, suggest changes in either this classification or the question/hypothesis pair. Give a few examples if possible. Do all this interactively with the user in a socrates style dialogue`
    },
    { 
      id: 'experiment', 
      title: 'Experiment', 
      type: 'text',
      instructions: `DESIGN AN EXPERIMENT THAT CAN DISTINGUISH BETWEEN THE HYPOTHESES

Another important aspect of science is how we get the data we need to answer the question. How can we make sure the data is of high quality? How can we avoid biases? How can we make sure the hypotheses are cleanly tested? Do you have preliminary data for planning?

Some overarching ideas to generate strong experiments:
● Sketch how the experiment will convincingly produce the right data.
● Ensure you are not conducting the experiment simply because it is feasible in your lab.
● If possible, simulate experiments first.
● Ask yourself which other questions can be answered with the dataset.

There are many methods that might inadvertently favor a preferred hypothesis. Rigorous experimental design uses practices that minimize the risk of self-deception.
● If you deal with human evaluations, understand the need for blinding, lest you see what you want.
● If you use resources, know how to validate. Otherwise you can not replicate
● If you ask mechanistic questions, you likely need to perturb, consider potential confounders.
● Ensure you are asking the question in the most direct way possible. Indirect answers are unreliable.
● If performing perturbations to test causality, randomize them or you will be biased.
● Ensure all aspects of the study are reproducible, by making sure you report everything.
● If you use instruments, make sure they are calibrated and validated.
● Have some diversity of analysed samples to be able to speak to internal validity and think through external validity.
● Make sure you have the ethical side, ACUC and IRB covered.

WORK STEP 2: EXPERIMENT DESIGN

Write out how you plan to run the experiment. You may also have to revisit this as you go through this design work. It is ok if it starts out being suboptimal. Just write your best idea for the experiment you want to use to distinguish the hypotheses. This will have to include stimulus protocols, apparatus, sample size, recruitment strategy, all the things that are meaningfully part of your experimental design.

Also, write down exactly how the distinct hypotheses will predict measurements that will be distinct. A lot of experiments are designed in such a way that the data does not really distinguish between the hypotheses.`,
      llmInstructions: `Only work on step 2 so only give feedback on the experimental design. See the instructions above and guide the user interactively towards designing a good experiment given questions and hypotheses. Consider that question and hypotheses may also require revision. Use Socrates method where possible. I want you to guide the discussion to the following topics: I want you to check if the experiment tests the hypotheses set up above. I want you to check if it does so as directly as possible. Lastly, I want to go through the above mentioned potential rigor problems and help the user make sure they do not violate any of them. Focus on the ones that matter for their design. Feel free to interactively refine this with the user. I want you to be super constructive and make proposals to improve the experimental design.`
    },
    { 
      id: 'analysis', 
      title: 'Data Analysis', 
      type: 'text',
      instructions: `A third aspect of science is how we convert the data into a concrete preference for one hypothesis. How can we make sure the data is used in an unbiased way? How can we know how uncertain we are? How can we make sure we are not fooling ourselves in the data analysis?

Some Ideas to generate strong data analysis plans
● Consider validating your analysis approach on simulated or pilot data to ensure reliability.
● Write down what you extract from the data and how each hypothesis expects different extractions.
● Implement hypotheses mathematically so they assign compatibility between hypothesis and data (taking care of free parameters).
● Pre-register your data analysis plan and maintain a detailed log of any deviations from the original protocol to ensure complete transparency and minimize bias.

AVOID THE DATA ANALYSIS RIGOR TRAPS
There are so many ways how we our data analysis pipeline can favor a hypothesis we like. The key about doing rigorous data analysis is to use practices that minimize the probability of misleading ourselves.
● Use the most direct data analysis strategy to answer your question to avoid misleading answers.
● Know what outcome switching is and have a plan to avoid it.
● Be aware statistical power and plan your study large enough.
● Be aware of human biases (such as conflict of interest) and have a plan to avoid them.
● Store and handle data in a replicable and shareable manner.
● Use a good quantification metric (one that approximates what we care about).
● If using machine learning, understand and avoid data leakage.
● If asking multiple questions, consider the false discovery rate.
● If you can, pre-register the study.

WORK STEP 3: DATA ANALYSIS
Write out how you plan to analyze the expected data. The key is that the input are the data as measured. You will then probably want to do some sanity checks. Then this will cumulate in an analysis that assigns probabilities to hypotheses. Write out how you will quantify uncertainty (say p-values). Also consider how you will handle free parameters that you may need to fit.`,
      llmInstructions: `I want you to check if the data analysis pipeline cleanly tests the hypotheses set up above based on the experiment described above. I want you to check if it does so as directly and cleanly as possible. Lastly, I want to go through the above mentioned potential rigor problems and help the user make sure they do not violate any of them. Focus on the ones that matter for their design. Feel free to interactively refine this with the user. I want you to be super constructive and make proposals to improve the data analysis design.`
    },
    { 
      id: 'process', 
      title: 'Process', 
      type: 'text',
      instructions: `A fourth aspect of science is how we use processes and skills that allow us to do good science that is meaningful and works well in a community.

WORK STEP 4: PROCESSES
Write out the skills you will need and the collaborations you may need to cover skills you do not currently have. Make a timeline of how long each task in the pipeline will take you. (5 minutes max).

SKILLS
● You have the conceptual understanding to choose a good question of the chosen complexity—or the time to learn. This is an area where spending time with experienced scientists are super useful.
● You have the experimental skills to run the experiment or the ability to reuse the relevant dataset—or the time to learn.
● You have the coding/stats skills to decide between the hypotheses using the data—or the time to learn.
● Ensure you have the right team or the time to learn and acquire the necessary skills. We live in an age where major scientific advances are made by collaborative teams rather than lone "geniuses."

COLLABORATIONS
● Science today is a collaborative effort. Ensure you work effectively with others.
● You need to have a code/data sharing plan to enable replication and extensions of your work.
● Are you developing code that others can readily use? Because one day, you will be like them - you are effectively collaborating with your future self.
● Ensure others can check all your experiments and analyses. Science benefits from transparency and error correction. This includes reporting all analyses you did and sharing all data.

TIMELINE
How much time will each piece of this project take? Consider potential obstacles.
● Unrealistic timelines cause scientific projects to fail.
● Everything usually takes twice as long as expected—budget for that.`,
      llmInstructions: `I want you to check the resulting statements. Do they go well after skill and potentially needed collaborations? Brainstorm anything that might be missing in an interactive way. Is the timeline realistic? Brainstorm potential timeline problems. Be super constructive`
    },
    { 
      id: 'abstract', 
      title: 'Abstract', 
      type: 'text',
      instructions: `5: TEST ALL BY WRITING AN ABSTRACT
To check if everything logically fits together, write an abstract. It should have the following structure, with each component being 1-2 sentences.
● The field and the intuitive hypothesis—why it matters.
● The methods used (e.g., "Here, we test the hypothesis using…").
● The results (even if speculative)—how they distinguish between hypotheses.
● The implications for the field.

WORK STEP 5: ABSTRACT WRITING
Write an abstract. This may take an hour, time that is very well spent.

Now. It is time to make sure that it works.
Share your abstract with a peer and carefully consider their feedback to improve clarity and coherence.`,
      llmInstructions: `I want you to check the resulting abstract. Does it fit the requested format? Does it feel convincing? Is it well written? Is the language clear? What changes would make it more powerful? Be super constructive. Use the socrates method. Go a bit with the user through what they learned as part of this exercise. What will they do better next time`
    }
  ];

  // Philosophy options
  const philosophyOptions = [
    { id: 'descriptive', label: 'Descriptive questions/hypotheses aim to describe aspects of the world without assigning meaning to the finding. No requirements.' },
    { id: 'mechanistic', label: 'Mechanistic questions ask how components of a system give rise to outcomes at a higher level. They require causal insights and generally require perturbations.' },
    { id: 'normative', label: 'Normative questions ask how a given outcome at a high level can be seen as being useful in the niche of the animal (e.g., "a memory of location allows you to find home"). They require information about the niche.' },
    { id: 'evolution', label: 'Evalution questions ask how a given outcome evolved by requiring distinct species or fossil records.' },
    { id: 'representation', label: 'Representation questions ask how activities in brains relate to stimuli or behaviors (e.g. how does reward change the activity of a neuron) and require the manipulation of stimuli or behaviors.' },
    { id: 'developmental', label: 'Developmental questions ask how change during an organism\'s lifetime gives rise to outcomes and require observing that change.' },
    { id: 'combination', label: 'Combination questions ask how above questions relate, e.g. about the mechanism of development.' }
  ];

  // State
  const [currentSection, setCurrentSection] = useState(sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState({
    question: '',
    hypothesis: '',
    philosophy: [],
    experiment: '',
    analysis: '',
    process: '',
    abstract: ''
  });
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  sections.forEach(section => {
    if (!chatMessages[section.id]) {
      chatMessages[section.id] = [];
    }
  });

  // Update current section and index
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sections.findIndex(s => s.id === sectionId));
  };

  // Update user input
  const handleInputChange = (section, value) => {
    setUserInputs({
      ...userInputs,
      [section]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (id) => {
    const newPhilosophy = [...userInputs.philosophy];
    if (newPhilosophy.includes(id)) {
      const index = newPhilosophy.indexOf(id);
      newPhilosophy.splice(index, 1);
    } else {
      newPhilosophy.push(id);
    }
    setUserInputs({
      ...userInputs,
      philosophy: newPhilosophy
    });
  };

  // Send message to AI assistant
  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;
    
    // Add user message to chat
    const newMessages = [
      ...chatMessages[currentSection], 
      { role: 'user', content: currentMessage }
    ];
    
    setChatMessages({
      ...chatMessages,
      [currentSection]: newMessages
    });
    
    setCurrentMessage('');
    setLoading(true);
    
    try {
      // Call OpenAI API with the current message, context, and all sections
      const aiResponse = await callOpenAI(currentMessage, currentSection, userInputs, sections);
      
      // Add AI response to chat
      const updatedMessages = [
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ];
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: updatedMessages
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      };
      
      setChatMessages({
        ...chatMessages,
        [currentSection]: [...newMessages, errorMessage]
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset project
  const resetProject = () => {
    // Clear all user inputs
    setUserInputs({
      question: '',
      hypothesis: '',
      philosophy: [],
      experiment: '',
      analysis: '',
      process: '',
      abstract: ''
    });
    
    // Clear all chat messages
    const freshChatMessages = {};
    sections.forEach(section => {
      freshChatMessages[section.id] = [];
    });
    setChatMessages(freshChatMessages);
    
    // Reset to first section
    handleSectionChange(sections[0].id);
    
    // Clear localStorage
    localStorage.removeItem('paperPlannerData');
    localStorage.removeItem('paperPlannerChat');
  };

  // Save progress to localStorage
  const saveProgress = () => {
    try {
      localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
      localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  };

  // Load progress from localStorage
  const loadProgress = () => {
    try {
      const savedInputs = localStorage.getItem('paperPlannerData');
      const savedChat = localStorage.getItem('paperPlannerChat');
      
      if (savedInputs) {
        setUserInputs(JSON.parse(savedInputs));
      }
      
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
      
      return !!savedInputs;
    } catch (error) {
      console.error('Error loading progress:', error);
      return false;
    }
  };

  // Auto-save on input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userInputs, chatMessages]);

  // Load progress on initial mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Export project as markdown
  const exportProject = () => {
    const exportContent = `# Scientific Paper Project Plan

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. Hypotheses
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. Experimental Design
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. Abstract
${userInputs.abstract || "Not completed yet"}
`;

    // Create a blob with the content
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scientific-paper-plan.md';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render input based on section type
  const renderInput = (section) => {
    // Render instructions
    const instructionsElement = (
      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-gray-700 overflow-y-auto max-h-96">
        <h3 className="font-bold text-lg mb-2">Instructions:</h3>
        <div className="whitespace-pre-line">{section.instructions}</div>
      </div>
    );
    
    // Render input form
    let inputElement;
    if (section.type === 'checklist') {
      inputElement = (
        <div className="mt-4">
          {philosophyOptions.map(option => (
            <div key={option.id} className="flex items-start mb-3">
              <input
                type="checkbox"
                id={option.id}
                checked={userInputs.philosophy.includes(option.id)}
                onChange={() => handleCheckboxChange(option.id)}
                className="mt-1 mr-2"
              />
              <label htmlFor={option.id} className="text-gray-700">{option.label}</label>
            </div>
          ))}
        </div>
      );
    } else {
      inputElement = (
        <textarea
          value={userInputs[section.id]}
          onChange={(e) => handleInputChange(section.id, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded h-32 mt-2"
          placeholder={`Enter your ${section.title.toLowerCase()} here (max 200 words)`}
          maxLength={1200} // Approximately 200 words
        />
      );
    }
    
    // Return both instructions and input form
    return (
      <div>
        {instructionsElement}
        {inputElement}
      </div>
    );
  };

  // Count words in a string
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word !== '').length;
  };

  // Render chat section
  const renderChat = () => {
    return (
      <div className="mt-6 border border-gray-300 rounded p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          Chat with Konrad Kording (AI Assistant)
        </h3>
        <div className="bg-white border border-gray-300 rounded p-3 h-64 overflow-y-auto mb-3">
          {chatMessages[currentSection].length === 0 && (
            <div className="text-gray-500 p-4 text-center italic">
              <p>Hello! I'm Konrad Kording, your AI assistant.</p>
              <p className="mt-2">I'll help you develop your research project. Ask me anything about this section!</p>
            </div>
          )}
          {chatMessages[currentSection].map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 p-3 rounded ${
                message.role === 'user' 
                  ? 'bg-blue-100 ml-12' 
                  : 'bg-gray-100 mr-12'
              }`}
            >
              <div className="font-semibold mb-1">{message.role === 'user' ? 'You' : 'Konrad Kording'}</div>
              {message.role === 'user' ? (
                <div className="whitespace-pre-line">{message.content}</div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-gray-500 italic p-2">Konrad is thinking...</div>
          )}
        </div>
        <div className="flex">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l"
            placeholder="Ask for help or suggestions..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 flex items-center"
            disabled={loading || currentMessage.trim() === ''}
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <p>Tip: I'm Konrad Kording, and I can help you with specific aspects of this section. Feel free to ask for feedback on what you've written!</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Scientific Paper Planner
        </h1>
        <p className="text-gray-600 mb-6">
          Design a hypothesis-based neuroscience project by completing each section step-by-step.
        </p>
        
        {/* Navigation Tabs with Progress Indicators */}
        <div className="flex flex-wrap mb-6">
          {sections.map((section, index) => {
            const hasContent = section.type === 'checklist' 
              ? userInputs.philosophy.length > 0 
              : userInputs[section.id]?.trim().length > 0;
            
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`mr-2 mb-2 px-4 py-2 rounded flex items-center ${
                  currentSection === section.id
                    ? 'bg-blue-600 text-white'
                    : hasContent
                      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className={`w-5 h-5 inline-flex items-center justify-center rounded-full mr-2 ${
                  currentIndex === index
                    ? 'bg-white text-blue-600'
                    : hasContent
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-400 text-white'
                }`}>
                  {index + 1}
                </span>
                {section.title}
              </button>
            );
          })}
        </div>
        
        {/* Content Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-blue-600 text-white mr-2">
              {sections.findIndex(s => s.id === currentSection) + 1}
            </span>
            {sections.find(s => s.id === currentSection).title}
          </h2>
          
          {/* Input Area */}
          {renderInput(sections.find(s => s.id === currentSection))}
          
          {/* Word Counter */}
          {sections.find(s => s.id === currentSection).type !== 'checklist' && (
            <div className="text-right text-sm text-gray-600 mt-1">
              {countWords(userInputs[currentSection])} / 200 words
            </div>
          )}
          
          {/* Chat Interface */}
          {renderChat()}
        </div>
        
        {/* Progress and Navigation */}
        <div className="flex justify-between mt-8">
          <div className="flex">
            <button
              onClick={() => {
                const newIndex = currentIndex - 1;
                if (newIndex >= 0) {
                  handleSectionChange(sections[newIndex].id);
                }
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center mr-2"
              disabled={currentIndex === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center mr-2"
              title="Start a new project"
            >
		<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Project
            </button>
            
            <button
              onClick={exportProject}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
              title="Export your project as a markdown file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Project
            </button>
          </div>
          
          <button
            onClick={() => {
              const newIndex = currentIndex + 1;
              if (newIndex < sections.length) {
                handleSectionChange(sections[newIndex].id);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            disabled={currentIndex === sections.length - 1}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm New Project</h3>
              <p className="mb-6 text-gray-600">
                Are you sure you want to start a new project? All current progress will be lost.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetProject();
                    setShowConfirmDialog(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, start new
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperPlannerApp;
