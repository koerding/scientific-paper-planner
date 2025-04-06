# Combined Texts and Prompts for Editing

## File: src/services/documentImportService.js

# Scientific Paper Extraction - Strict Format

## Task Overview
Extract key components from the provided scientific paper text and format them in a JSON structure that can be loaded by the Scientific Paper Planner tool. The provided text was automatically extracted and may contain formatting errors or be truncated.

## CRITICAL JSON FORMATTING REQUIREMENTS
1. Use ONLY plain ASCII characters.
2. Do NOT use any HTML tags.
3. Keep content simple and straightforward.
4. Replace mathematical variables with text descriptions.
5. Use only single quotes for nested strings if needed.
6. Use standard newlines only.
7. Ensure JSON remains valid.

## Research Approach Selection
Determine which research approach the paper likely uses based *only* on the provided text:
1. Hypothesis-driven (distinguish between hypotheses)
2. Needs-based (solve a problem, e.g. engineering or medicine) 
3. Exploratory (take data and see what is there)

## Data Collection Method Selection
Determine which data collection method the paper likely uses based *only* on the provided text:
1. Experiment
2. Analysis of Existing Data

## Output Format
Output valid JSON matching this exact structure:
{
  "userInputs": {
    "question": "Research Question: [simple description based on text]\\n\\nSignificance/Impact: [simple description based on text]",
    "audience": "Target Audience/Community (research fields/disciplines):\\n1. [audience1 based on text]\\n2. [audience2 based on text]\\n3. [audience3 based on text]\\n4. [audience4 based on text]\\n5. [audience5 based on text] \\n\\nSpecific Researchers/Labs (individual scientists or groups):\\n1. [researcher1 based on text]\\n2. [researcher2 based on text]\\n3. [researcher1 based on text]\\n4. [researcher1 based on text]\\n5. [researcher1 based on text]",

    // CHOOSE ONE based on text:
    "hypothesis": "Hypothesis 1: [simple description based on text, only mention lack of clarity if it is truly unclear]\\n\\nHypothesis 2: [simple description based on text, only mention lack of clarity if it is truly unclear]\\n\\nWhy distinguishing these hypotheses matters:\\n- [reason1 based on text]\\n- [reason2 based on text]",
    "needsresearch": "Who needs this research:\\n[stakeholders based on text]\\n\\nWhy they need it:\\n[problem description based on text]\\n\\nCurrent approaches and limitations:\\n[existing solutions based on text]\\n\\nSuccess criteria:\\n[evaluation methods based on text]\\n\\nAdvantages of this approach:\\n[benefits based on text]",
    "exploratoryresearch": "Phenomena explored:\\n[description based on text]\\n\\nPotential discoveries your approach might reveal:\\n1. [finding1 based on text, if unspecified mention]\\n2. [finding2 based on text, if unspecified mention]\\n\\nValue of this exploration to the field:\\n[importance based on text, mention if there is lack of clarity]\\n\\nAnalytical approaches for discovery:\\n[methods based on text]\\n\\nStrategy for validating findings:\\n[validation based on text]",

    "relatedpapers": "Most similar papers that test related hypotheses:\\n1. [paper1 based on text, ideally give full reference]\\n2. [paper2 based on text, ideally give full reference]\\n3. [paper3 based on text, ideally give full reference]\\n4. [paper4 based on text, ideally give full reference]\\n5. [paper5 based on text, ideally give full reference]",

    // CHOOSE ONE based on text:
    "experiment": "Key Variables:\\n- Independent: [variables based on text, mention if the text does not mention any]\\n- Dependent: [variables based on text, mention if the text does not mention any]\\n- Controlled: [variables based on text, mention if the text does not mention any]\\n\\nSample & Size Justification: [simple description based on text, mention if the text does not mention any]\\n\\nData Collection Methods: [simple description based on text, mention if the text does not mention any]\\n\\nPredicted Results: [simple description based on text, mention if the text does not mention any]\\n\\nPotential Confounds & Mitigations: [simple description based on text, mention if the text does not mention any]",
    "existingdata": "Dataset name and source:\\n[description based on text, mention if the text does not specify]\\n\\nOriginal purpose of data collection:\\n[description based on text, mention if text does not specify]\\n\\nRights/permissions to use the data:\\n[description based on text, mention if the text does not specify]\\n\\nData provenance and quality information:\\n[description based on text, mention if the text does not specify]\\n\\nRelevant variables in the dataset:\\n[description based on text, mention if the text does not specify]\\n\\nPotential limitations of using this dataset:\\n[description based on text, mention if not specified]",

    "analysis": "Data Cleaning & Exclusions:\\n[simple description based on text, mention if the text does not specify]\\n\\nPrimary Analysis Method:\\n[simple description based on text]\\n\\nHow Analysis Addresses Research Question:\\n[simple description based on text, mention if this is not clear]\\n\\nUncertainty Quantification:\\n[simple description based on text, this includes any statistical method, mention if not specified]\\n\\nSpecial Cases Handling:\\n[simple description based on text]",
    "process": "Skills Needed vs. Skills I Have:\\n[simple description based on text, guess where necessary]\\n\\nCollaborators & Their Roles:\\n[simple description based on text, guess where necessary]\\n\\nData/Code Sharing Plan:\\n[simple description based on text]\\n\\nTimeline & Milestones:\\n[simple description based on text]\\n\\nObstacles & Contingencies:\\n[simple description based on text, guess where necessary]",
    "abstract": "Background: [simple description based on text]\\n\\nObjective/Question: [simple description based on text]\\n\\nMethods: [simple description based on text]\\n\\n(Expected) Results: [simple description based on text]\\n\\nConclusion/Implications: [simple description based on text]"
  },
  "chatMessages": {},
  "timestamp": "${new Date().toISOString()}",
  "version": "1.0-text-extraction"
}

## IMPORTANT:
- Base extraction *solely* on the provided text, which might be messy or truncated.
- If information for a field is not found, explicitly state 'Not found in text'. 
- If educated guesses are needed, make sure to communicate the lack of clarity.
- Include ONLY ONE research approach field.
- Include ONLY ONE data collection field.
- Adhere STRICTLY to all JSON formatting rules.

Here is the extracted text from the document (potentially truncated):
---
${documentText}
---
Based *only* on the text above, create the scientific paper structure in the specified JSON format.
## File: src/services/openaiService.js

You are a helpful assistant helping a student who is planning a new scientific project. Context type: {contextType}. Maintain conversation context based on previous messages.
Context for Section "{section.title}" (ID: {section.id}):
Instructions: {instructionText || 'N/A'}
Current User Input: {safeUserInput}
Here are the instruction texts:

[
  {
    "id": "question",
    "editedInstructions": "Great job defining your research question! You're asking whether speed-dating events between scientists increase collaboration probability, which is clear and testable. Here are some additional points to consider: 1) Think about the scope - are you focusing on specific scientific disciplines? 2) Consider quantifying what 'increased collaboration' means (joint papers, grant applications, etc.).",
    "feedback": "**Strengths:** Clear question.\n**Weaknesses:** Scope unclear.\n**Suggestions:** Define collaboration metrics.",
    "completionStatus": "progress"
  },
  {
    "id": "hypothesis",
    "editedInstructions": "Excellent work! You've addressed all key points. Ready for the next step!",
    "feedback": "**Strengths:** Both hypotheses are clear and testable.\n**Weaknesses:** None noted.\n**Suggestions:** Proceed to experiment design.",
    "completionStatus": "complete"
  }
]
This is a mock response because no OpenAI API key is configured.
Please set REACT_APP_OPENAI_API_KEY in your environment variables or .env file.

For a real application, I would respond to your prompt about "{contextType}" with helpful information based on the conversation history provided.

For testing purposes, you can continue using the application with this mock mode.
Network error: Unable to connect to OpenAI API. Please check your internet connection.
OpenAI API Error: {error.message || 'Unknown error'}
## File: src/services/instructionImprovementService.js

Act as a helpful editor for a scientific paper planning tool for PhD students. You will receive sections the user has worked on.

For each section PROVIDED BELOW, I'll provide:
1. The section ID ('id') and title ('title').
2. The **original** instruction text given to the user ('originalInstructionsText').
3. The user's current content for that section ('userContent').

Your task is, FOR **EACH** section provided:

**Part 1: Generate Feedback**
1.  Analyze the 'userContent' against the goals in 'originalInstructionsText'.
2.  Write a constructive feedback section (max 150 words). Start with a brief (1-2 sentence) positive acknowledgment of specific points the user covered well, *but only if the user has made substantial, meaningful changes beyond the placeholder text*. Then, clearly list strengths, weaknesses, and specific, actionable suggestions for improvement based *only* on what remains unaddressed or needs refinement according to the 'originalInstructionsText' and general standards of scientific rigor/clarity. Format this feedback using markdown (e.g., use bold for **Strengths:**, **Weaknesses:**, **Suggestions:**).
3.  Include a clear assessment of completeness. Use phrases like "excellent work" for complete sections, "good start" or "making progress" for partial completion, and highlight specific missing elements for incomplete sections.

**Part 2: Generate Edited Instructions**
1.  Critically **EDIT** the 'originalInstructionsText'. Your **PRIMARY GOAL** is to **REMOVE** instruction points that the 'userContent' satisfactorily addresses.
2.  Focus the remaining text *only* on what the user still needs to address or improve according to the 'originalInstructionsText'. Remove points if a reasonable person would agree the user's text addresses them. Make minor edits for flow (e.g., renumbering if needed). Preserve all markdown otherwise (headings, bold, lists).
3.  **If the user has addressed ALL key points well,** replace the *entire* instruction text with a clear, positive, congratulatory message (e.g., "Excellent work on this section! You've addressed all the key points regarding X[one keypoint they addressed well, Y[another key point], and Z [yet another key point]. Ready for the next step!").
4.  **Otherwise (if points remain),** create the edited instruction text. Start with a brief (1-2 sentence) positive acknowledgement of specific points the user covered well, *but only if the user has made substantial, meaningful changes beyond the placeholder text* (same as step 1.2 in Feedback part) and then append the remaining, edited instructions.

**CRITICAL REQUIREMENTS:**
* **JSON Output:** Respond ONLY with a valid JSON array. Each object in the array must correspond to one of the input section IDs and have EXACTLY these three keys:
    * `"id"`: (string) The section ID.
    * `"editedInstructions"`: (string) The result from Part 2 (edited instructions or congratulatory message).
    * `"feedback"`: (string) The result from Part 1 (strengths, weaknesses, suggestions).
    * `"completionStatus"`: (string) Your assessment of the section's completion: "complete", "progress", or "unstarted".
* **Placeholder Handling:** Do NOT use congratulatory language if the 'userContent' is identical or very similar to the original placeholder text for that section. In such cases, state that the section needs to be filled out.
* **Markdown Preservation:** Preserve markdown (###, **, lists) within the string values of `"editedInstructions"` and `"feedback"`.
* **Formatting:** Ensure proper markdown line breaks (blank lines between paragraphs, after headings). No trailing commas in the JSON.
* **Conciseness:** Keep responses focused and reasonably concise (total response < 4000 chars).

Here are the sections to improve:
${JSON.stringify(sectionsData, null, 2)}

Respond ONLY with the JSON array, starting with '[' and ending with ']'. Example object format:
{
  "id": "section_id",
  "editedInstructions": "Great start defining X! Now focus on...\\n\\n1. Point Y\\n2. Point Z",
  "feedback": "**Strengths:** Clear definition of X.\\n\\n**Weaknesses:** Point Y lacks detail.\\n\\n**Suggestions:** Elaborate on the methodology for Y.",
  "completionStatus": "progress"
}
## File: src/data/sectionContent.json

Scientific Paper Planner Sections
Research Question
Start writing your research question here...
Formulating Your Research Question
A good research question drives your entire study and helps you focus your efforts. It's the foundation of scientific inquiry.

---

* Specify your question.

* Be clear about the logic. Are you asking how something is? Why it is the way it is? What gives rise to something? How it got their over time? Ask yourself which conclusions are supported by what kinds of analyses.

* Explain why the question matters to the field. How will science be different after your work?

* Ensure your question is answerable with your anticipated resources.

Research Question:[Write it out] \n\nSignificance/Impact: [Why it matters]\n
I want you to check if the question feels like a good question for scientific inquiry. Please evaluate:\n\n1. Strengths and weaknesses of the question (including clarity and scope)\n2. How well the question matches my stated significance/objectives\n3. Target Audience
* List the target audience for your research...
Identifying Your Target Audience
Every research project needs an audience. Knowing who will read and care about your work helps you focus your approach and presentation style.

---

* Identify primary academic communities who would benefit most directly (e.g., "computational neuroscience").

* For each community, note how your research might impact their work.

* Then, specify 3-5 individual researchers or research groups representing your audience (specific labs or scientists).
Target Audience/Community (research fields/disciplines):\n1. \n2. \n3. \n\nSpecific Researchers/Labs (individual scientists or groups):\n1. \n2. \n3. 
I see you've identified potential audiences for your research. Let me help you evaluate these choices:\n\n1. How appropriate these audience selections are given your research question\n2. Whether there are additional important audiences you might have overlooked\n3. How clearly you've articulated why each audience would be interested\n\nI'll also suggest 3-5 additional specific researchers, labs, or communities who might be especially interested in this topic based on your research question and audiences identified.
Hypothesis
Start writing your hypotheses here...
Hypothesis-driven Research
Hypothesis-driven research tests specific predictions derived from theory. It's the classic approach where you make a clear, testable guess about how things work.

---

* Formulate at least two distinct, testable hypotheses.

* Ensure each hypothesis is specific and clearly stated.

* Your experiment must be able to differentiate between these hypotheses.

* Explain why distinguishing between these hypotheses matters to the field.

* Explain how data can help you decide between these hypotheses.
Hypothesis 1: [State the first specific, testable hypothesis.]\n\nHypothesis 2: [State the second specific, testable hypothesis, distinct from H1.]\n\nWhy distinguishing these hypotheses matters:\n- \n- 
I've reviewed your hypotheses. Let me provide feedback on:\n\n1. The strengths and weaknesses of each hypothesis, particularly regarding specificity and testability\n2. How well they align with your research question\n3. Whether distinguishing between them would be consequential for the field\n4. How clearly your key terms are defined\n5. Whether your hypotheses are appropriately distinct from each other\n\nI'll provide constructive suggestions for refining your hypotheses to make them more testable and meaningful.
Needs-Based
Define the needs your research addresses...
Needs-Based Research
Needs-based research aims to solve practical problems rather than test theories. It focuses on developing solutions that address specific real-world challenges faced by people or systems.

---

* Clearly identify who needs this research (patients, clinicians, engineers, policymakers).

* Explain why they need it - what specific problem are you solving?

* Describe the current options/solutions and their limitations.

* Define concrete success criteria - how will you know if your solution works?

* Explain what specific improvement or advance your solution offers over existing approaches.
Who needs this research:\n\nWhy they need it (specific problem to solve):\n\nCurrent approaches and their limitations:\n\nSuccess criteria (how will you measure if your solution works):\n\nAdvantages of your proposed approach:
I see you've outlined a needs-based approach. Let me help evaluate how well you've defined the problem and solution space:\n\n1. How clearly you've identified the specific stakeholders who need this research\n2. Whether you've articulated a concrete problem that needs solving\n3. How thoroughly you've assessed current approaches and their limitations\n4. Whether your success criteria are specific and measurable\n5. How convincing your case is that your approach offers meaningful advantages\n\nI'll provide constructive feedback on strengthening your needs-based framework and ensuring it addresses a genuine gap.
Exploratory
Define your exploratory approach...
Exploratory Research
Exploratory research aims to discover patterns and generate hypotheses rather than testing them. It's about finding interesting connections in data without preconceived expectations about what you'll find.

---

* Describe the phenomena, dataset, or system you want to explore.

* List 3-5 specific patterns, relationships, or discoveries your approach might reveal.

* Explain what makes this exploration novel or valuable to your field.

* Describe what tools or analytical approaches you'll use for discovery.

* Outline how you'll distinguish meaningful patterns from random variation.
Phenomena/data/system to explore:\n\nPotential discoveries your approach might reveal:\n1. \n2. \n3. \n\nValue of this exploration to the field:\n\nAnalytical approaches for discovery:\n\nStrategy for validating findings:
I see you've outlined your exploratory approach. Let me help evaluate this framework:\n\n1. How clearly you've defined what you're exploring and why it's worth investigating\n2. How specific and interesting your potential discoveries seem to be\n3. Whether your analytical approaches are appropriate for the phenomena you're exploring\n4. How well you've considered validation and distinguishing signal from noise\n5. Whether this exploration could lead to valuable scientific insights\n\nI'll provide constructive feedback on strengthening your exploratory approach and ensuring it has scientific value beyond simple data mining.
Related Papers
List the related papers here...
Identifying Relevant Literature
Every research project builds on existing work. Finding relevant papers helps you avoid reinventing the wheel and positions your work within the scientific conversation.

---

* List 5 papers that test similar hypotheses or address related questions.

* Explain how each paper relates to your specific research question.

* Identify what gap your research will fill that these papers don't address.

* Consider papers with contrasting perspectives or results to yours.
Most similar papers that test related hypotheses:\n1. \n2. \n3. \n4. \n5. 
I'll evaluate the papers you've listed as most relevant to your research:\n\n1. Based on the paper titles/authors you've provided, I'll assess how relevant they appear to be to your specific hypotheses\n2. I'll suggest what key aspects of these papers might be particularly important to consider for your work\n3. I'll suggest what types of additional papers might be valuable to include (e.g., methodological papers, contrasting perspectives)\n4. If you've included enough information, I'll highlight potential gaps in the literature that your work could address\n\nNote that I can only evaluate based on the information you've provided about these papers - I don't have the ability to search for or read the actual papers.
Experiment
Start designing your experiment here...
Experiment
Your experiment is how you'll actually collect data to answer your research question. A well-designed experiment gives you the best chance of getting a clear answer.

---

* Define your key variables (independent, dependent, controlled).

* Describe your sample and justify your sample size.

* Outline your data collection procedures and control conditions.

* State predicted results for each hypothesis.

* Identify potential confounds and how you'll address them.
Key Variables:\n- Independent: \n- Dependent: \n- Controlled: \n\nSample & Size Justification: \n\nData Collection Methods: \n\nPredicted Results: \n\nPotential Confounds & Mitigations:
I'll review your experimental design and assess how well it tests your research question and hypotheses. Specifically, I'll evaluate:\n\n1. Whether your design directly tests your hypotheses\n2. If your predicted outcomes for each hypothesis are truly distinct and measurable\n3. Whether your sample characteristics and size are appropriate\n4. If your control conditions adequately rule out alternative explanations\n5. How well you've identified and planned to address potential confounds\n\nI'll provide specific, constructive suggestions to improve the rigor and clarity of your experimental design.
Acquiring Pre-existing Data
Describe the pre-existing data you plan to use...
Using Pre-existing Datasets
Using existing datasets can save time and resources. However, it's crucial to understand where the data came from and its limitations before basing your research on it.

---

* Identify the specific dataset(s) and where/how you will access them.

* Explain what the data was originally collected for and by whom.

* Confirm you have legal rights to use the data for your purpose.

* Describe what you know about data provenance and quality assurance.

* Assess if the dataset contains the variables needed to answer your research question.
Dataset name and source:\n\nOriginal purpose of data collection:\n\nRights/permissions to use the data:\n\nData provenance and quality information:\n\nRelevant variables in the dataset:\n\nPotential limitations of using this dataset:
I see you're planning to use pre-existing data for your research. Let me evaluate how thoroughly you've considered the dataset's appropriateness:\n\n1. How clearly you've identified the specific dataset and its source\n2. Whether you understand what the data was originally collected for\n3. If you've addressed legal and ethical considerations for data reuse\n4. How well you understand the data's provenance and quality\n5. Whether the dataset actually contains the variables needed for your research question\n\nI'll highlight any potential concerns about using this dataset and suggest additional considerations to ensure the data is appropriate for your specific research goals.
Data Analysis
Start planning your data analysis here...
Data Analysis Plan
Your analysis plan describes exactly how you'll extract meaning from your data. Planning it in advance helps prevent p-hacking and increases the credibility of your findings.

---

* Define your data cleaning steps and exclusion criteria.

* Specify your primary statistical method(s) or model(s).

* Explain how your analysis will address your research question.

* Describe how you'll quantify uncertainty in your results.

* Outline how you'll handle any special cases (outliers, multiple comparisons, etc.).
Data Cleaning & Exclusions:\n\nPrimary Analysis Method:\n\nHow Analysis Addresses Research Question:\n\nUncertainty Quantification:\n\nSpecial Cases Handling:
I'll review your data analysis plan to assess how well it addresses your research question and hypotheses. Specifically, I'll evaluate:\n\n1. Whether your analysis methods are appropriate for your research design and data type\n2. If your plan clearly specifies how you'll distinguish between hypotheses\n3. How well you've addressed data cleaning, outliers, and missing data\n4. Whether your approach to uncertainty quantification is appropriate\n5. If you've properly addressed potential issues like multiple comparisons\n\nI'll provide specific, constructive suggestions to improve the rigor and clarity of your analysis plan.
Process
Outline your process, skills, and timeline...
Research Process
Research is a practical endeavor requiring specific skills, resources, and planning. This section helps you anticipate what you'll need to successfully complete your project.

---

* List essential skills needed and identify which ones you lack.

* Name potential collaborators and their specific contributions.

* Describe your plan for data/code sharing and documentation.

* Outline a realistic timeline with key milestones and duration.

* Identify major potential obstacles and specific contingency plans.
Skills Needed vs. Skills I Have:\n\nCollaborators & Their Roles:\n\nData/Code Sharing Plan:\n\nTimeline & Milestones:\n\nObstacles & Contingencies:
I'll review your research process plan to assess how realistic and thorough it is. Specifically, I'll evaluate:\n\n1. Whether you've identified all the critical skills needed and have reasonable plans to acquire missing ones\n2. If your collaboration plan is appropriate and comprehensive\n3. How well you've planned for data/code sharing and reproducibility\n4. Whether your timeline seems realistic given the scope of work\n5. How thoroughly you've anticipated potential obstacles\n\nI'll provide specific, constructive suggestions to improve the feasibility and completeness of your research process plan.
Abstract
Draft your abstract here...
Drafting an Abstract
An abstract is a mini-version of your entire paper. Writing it now helps you organize your thoughts and spot any inconsistencies in your research plan.

---

### Structure (Aim for 1-2 sentences per point):

* **Background:** Briefly introduce the research area, identify the knowledge gap or problem, and state its significance.

* **Objective/Question:** Clearly state the main research question, primary hypothesis being tested, exploration goal, or problem being solved.

* **Methods:** Concisely summarize the core aspects of your experimental design, participants/sample, and key procedures or analytical techniques.

* **(Expected) Results:** Briefly describe the main anticipated findings and, crucially, how they will address the objective or distinguish between hypotheses.

* **Conclusion/Implications:** State the main takeaway message (even if speculative at this stage) and its potential broader impact on the field or application.
Background: [Introduce field, gap, significance. 1-2 sentences]\n\nObjective/Question: [State primary aim/question/hypothesis. 1 sentence]\n\nMethods: [Briefly describe design, participants, key procedures. 1-2 sentences]\n\n(Expected) Results: [Summarize anticipated main finding and how it addresses the objective. 1-2 sentences]\n\nConclusion/Implications: [State main conclusion and broader impact. 1-2 sentences]
I want you to check the resulting abstract. Does it logically follow from the previous sections (Question, Hypothesis, Experiment, Analysis)? Does it adhere to the requested structure (Background, Objective, Methods, Results, Conclusion)? Is it convincing and clearly written? Is the language precise? What specific changes (e.g., word choice, sentence structure) would make it more powerful or clear? Use a constructive, Socratic dialogue style. Help the user reflect on what they learned by going through this planning process. Ask what they might do differently next time they plan a study.
## File: src/hooks/usePaperPlanner.js

We found a previously saved project. Would you like to load it? Click 'Cancel' to start with a fresh template.
Sorry, there was an error processing your message. ({error.message})
Requesting review for {currentSectionObj.title}...
Sorry, there was an error reviewing the {sectionId} section. ({error.message})
scientific-paper-plan
Invalid project file format. Please select a valid project file.
Loading this project will replace your current work. Are you sure you want to continue?
Project loaded successfully!
Error loading project. Please try again.
Creating an example from this document will replace your current work. Continue?
We had some trouble processing this document. You might want to try a different file format.
## File: src/components/PaperPlanner/VerticalPaperPlannerApp.js

Failed to improve instructions: {result.message || "No improved instructions returned."}
Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}
## File: src/components/PaperPlanner/ExamplesDialog.js

Example Projects
Loading examples...
Failed to load examples. Please try again.
Select an example project to load. This will replace your current work.
No examples available.
Cancel
Load Example
## File: src/components/PaperPlanner/ConfirmDialog.js

Confirm New Project
Are you sure you want to start a new project? All current progress will be lost.
Cancel
Yes, start new
## File: src/components/PaperPlanner/PaperPlannerApp.js

Sorry, there was an error processing your request. Please try again.
I've finished my first version. Can you provide feedback?
Invalid project file format. Please select a valid project file.
Loading this project will replace your current work. Are you sure you want to continue?
Project loaded successfully!
Error loading project: {error.message || "Unknown error"}
## File: src/components/toggles/ResearchApproachToggle.js

Choose Your Research Approach:
Hypothesis Testing
Needs-Based Research
Exploratory Research
## File: src/components/toggles/DataAcquisitionToggle.js

Choose Data Acquisition Method:
New Experiment
Existing Data
## File: src/components/rightPanel/FullHeightInstructionsPanel.js

Instructions
{sectionTitle} Instructions & Feedback
Select a section to view instructions
Magic in progress...
Magic
Instructions not available for this section.
Feedback
## File: src/components/layout/AppHeader.js

SP
Scientific Paper Planner
Design a scientific project step-by-step
New
Start a new project
Saving...
Save
Save your project (Ctrl+S)
Load
Load a saved project
Please select a JSON file (ending in .json)
Loading functionality is not available
Error loading file. Please make sure it's a valid project file.
Error reading file. Please try again.
Please select a PDF or Word document
Processing...
Make Example from PDF/Doc
Create example project from a scientific paper (PDF or Word)
Document import functionality is not available
We had some trouble processing this document. You might want to try a different file or format.
Examples
Load an example project
Export
Export your project as a markdown file
Enter a name for your project file:
my-research-project
Error saving project: {error.message}
## File: src/components/chat/ModernChatInterface.js

AI Research Assistant
AI assistant for {currentSectionTitle}
Your AI Research Assistant
I'll help you develop your research project. Ask questions or click "Mark Complete" in the instructions panel when you're ready for feedback!
Ask a question about your research...
## File: src/utils/exportUtils.js

Enter a name for your exported file:
scientific-paper-plan
## 3. {ApproachTitle}
## 3. Research Approach
## 5. Experimental Design
## 5. Pre-existing Data
## 5. Data Acquisition
Not completed yet
# Scientific Paper Project Plan

## 1. Research Question & Logic
{userInputs.question || "Not completed yet"}

## 2. Target Audience
{userInputs.audience || "Not completed yet"}

{researchApproach}

## 4. Related Papers
{userInputs.relatedpapers || "Not completed yet"}

{dataAcquisition}

## 6. Data Analysis Plan
{userInputs.analysis || "Not completed yet"}

## 7. Process, Skills & Timeline
{userInputs.process || "Not completed yet"}

## 8. Abstract
{userInputs.abstract || "Not completed yet"}
Enter a name for your project file:
scientific-paper-plan
