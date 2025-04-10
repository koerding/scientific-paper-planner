// FILE: src/data/sectionContent.js
// Restructured data format with explicit subsections for cleaner AI processing

export const sectionContent = {
  "title": "Scientific Paper Planner Sections",
  "version": "2.0",
  "sections": [
    {
      "id": "question",
      "title": "Research Question",
      "type": "text",
      "maxLength": 3000,
      "inputPlaceholder": "Start writing your research question here...",
      "introText": "A strong research question is the foundation of a successful project. It defines the scope, focus, and purpose of your work and guides all decisions from design to analysis. A well-formulated question ensures clarity, relevance, and feasibility.",
      "subsections": [
        {
          "id": "question_clarity",
          "title": "Question Clarity",
          "instruction": "Make sure the research question is clearly and unambiguously stated.",
          "tooltip": "Clarity anchors your entire research endeavor. When your question is unambiguous, it helps align your methods, data collection, and interpretation. It also gives peers and advisors an immediate grasp of what you're investigating, making their feedback more targeted and constructive. Ambiguity, on the other hand, can lead to misaligned expectations or conflicting interpretations. By defining each term and concept up front, you reduce confusion, create a strong foundation for hypothesis building, and facilitate clearer communication. Ultimately, the clearer your research question, the more coherent and persuasive your final dissertation will be."
        },
        {
          "id": "question_motivation",
          "title": "Motivation and Importance",
          "instruction": "Make sure to clearly explain why this question matters, to you and to the field.",
          "tooltip": "Motivation breathes life into your research question. By pinpointing why the question matters, you show its relevance and potential impact on both theory and practice. A strong rationale helps you stand out in a crowded field, secures backing from mentors or funding agencies, and keeps you personally invested. Researchers—especially reviewers—want to see a clear \"so what\" behind your work. Clarifying the potential changes or insights that might follow from answering the question not only strengthens your case for doing the research, but also helps you stay focused on the broader context that gives your study true significance."
        },
        {
          "id": "question_scope",
          "title": "Specificity and Scope",
          "instruction": "The question should be focused enough to be answered within the scope of your project.",
          "tooltip": "Striking the right balance between ambition and feasibility is critical for a good project. If your question is too large, you risk superficial coverage of many sub-areas without achieving depth in any one. An overly narrow focus might, conversely, limit the broader impact of your research. By defining a specific scope, you ensure each chapter or experiment directly addresses a piece of your core question. This focus strengthens methodological choices, clarifies data collection needs, and makes your findings more cohesive. A well-scoped question also supports a timely completion, since you can plan tasks and milestones around a realistic, measurable research aim."
        },
        {
          "id": "question_type",
          "title": "Type of Question",
          "instruction": "Is it clear whether the question is descriptive (what), mechanistic (how), or explanatory/causal (why)?",
          "tooltip": "Before diving into data or experiments, identify whether your question aims to characterize an unknown phenomenon, reveal the processes behind it, or determine cause-effect relationships. This distinction shapes everything: from the design of your study to the analytical tools you use. A descriptive question, for instance, might rely on observational data, while a mechanistic or causal question demands more controlled or comparative studies. By clarifying the nature of your question at the outset, you guide your own research decisions and help readers anticipate the kind of evidence or argument you'll provide. It also keeps you from conflating correlation with causation."
        }
      ],
      "placeholder": "Research Question:[Write it out] \n\nSignificance/Impact: [Why it matters]\n",
      "llmInstructions": "Please review my research question and significance statement and provide feedback. Does my question have clarity, importance, appropriate scope, and a clear type (descriptive, mechanistic, or causal)? What specific improvements would you suggest?"
    },
    {
      "id": "audience",
      "title": "Target Audience",
      "type": "text",
      "maxLength": 1500,
      "inputPlaceholder": "List the target audience for your research...",
      "introText": "Knowing your target audience helps ensure your work reaches and resonates with the right people. Identifying relevant communities, researchers, or stakeholders lets you tailor your communication and maximize impact. It also guides choices around framing, methods, and venues for dissemination.",
      "subsections": [
        {
          "id": "audience_key",
          "title": "Key Audiences",
          "instruction": "Say who in the research world would care about this work.",
          "tooltip": "Identifying your audience focuses your communication and shapes the style of your writing or presentations. Different subfields, for example, often have their own jargon or methodological norms, so clarity on which groups will benefit helps you tailor content. This knowledge can guide decisions about which journals to target or which conferences to attend. Specifying audiences also fosters potential collaborations, as like-minded researchers may realize your project intersects with their interests. Ultimately, knowing your audience from the start helps you craft a coherent and compelling message for those most likely to build on your findings."
        },
        {
          "id": "audience_impact",
          "title": "Impact on Each Audience",
          "instruction": "Briefly explain how your work could matter to them.",
          "tooltip": "When you articulate the benefits for each audience, you make your research more accessible and inviting. Maybe statisticians gain a novel computational approach, while clinicians get a diagnostic tool that streamlines patient care. Pinpointing these implications demonstrates you've considered multiple perspectives and fosters trust in the relevance of your work. It can also shape your discussion section—highlighting different takeaways for each group. By framing each audience's potential gains, you lay the groundwork for future collaborations, broader adoption of your techniques, or greater acceptance of your hypotheses."
        },
        {
          "id": "audience_individuals",
          "title": "Representative Individuals",
          "instruction": "Name specific labs or researchers as examples.",
          "tooltip": "Selecting concrete examples of who might benefit ensures you're not just imagining a nebulous group. By naming labs, research centers, or influential scholars, you can better envision their needs and expectations. This specificity often leads to more practical research decisions: you can adopt methodologies or data standards that you know these groups use. It may also encourage direct outreach—perhaps sharing a draft with a researcher whose work closely relates. Incorporating feedback from people you've explicitly identified fosters a dynamic, real-world relevance, increasing the chances your final output resonates outside your immediate circle."
        },
        {
          "id": "audience_tailoring",
          "title": "Tailoring Communication",
          "instruction": "Think about how to adjust framing or methods for different groups.",
          "tooltip": "One of the biggest barriers to disseminating research effectively is failing to account for diverse backgrounds. Engineers might value technical specifications, while psychologists focus on theoretical frameworks. Clinicians may need concise, actionable summaries instead of in-depth statistical detail. By tailoring your message, you ensure each audience can see the value of your work without getting lost or bored. This strategy also extends to how you present data—visual formats, examples, or anecdotal evidence might resonate with one group more than another. Recognizing these differences early helps you build your final deliverables in a flexible, impactful way."
        }
      ],
      "placeholder": "Target Audience/Community (research fields/disciplines):\n1. \n2. \n3. \n\nSpecific Researchers/Labs (individual scientists or groups):\n1. \n2. \n3. ",
      "llmInstructions": "Please review my target audience section. Have I clearly identified key audiences, explained how my work matters to them, named specific researchers/labs, and considered communication strategies? What specific improvements would make this section stronger?"
    }
    // Additional sections would follow the same pattern...
  ]
};

// To maintain backward compatibility with existing code
export default {
  title: sectionContent.title,
  sections: sectionContent.sections
};
