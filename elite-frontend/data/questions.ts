import type { Question } from '../types';

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    dimension: 'AI Awareness & Literacy',
    text: 'When you encounter an AI-generated credit risk assessment in your workflow, which of the following best describes your current practice?',
    options: [
      { value: 'A', label: 'I accept the assessment without specific evaluation of how it was generated', score: 0 },
      { value: 'B', label: 'I am aware it is AI-generated but do not know how to evaluate its reliability', score: 1 },
      { value: 'C', label: 'I understand the general factors the model uses but cannot identify specific failure modes', score: 2 },
      { value: 'D', label: 'I can identify the key variables, assess confidence levels, and know when to override with human judgment', score: 4 }
    ]
  },
  {
    id: 2,
    dimension: 'AI Awareness & Literacy',
    text: "How would you characterise your immediate team's understanding of the difference between rule-based automation and machine learning in the context of your fraud detection or compliance workflows?",
    options: [
      { value: 'A', label: 'Most team members do not distinguish between the two', score: 0 },
      { value: 'B', label: 'A few team members understand the distinction but it is not widely shared knowledge', score: 1 },
      { value: 'C', label: 'Most team members understand the distinction conceptually but few have applied it practically', score: 2 },
      { value: 'D', label: 'Most team members can articulate the distinction and apply it when evaluating vendor proposals or system performance', score: 4 }
    ]
  },
  {
    id: 3,
    dimension: 'AI Awareness & Literacy',
    text: "With respect to the CBN's published guidelines on AI use in financial services and Nigeria's Data Protection Act, which statement best describes your organisation's current position?",
    options: [
      { value: 'A', label: 'We are not aware of specific CBN AI guidelines or NDPA obligations relevant to AI', score: 0 },
      { value: 'B', label: 'We are aware they exist but have not yet assessed our compliance obligations', score: 1 },
      { value: 'C', label: 'We have assessed our obligations but have not yet implemented compliance measures', score: 2 },
      { value: 'D', label: 'We have assessed our obligations and implemented documented compliance measures including staff training requirements', score: 4 }
    ]
  },
  {
    id: 4,
    dimension: 'AI Awareness & Literacy',
    text: "Which of the following AI tools or capabilities are actively used in your department's work?",
    multiSelect: true,
    options: [
      { value: 'generative-ai-document-drafting', label: 'Generative AI for document drafting or analysis (ChatGPT, Claude, Gemini)', score: 1 },
      { value: 'ai-assisted-data-analysis', label: 'AI-assisted data analysis (Copilot in Excel, AI features in BI tools)', score: 1 },
      { value: 'automated-customer-communication', label: 'Automated customer communication AI', score: 1 },
      { value: 'compliance-monitoring', label: 'AI-powered compliance monitoring or transaction screening', score: 1 },
      { value: 'ml-credit-scoring', label: 'ML models for credit scoring or risk assessment', score: 1 },
      { value: 'llm-regulatory-analysis', label: 'LLMs for regulatory document analysis', score: 1 },
      { value: 'none-of-the-above', label: 'None of the above', score: 0 }
    ]
  },
  {
    id: 5,
    dimension: 'AI Awareness & Literacy',
    text: 'When did you last complete a formal learning experience specifically focused on AI, machine learning, or data science applications in financial services?',
    options: [
      { value: 'A', label: 'Never or more than 3 years ago', score: 0 },
      { value: 'B', label: '1–3 years ago', score: 1 },
      { value: 'C', label: '6–12 months ago', score: 2 },
      { value: 'D', label: 'Within the last 6 months', score: 4 }
    ]
  },
  {
    id: 6,
    dimension: 'Data Infrastructure & Readiness',
    text: "When your team uses data to make decisions, which statement best describes your confidence in that data's reliability?",
    options: [
      { value: 'A', label: 'We rarely question data quality and generally accept what systems provide', score: 0 },
      { value: 'B', label: 'We are aware of data quality issues but lack systematic processes to address them', score: 1 },
      { value: 'C', label: 'We have identified major data quality issues and have plans to address them', score: 2 },
      { value: 'D', label: 'We have systematic data quality monitoring, documented standards, and regular audits', score: 4 }
    ]
  },
  {
    id: 7,
    dimension: 'Data Infrastructure & Readiness',
    text: 'Does your organisation have a documented data governance policy that specifically addresses how AI-generated outputs should be stored, audited, and explained to regulators or customers?',
    options: [
      { value: 'A', label: 'No documented policy exists', score: 0 },
      { value: 'B', label: 'A general data policy exists but does not specifically address AI outputs', score: 1 },
      { value: 'C', label: 'Our policy addresses AI outputs in principle but lacks operational specificity', score: 2 },
      { value: 'D', label: 'We have a documented, operationalised AI output governance policy reviewed in the last 12 months', score: 4 }
    ]
  },
  {
    id: 8,
    dimension: 'Data Infrastructure & Readiness',
    text: 'How would you characterise the accessibility of data across departments in your organisation for the purpose of building or evaluating AI models?',
    options: [
      { value: 'A', label: 'Data is heavily siloed with limited cross-departmental access', score: 0 },
      { value: 'B', label: 'Some cross-departmental data sharing occurs but through manual, time-consuming processes', score: 1 },
      { value: 'C', label: 'Structured data sharing exists for specific use cases but is not systematic', score: 2 },
      { value: 'D', label: 'We have API-enabled, governed data sharing infrastructure that supports cross-departmental AI development', score: 4 }
    ]
  },
  {
    id: 9,
    dimension: 'Data Infrastructure & Readiness',
    text: 'When evaluating AI-powered vendor solutions, does your team have a structured framework for assessing model bias, explainability, and regulatory compliance?',
    options: [
      { value: 'A', label: 'We rely primarily on vendor assurances without independent evaluation', score: 0 },
      { value: 'B', label: 'We ask vendors questions but do not have a formal evaluation framework', score: 1 },
      { value: 'C', label: 'We have an informal checklist but it has not been formally adopted', score: 2 },
      { value: 'D', label: 'We have a formal, documented AI vendor evaluation framework used consistently in procurement decisions', score: 4 }
    ]
  },
  {
    id: 10,
    dimension: 'Data Infrastructure & Readiness',
    text: 'What percentage of your team can independently perform basic data analysis using tools beyond Excel — such as SQL, Power BI, Tableau, or Python?',
    options: [
      { value: 'A', label: 'Less than 10%', score: 0 },
      { value: 'B', label: '10–25%', score: 1 },
      { value: 'C', label: '26–50%', score: 2 },
      { value: 'D', label: 'More than 50%', score: 4 }
    ]
  },
  {
    id: 11,
    dimension: 'AI Strategy & Leadership',
    text: 'Does your organisation have a named executive or committee accountable for AI strategy and implementation?',
    options: [
      { value: 'A', label: 'No accountability structure', score: 0 },
      { value: 'B', label: 'Informal ownership', score: 1 },
      { value: 'C', label: 'Named owner, no mandate', score: 2 },
      { value: 'D', label: 'Executive sponsor with budget and mandate', score: 4 }
    ]
  },
  {
    id: 12,
    dimension: 'AI Strategy & Leadership',
    text: 'Has your organisation defined specific AI use cases it plans to implement in the next 12 months?',
    options: [
      { value: 'A', label: 'No defined use cases', score: 0 },
      { value: 'B', label: 'Use cases discussed but not documented', score: 1 },
      { value: 'C', label: 'Documented but not funded', score: 2 },
      { value: 'D', label: 'Documented, funded, and assigned to owners', score: 4 }
    ]
  },
  {
    id: 13,
    dimension: 'AI Strategy & Leadership',
    text: "How does AI investment appear in your organisation's annual budget?",
    options: [
      { value: 'A', label: 'Not a budget line item', score: 0 },
      { value: 'B', label: 'Bundled under IT/tech', score: 1 },
      { value: 'C', label: 'Separate line item, limited scope', score: 2 },
      { value: 'D', label: 'Dedicated AI investment budget with ROI tracking', score: 4 }
    ]
  },
  {
    id: 14,
    dimension: 'AI Strategy & Leadership',
    text: 'How frequently does your leadership team review AI strategy and progress?',
    options: [
      { value: 'A', label: 'Never or ad hoc', score: 0 },
      { value: 'B', label: 'Annually', score: 1 },
      { value: 'C', label: 'Quarterly', score: 2 },
      { value: 'D', label: 'Monthly with structured KPIs', score: 4 }
    ]
  },
  {
    id: 15,
    dimension: 'AI Strategy & Leadership',
    text: 'Has your organisation conducted a formal AI readiness or maturity assessment in the past 2 years?',
    options: [
      { value: 'A', label: 'Never', score: 0 },
      { value: 'B', label: 'Informal internal review only', score: 1 },
      { value: 'C', label: 'External review but not acted upon', score: 2 },
      { value: 'D', label: 'External review with documented action plan', score: 4 }
    ]
  },
  {
    id: 16,
    dimension: 'Workflow Integration & Adoption',
    text: "How many of your team's core workflows have an AI or automation component today?",
    options: [
      { value: 'A', label: 'None', score: 0 },
      { value: 'B', label: '1–2 workflows', score: 1 },
      { value: 'C', label: '3–5 workflows', score: 2 },
      { value: 'D', label: 'More than 5, systematically documented', score: 4 }
    ]
  },
  {
    id: 17,
    dimension: 'Workflow Integration & Adoption',
    text: 'When a new AI tool is introduced in your department, how is adoption typically managed?',
    options: [
      { value: 'A', label: 'No structured adoption process', score: 0 },
      { value: 'B', label: 'Email announcement only', score: 1 },
      { value: 'C', label: 'Training session but no follow-up', score: 2 },
      { value: 'D', label: 'Structured change management with champions, training, and adoption metrics', score: 4 }
    ]
  },
  {
    id: 18,
    dimension: 'Workflow Integration & Adoption',
    text: "How would you rate your team's resistance to adopting AI-assisted workflows?",
    options: [
      { value: 'A', label: 'High resistance, cultural barrier', score: 0 },
      { value: 'B', label: 'Some resistance, no active resolution', score: 1 },
      { value: 'C', label: 'Moderate openness, limited champions', score: 2 },
      { value: 'D', label: 'Active enthusiasm with visible internal advocates', score: 4 }
    ]
  },
  {
    id: 19,
    dimension: 'Workflow Integration & Adoption',
    text: 'Does your organisation track productivity metrics that would reveal the impact of AI tool adoption?',
    options: [
      { value: 'A', label: 'No productivity metrics tracked', score: 0 },
      { value: 'B', label: 'General productivity tracked, not AI-specific', score: 1 },
      { value: 'C', label: 'Some AI-specific metrics tracked informally', score: 2 },
      { value: 'D', label: 'Formal AI productivity dashboard reviewed by leadership', score: 4 }
    ]
  },
  {
    id: 20,
    dimension: 'Workflow Integration & Adoption',
    text: 'Do employees in your team have dedicated time or resources for AI experimentation and learning?',
    options: [
      { value: 'A', label: 'No structured time or resources', score: 0 },
      { value: 'B', label: 'Informal, ad hoc only', score: 1 },
      { value: 'C', label: 'Occasional learning sprints', score: 2 },
      { value: 'D', label: 'Structured innovation time with management support', score: 4 }
    ]
  },
  {
    id: 21,
    dimension: 'Ethics, Risk & Compliance',
    text: 'Does your organisation have a published Responsible AI policy or framework?',
    options: [
      { value: 'A', label: 'No', score: 0 },
      { value: 'B', label: 'In development', score: 1 },
      { value: 'C', label: 'Exists but not operationalised', score: 2 },
      { value: 'D', label: 'Operationalised with staff training', score: 4 }
    ]
  },
  {
    id: 22,
    dimension: 'Ethics, Risk & Compliance',
    text: 'How does your organisation address the risk of bias in AI-generated outputs that affect customer decisions?',
    options: [
      { value: 'A', label: 'Not currently addressed', score: 0 },
      { value: 'B', label: 'Awareness exists but no process', score: 1 },
      { value: 'C', label: 'Audit process exists for some systems', score: 2 },
      { value: 'D', label: 'Systematic bias auditing for all customer-facing AI', score: 4 }
    ]
  },
  {
    id: 23,
    dimension: 'Ethics, Risk & Compliance',
    text: 'When an AI system makes a decision that affects a customer or employee, is there a documented human review escalation path?',
    options: [
      { value: 'A', label: 'No escalation path exists', score: 0 },
      { value: 'B', label: 'Informal escalation only', score: 1 },
      { value: 'C', label: 'Documented but not consistently followed', score: 2 },
      { value: 'D', label: 'Documented, trained, and audited regularly', score: 4 }
    ]
  },
  {
    id: 24,
    dimension: 'Ethics, Risk & Compliance',
    text: 'How prepared is your organisation to explain an AI-driven decision to a regulator or customer on short notice?',
    options: [
      { value: 'A', label: 'Not prepared at all', score: 0 },
      { value: 'B', label: 'Could provide general explanation only', score: 1 },
      { value: 'C', label: 'Could explain methodology but not specific decision logic', score: 2 },
      { value: 'D', label: 'Can provide full audit trail and explainability documentation on demand', score: 4 }
    ]
  },
  {
    id: 25,
    dimension: 'Ethics, Risk & Compliance',
    text: 'Does your organisation conduct AI-specific risk assessments before deploying new AI tools or models?',
    options: [
      { value: 'A', label: 'No risk assessment conducted', score: 0 },
      { value: 'B', label: 'General IT risk assessment only', score: 1 },
      { value: 'C', label: 'AI risk considered but no formal framework', score: 2 },
      { value: 'D', label: 'Formal AI risk assessment framework applied pre-deployment', score: 4 }
    ]
  }
];
