import type { FirmType, Question, QuestionOption } from './types';

export const DEFAULT_FIRM_TYPE: FirmType = 'financial-services';

export const FIRM_TYPE_OPTIONS: Array<{
  value: FirmType;
  label: string;
  description: string;
}> = [
  {
    value: 'financial-services',
    label: 'Financial Services',
    description: 'Banks, fintechs, insurers, and regulated financial institutions.'
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    description: 'Hospitals, clinics, health systems, and patient-facing care organisations.'
  },
  {
    value: 'consulting-firms',
    label: 'Consulting Firms',
    description: 'Management consulting, audit, legal, tax, and advisory firms.'
  },
  {
    value: 'smes',
    label: 'SMEs',
    description: 'Small and medium enterprises across operations, services, retail, and production.'
  }
];

export const DIMENSION_LABELS = {
  aiLiteracy: 'AI Awareness & Literacy',
  dataReadiness: 'Data Infrastructure & Readiness',
  aiStrategy: 'Process Integration Capability',
  workflowAdoption: 'Leadership & Strategic Alignment',
  ethicsCompliance: 'Risk, Ethics & Governance Readiness'
} as const;

const DIMENSION_1 = DIMENSION_LABELS.aiLiteracy;
const DIMENSION_2 = DIMENSION_LABELS.dataReadiness;
const DIMENSION_3 = DIMENSION_LABELS.aiStrategy;
const DIMENSION_4 = DIMENSION_LABELS.workflowAdoption;
const DIMENSION_5 = DIMENSION_LABELS.ethicsCompliance;

function singleChoiceOptions(
  a: string,
  b: string,
  c: string,
  d: string
): QuestionOption[] {
  return [
    { value: 'A', label: a, score: 0 },
    { value: 'B', label: b, score: 1 },
    { value: 'C', label: c, score: 2 },
    { value: 'D', label: d, score: 4 }
  ];
}

function multiSelectOptions(labels: string[]): QuestionOption[] {
  return [
    ...labels.map((label, index) => ({
      value: `option-${index + 1}`,
      label,
      score: 1
    })),
    {
      value: 'none-of-the-above',
      label: 'None of the above',
      score: 0
    }
  ];
}

function createQuestion(
  id: number,
  dimension: string,
  text: string,
  options: QuestionOption[],
  multiSelect = false
): Question {
  return {
    id,
    dimension,
    text,
    options,
    ...(multiSelect ? { multiSelect: true } : {})
  };
}

const healthcareQuestions: Question[] = [
  createQuestion(
    1,
    DIMENSION_1,
    'When an AI-assisted diagnostic support tool flags a patient result in your clinical workflow - such as an abnormal scan reading, a sepsis risk score, or a drug interaction alert - which statement best describes how your clinical staff currently respond?',
    singleChoiceOptions(
      'Staff accept AI flags without specific evaluation of how the alert was generated',
      'Staff are aware the alert is AI-generated but do not have training on when to trust or override it',
      "Staff understand the general basis for AI alerts but have not been trained on the specific failure modes or confidence thresholds of the tools they use",
      "Staff have received documented training on AI alert interpretation, understand the tool's sensitivity and specificity, and follow a defined protocol for when to escalate or override"
    )
  ),
  createQuestion(
    2,
    DIMENSION_1,
    "How would you characterise your administrative and operations team's understanding of AI applications relevant to their specific roles - such as AI-powered scheduling, billing optimisation, supply chain prediction, or patient flow management?",
    singleChoiceOptions(
      'Administrative staff are generally unaware of how AI tools could apply to their specific functions',
      'Some staff are personally curious about AI but the organisation has not provided role-specific AI education',
      'Administrative leadership understands AI applications conceptually but frontline staff have not received practical training',
      'Administrative staff across functions have received role-specific AI training and at least one AI application has been implemented in administrative operations with documented outcomes'
    )
  ),
  createQuestion(
    3,
    DIMENSION_1,
    "With respect to Nigeria's National Health Act provisions on patient data, the NDPA data protection obligations, and emerging global standards for AI in clinical decision support - which statement best describes your organisation's current position?",
    singleChoiceOptions(
      'We are not specifically aware of regulatory obligations that apply to AI use in our clinical and administrative operations',
      'We are aware obligations exist but have not yet assessed what they specifically require of our organisation',
      'We have assessed our obligations but implementation of compliance measures is incomplete or undocumented',
      'We have assessed our obligations, implemented documented compliance measures, and can demonstrate compliance to a regulatory inspector upon request'
    )
  ),
  createQuestion(
    4,
    DIMENSION_1,
    'Which of the following AI-powered tools or capabilities are actively used in your organisation? Select all that apply.',
    multiSelectOptions([
      'Electronic Health Record AI features (predictive alerts, automated documentation, coding assistance)',
      'AI-assisted diagnostic imaging analysis',
      'AI-powered patient scheduling and appointment optimisation',
      'Automated clinical documentation or discharge summary generation',
      'AI-driven supply chain and pharmacy inventory management',
      'Predictive readmission or patient deterioration scoring',
      'Telemedicine AI triage or symptom assessment tools',
      'Generative AI tools used by administrative or clinical staff for communication or reporting'
    ]),
    true
  ),
  createQuestion(
    5,
    DIMENSION_1,
    'When did your clinical and administrative leadership team last complete a formal learning experience specifically focused on AI applications in healthcare - not general digital health, but specifically AI?',
    singleChoiceOptions(
      'Never or more than 3 years ago',
      '1-3 years ago',
      '6-12 months ago',
      'Within the last 6 months through a structured programme with documented learning outcomes'
    )
  ),
  createQuestion(
    6,
    DIMENSION_2,
    "When clinical staff use patient data to make treatment decisions or when your organisation uses data to make operational decisions, which statement best describes your confidence in that data's completeness and accuracy?",
    singleChoiceOptions(
      'Data quality issues are widespread and widely acknowledged but there is no systematic programme to address them',
      'We are aware of specific data quality problems in key systems but remediation is not yet resourced or planned',
      'We have identified major data quality issues and active remediation is underway but not yet complete',
      'We have systematic data quality monitoring, documented standards, regular audits, and can demonstrate data quality metrics to funders or accreditation bodies'
    )
  ),
  createQuestion(
    7,
    DIMENSION_2,
    'Does your organisation have a documented policy that specifically addresses how patient data may be used in AI systems - covering consent requirements, anonymisation standards, third-party AI vendor data access, and audit trails for AI-assisted clinical decisions?',
    singleChoiceOptions(
      'No documented policy exists covering AI-specific data use',
      'A general data protection policy exists but does not specifically address AI applications or AI vendor data access',
      'A policy is being developed but has not been formally adopted or communicated to clinical and administrative staff',
      'A documented, formally adopted policy exists, has been reviewed within the last 12 months, and all relevant staff have been briefed on its requirements'
    )
  ),
  createQuestion(
    8,
    DIMENSION_2,
    'How would you characterise the ability of your clinical and administrative data systems to share information with each other in ways that could support AI applications - such as connecting patient records, laboratory systems, pharmacy data, and scheduling systems?',
    singleChoiceOptions(
      'Our systems are largely siloed with minimal automated data sharing between departments or functions',
      'Some data sharing exists but primarily through manual processes such as data exports or staff re-entering information between systems',
      'Partial system integration exists for specific use cases but significant data silos remain that would limit AI deployment',
      'We have structured system integration with documented data flows that could support AI model training or real-time AI decision support without significant additional infrastructure investment'
    )
  ),
  createQuestion(
    9,
    DIMENSION_2,
    'When evaluating healthcare AI vendors - such as diagnostic AI companies, patient management platforms, or clinical decision support providers - does your procurement and clinical leadership team have a structured framework for assessing the vendor\'s AI model accuracy, bias risks, regulatory compliance, and clinical validation evidence?',
    singleChoiceOptions(
      'We rely primarily on vendor claims and sales presentations without independent clinical or technical evaluation',
      'We ask questions during procurement but do not have a formal evaluation framework applied consistently',
      'We have an informal checklist used by some procurement decisions but it has not been formally adopted or trained to procurement leads',
      'We have a formal AI vendor evaluation framework that requires documented clinical validation evidence, bias testing results, and regulatory compliance certification before procurement approval'
    )
  ),
  createQuestion(
    10,
    DIMENSION_2,
    'What percentage of your clinical and administrative management team can independently use data analysis tools - beyond basic spreadsheet functions - to generate operational or clinical insights relevant to their role?',
    singleChoiceOptions(
      'Less than 10%',
      '10-25%',
      '26-50%',
      'More than 50% with documented data literacy development continuing'
    )
  ),
  createQuestion(
    11,
    DIMENSION_3,
    'Thinking about your three highest-volume clinical or administrative workflows, how many of them have been formally evaluated for AI augmentation potential - with a documented assessment of where AI could improve speed, accuracy, or resource utilisation - in the last 12 months?',
    singleChoiceOptions(
      'None have been formally evaluated',
      'One has been evaluated',
      'Two have been evaluated',
      'All three or more have been formally evaluated with documented findings'
    )
  ),
  createQuestion(
    12,
    DIMENSION_3,
    'When new clinical or administrative technology has been introduced in your organisation previously, which outcome best describes what typically happened with adoption?',
    singleChoiceOptions(
      'Technologies were deployed but clinical or administrative resistance meant they were used inconsistently or abandoned within 12 months',
      'Technologies achieved partial adoption among willing early adopters but never became standard practice organisation-wide',
      'Technologies achieved reasonable adoption but without structured measurement of their impact on patient outcomes or operational efficiency',
      'Technologies achieved strong adoption with documented impact measurement, formal change management support, and sustained usage beyond the initial implementation period'
    )
  ),
  createQuestion(
    13,
    DIMENSION_3,
    'In your organisation, who currently has the authority to approve the deployment of an AI tool that will influence clinical decisions - such as a sepsis prediction algorithm, an AI-assisted radiology tool, or an automated medication dosing system?',
    singleChoiceOptions(
      'No clear authority or defined approval process exists for clinical AI tools',
      'Approval is required but through an informal process that varies depending on who is advocating for the tool',
      'A formal approval process exists but does not include AI-specific clinical validation review or bias assessment',
      'A formal clinical AI governance process exists with defined criteria including clinical validation evidence requirements, bias testing, and documented sign-off from both clinical leadership and the medical director or equivalent'
    )
  ),
  createQuestion(
    14,
    DIMENSION_3,
    'For any AI tools your organisation has already deployed, does your organisation systematically measure their impact on patient outcomes, clinical efficiency, or operational cost?',
    singleChoiceOptions(
      'No systematic measurement occurs for deployed AI tools',
      'Anecdotal feedback is collected from clinical staff but no formal outcome measurement',
      'Some measurement occurs for specific high-visibility tools but not as a standard practice for all AI deployments',
      'All deployed AI tools are subject to ongoing outcome measurement with documented metrics reported to clinical governance committees'
    )
  ),
  createQuestion(
    15,
    DIMENSION_3,
    'How often do your clinical leadership, IT, compliance, finance, and HR teams formally collaborate on AI-related decisions in your organisation?',
    singleChoiceOptions(
      'Rarely or never - AI decisions are typically made within individual departments without cross-functional consultation',
      'Only when a specific problem or incident forces collaboration across departments',
      'Informal cross-functional discussion occurs but without a documented governance structure or regular meeting cadence',
      'A formal cross-functional clinical AI governance committee meets regularly with documented agenda, decisions, and follow-up actions'
    )
  ),
  createQuestion(
    16,
    DIMENSION_4,
    "How would you characterise your most senior clinical and administrative leader's personal engagement with AI relevant to healthcare delivery?",
    singleChoiceOptions(
      'They are aware of AI as a healthcare trend but do not personally use or evaluate AI tools',
      'They follow AI developments in healthcare media but do not model AI-positive behaviour within the organisation',
      'They are active users of some AI tools and occasionally reference AI strategy in communications but without specific organisational targets',
      'They are personally proficient in healthcare AI concepts, set measurable AI adoption targets for the organisation, and visibly model AI-positive behaviour for clinical and administrative staff'
    )
  ),
  createQuestion(
    17,
    DIMENSION_4,
    'Does your organisation have a documented AI strategy - reviewed at board or senior leadership level - that includes specific targets for AI adoption in clinical care, administration, and workforce development?',
    singleChoiceOptions(
      'No AI strategy exists at any level of the organisation',
      'Digital transformation goals exist but without AI-specific targets or a dedicated AI component',
      'An AI strategy has been drafted but has not been formally approved at board or senior leadership level',
      'A formally approved AI strategy exists with specific, measurable targets for clinical AI adoption, administrative AI integration, and workforce AI capability development'
    )
  ),
  createQuestion(
    18,
    DIMENSION_4,
    'What is your organisation\'s current annual investment in AI-related capability development - including staff training, AI tool subscriptions, vendor evaluation, and external expertise - as a proportion of your total operational development budget?',
    singleChoiceOptions(
      'Less than 3% or the figure is unknown',
      '3-8%',
      '9-20%',
      'More than 20% with documented plans to increase in the next financial year'
    )
  ),
  createQuestion(
    19,
    DIMENSION_4,
    "How confident are you that your organisation's current AI capability development pace is keeping up with leading healthcare institutions in Nigeria and comparable African healthcare systems?",
    singleChoiceOptions(
      'We believe we are significantly behind leading healthcare institutions in our sector',
      'We are genuinely uncertain about our relative AI capability position',
      'We believe we are broadly comparable to most Nigerian healthcare institutions of similar size and type',
      'We have evidence that our AI capability is ahead of the majority of comparable institutions and we monitor sector developments systematically'
    )
  ),
  createQuestion(
    20,
    DIMENSION_4,
    'Has your organisation experienced talent attrition from high-performing clinical or administrative staff who cited insufficient access to modern technology or AI development opportunities as a contributing factor?',
    singleChoiceOptions(
      'Yes - this is a documented and recurring retention challenge',
      'We suspect it contributes to attrition but have not formally measured or investigated it',
      'We have heard this in exit conversations but consider it a secondary factor relative to compensation',
      'AI capability development is a documented component of our talent retention strategy with specific programmes addressing it'
    )
  ),
  createQuestion(
    21,
    DIMENSION_5,
    'If an AI tool used in your clinical operations was found to produce systematically different recommendations for patients based on gender, age, ethnicity, or socioeconomic status - resulting in potential health outcome disparities - how prepared is your organisation to detect, respond to, and remediate this?',
    singleChoiceOptions(
      'We have no current detection or response framework for AI bias in clinical tools',
      'We would rely on external notification - from regulators, vendors, or media - before investigating',
      'We have some internal awareness of bias risks but no documented detection protocols or response procedures',
      'We have documented bias monitoring protocols for all clinical AI tools, a tested incident response procedure, and regular independent audits'
    )
  ),
  createQuestion(
    22,
    DIMENSION_5,
    'Does your organisation have a documented AI clinical incident response plan - covering scenarios where an AI system produces a harmful clinical recommendation, fails to flag a deteriorating patient, or generates administrative errors with patient safety implications?',
    singleChoiceOptions(
      'No - patient safety incident protocols do not currently cover AI-specific failure scenarios',
      'We are aware this gap exists and intend to develop a protocol but have not yet started',
      'A protocol is being developed but has not been tested, formally adopted, or communicated to clinical staff',
      'Yes - a documented, tested protocol exists, has been incorporated into existing patient safety frameworks, and clinical staff have been trained on it'
    )
  ),
  createQuestion(
    23,
    DIMENSION_5,
    'For the AI-powered clinical and administrative tools provided by third-party vendors that your organisation currently uses, how does your organisation assess and monitor the ongoing safety, accuracy, and regulatory compliance of those tools?',
    singleChoiceOptions(
      'We do not formally assess or monitor vendor AI performance beyond the initial procurement decision',
      'We review vendor communications and updates but do not independently assess performance or compliance',
      'We conduct periodic reviews of key vendor tools but without a formal ongoing monitoring framework',
      'We have formal vendor AI performance monitoring embedded in our contract management process with defined performance metrics, regular review meetings, and documented escalation procedures'
    )
  ),
  createQuestion(
    24,
    DIMENSION_5,
    'When AI significantly influences a clinical decision affecting a patient - such as a risk score that determines treatment priority, an AI-assisted diagnostic finding, or an automated medication recommendation - does your organisation have a documented policy for how and when this is communicated to the patient?',
    singleChoiceOptions(
      'No policy exists for communicating AI involvement in clinical decisions to patients',
      'Individual clinicians make their own judgments about when to mention AI involvement without organisational guidance',
      'Informal guidance exists but it has not been formalised into policy or consistently implemented',
      'A documented policy exists for AI transparency in patient communication, has been reviewed by clinical ethics leadership, and is consistently implemented across all relevant clinical interactions'
    )
  ),
  createQuestion(
    25,
    DIMENSION_5,
    'Have staff in clinical and administrative roles that use or are directly affected by AI systems received specific training on AI ethics in healthcare - covering topics such as algorithmic bias, patient data rights, informed consent for AI-assisted care, and responsible AI use - within the last 12 months?',
    singleChoiceOptions(
      'No formal AI ethics training has been provided to any staff group',
      'Senior clinical leadership has received some exposure to AI ethics but operational clinical and administrative staff have not',
      'Technology and informatics teams have received AI ethics training but it has not extended to clinical or frontline administrative staff',
      'Structured AI ethics training appropriate to role has been provided to all relevant staff with documented completion records and an annual refresh cycle'
    )
  )
];

const consultingQuestions: Question[] = [
  createQuestion(
    1,
    DIMENSION_1,
    'When AI tools are used to support client engagement deliverables in your firm - such as AI-assisted data analysis, AI-generated first drafts of reports, AI-powered due diligence screening, or AI-assisted financial modelling - which statement best describes your team\'s current practice?',
    singleChoiceOptions(
      'AI tools are used by some individuals but without firm-wide guidance on quality assurance, disclosure, or appropriate use',
      'There is awareness that AI use should be governed but no formal policy or training has been provided',
      'Informal guidance exists and most senior staff understand appropriate use but junior staff using AI tools have not received structured training',
      'A documented AI use policy for client work exists, all fee-earning staff have been trained on it, and quality assurance processes for AI-assisted deliverables are consistently applied'
    )
  ),
  createQuestion(
    2,
    DIMENSION_1,
    'How would you characterise the AI literacy of the fee-earning staff in your highest-revenue practice area - their ability to use AI tools effectively, evaluate AI outputs critically, and explain AI-assisted methodology to clients?',
    singleChoiceOptions(
      'Most fee-earning staff in this practice area are not yet using AI tools in client work',
      'AI tools are being used individually by motivated staff members but without consistent methodology or quality standards',
      'AI tools are used systematically in some engagement types but staff capability varies significantly by seniority and individual interest',
      'AI literacy is consistent across the practice area, AI tools are integrated into standard engagement methodology, and client-facing staff can explain AI-assisted methods confidently'
    )
  ),
  createQuestion(
    3,
    DIMENSION_1,
    'With respect to professional standards bodies relevant to your firm - such as ICAN, ICAEW, the NBA, or international equivalents - and their current or emerging guidance on AI use in professional services, which statement best describes your firm\'s position?',
    singleChoiceOptions(
      'We are not specifically tracking professional standards guidance on AI use in our practice areas',
      'We are aware guidance is emerging but have not assessed its implications for our firm\'s practices',
      'We have assessed the implications but have not yet updated our methodologies or client disclosure practices in response',
      'We have reviewed all relevant professional standards guidance on AI, updated our engagement methodology accordingly, and have a process for monitoring future guidance changes'
    )
  ),
  createQuestion(
    4,
    DIMENSION_1,
    'Which of the following AI tools or capabilities are actively used in your firm\'s client-facing or knowledge work? Select all that apply.',
    multiSelectOptions([
      'Generative AI for first-draft report, memo, or proposal writing',
      'AI-powered document review and due diligence tools',
      'AI-assisted financial modelling or scenario analysis',
      'AI-powered research and competitive intelligence gathering',
      'AI-driven contract review or legal document analysis',
      'AI tools for audit sampling or anomaly detection',
      'Knowledge management AI for internal expertise retrieval',
      'AI-powered presentation or data visualisation tools'
    ]),
    true
  ),
  createQuestion(
    5,
    DIMENSION_1,
    'When did your firm\'s fee-earning staff last complete a formal, structured learning experience specifically focused on AI applications in professional services - not general digital skills, but specifically AI tools and methodology relevant to your practice areas?',
    singleChoiceOptions(
      'Never or more than 3 years ago',
      '1-3 years ago',
      '6-12 months ago through a programme with some relevance to your specific practice areas',
      'Within the last 6 months through a structured programme with documented competency outcomes specific to professional services AI applications'
    )
  ),
  createQuestion(
    6,
    DIMENSION_2,
    'When your firm receives client data for analysis, modelling, or audit purposes, which statement best describes your team\'s current capability to assess whether that data is of sufficient quality for AI-assisted analysis?',
    singleChoiceOptions(
      'Data quality assessment is informal and relies on individual staff judgment without a consistent framework',
      'Standard data quality checks exist for traditional analysis but have not been updated to reflect the specific data quality requirements of AI-assisted methods',
      'Updated data quality standards for AI-assisted work exist in some practice areas but are not applied consistently across the firm',
      'Consistent, documented data quality assessment frameworks for AI-assisted analysis are applied across all relevant practice areas with training provided to all relevant staff'
    )
  ),
  createQuestion(
    7,
    DIMENSION_2,
    'How would you characterise your firm\'s current knowledge management infrastructure - its ability to capture, organise, and make accessible the firm\'s accumulated expertise in ways that AI tools could enhance?',
    singleChoiceOptions(
      "Knowledge is largely held in individual staff members' heads or in unstructured document repositories without consistent taxonomy or access",
      'Document management systems exist but without the metadata, tagging, or structure that would make them suitable for AI-powered knowledge retrieval',
      'Structured knowledge repositories exist for some practice areas but significant knowledge remains siloed by team or by individual',
      'The firm has a systematically structured knowledge base with consistent taxonomy, regular curation, and the technical infrastructure to integrate AI-powered retrieval and synthesis tools'
    )
  ),
  createQuestion(
    8,
    DIMENSION_2,
    'Does your firm have a documented policy specifically addressing how client data may and may not be used in AI tools - covering questions such as whether client data can be entered into third-party AI platforms, how client confidentiality is maintained when using cloud-based AI tools, and what disclosures are required to clients when AI is used in their engagements?',
    singleChoiceOptions(
      'No policy exists addressing client data handling in AI environments',
      'General data protection policies exist but do not specifically address AI tool use with client data',
      'Informal guidance has been shared with staff but a formal documented policy has not been adopted',
      'A formal documented policy exists, has been reviewed by the firm\'s legal and risk function, and has been communicated to all fee-earning staff'
    )
  ),
  createQuestion(
    9,
    DIMENSION_2,
    'When evaluating new AI tools for use in client engagements or firm operations, does your firm have a structured evaluation framework that assesses accuracy claims, bias risks, data security, and professional standards compliance?',
    singleChoiceOptions(
      'Tool adoption decisions are primarily driven by individual partner or team preference without a firm-wide evaluation process',
      'Some informal evaluation occurs but without a documented framework applied consistently across tool adoption decisions',
      'An evaluation framework exists but is applied inconsistently and does not cover all relevant risk dimensions',
      'A formal AI tool evaluation framework is applied to all significant tool adoption decisions with documented assessment covering accuracy, bias, data security, and professional standards compliance'
    )
  ),
  createQuestion(
    10,
    DIMENSION_2,
    'What percentage of your firm\'s fee-earning staff can independently conduct meaningful data analysis using tools beyond standard spreadsheet functions - such as Power BI, Tableau, SQL, R, or Python - to generate client-relevant insights?',
    singleChoiceOptions(
      'Less than 10%',
      '10-25%',
      '26-50%',
      'More than 50% with an active programme to continue developing this capability across all seniority levels'
    )
  ),
  createQuestion(
    11,
    DIMENSION_3,
    'Thinking about your firm\'s three highest-revenue engagement types, how many of them have been formally reviewed and updated to integrate AI-assisted methods - with documented methodology updates, quality standards for AI outputs, and staff training on the updated approach?',
    singleChoiceOptions(
      'None of our core engagement methodologies have been formally updated to integrate AI',
      'One engagement type has been updated',
      'Two engagement types have been updated',
      'All three or more have been formally updated with documented AI-integrated methodology, quality standards, and staff training'
    )
  ),
  createQuestion(
    12,
    DIMENSION_3,
    'When new technology tools have been introduced in your firm previously, which outcome best describes what typically happened?',
    singleChoiceOptions(
      'Tools were adopted by technically interested individuals but never achieved consistent firm-wide usage',
      'Tools achieved mandatory adoption for specific tasks but without genuine staff proficiency or enthusiasm',
      'Tools achieved reasonable adoption but productivity impact was not formally measured or communicated',
      'Tools achieved consistent firm-wide adoption with documented productivity improvement, formal change management support, and sustained usage integrated into performance expectations'
    )
  ),
  createQuestion(
    13,
    DIMENSION_3,
    'When AI tools are used to produce or contribute to client deliverables, does your firm have a defined quality assurance process that specifically addresses the review of AI-generated content - covering accuracy verification, bias checking, appropriate attribution, and professional standards compliance?',
    singleChoiceOptions(
      'No QA process specifically addresses AI-generated content in client deliverables',
      'General review processes are applied but reviewers have not been trained on the specific failure modes of AI-generated content',
      'Guidance on AI content review has been shared but it has not been formalised into the standard QA process',
      'A documented QA process for AI-assisted deliverables exists, reviewers have been trained on AI-specific failure modes, and compliance with the process is monitored'
    )
  ),
  createQuestion(
    14,
    DIMENSION_3,
    'Does your firm currently measure the productivity impact of AI tools that have been deployed - in terms of time saved per engagement type, reductions in revision cycles, improvements in research quality, or increases in engagement margin?',
    singleChoiceOptions(
      'No systematic measurement of AI productivity impact occurs',
      'Informal estimates circulate within practice areas but no formal measurement',
      'Measurement occurs in some practice areas but not as a firm-wide standard',
      'Systematic productivity measurement for AI tool deployment is standard practice with results reported to practice leadership and used to inform L&D investment decisions'
    )
  ),
  createQuestion(
    15,
    DIMENSION_3,
    'How often do your technology, risk, legal, L&D, and fee-earning practice leadership teams formally collaborate on AI-related decisions - such as tool adoption, methodology updates, client disclosure policy, and staff training requirements?',
    singleChoiceOptions(
      'AI decisions are made within individual practice areas without systematic cross-functional collaboration',
      'Collaboration occurs reactively when a specific issue or client question forces it',
      'Regular informal collaboration occurs but without a formal governance structure or documented decision-making process',
      'A formal AI governance process involving all relevant functions meets on a regular cadence with documented outputs and accountability for implementation'
    )
  ),
  createQuestion(
    16,
    DIMENSION_4,
    "How would you characterise your firm's senior partners' or directors' personal engagement with AI tools relevant to professional services?",
    singleChoiceOptions(
      'Most senior partners are aware of AI developments but do not personally use AI tools in their practice',
      'Some senior partners use AI tools personally but this is not reflected in firm-wide expectations or behaviour modelling',
      'A significant proportion of senior partners use AI tools and advocate for their adoption but without formal targets or accountability',
      'Senior partners are expected to demonstrate AI proficiency, are supported to develop it through structured programmes, and actively model AI-positive behaviour for junior staff'
    )
  ),
  createQuestion(
    17,
    DIMENSION_4,
    'Does your firm have a documented AI strategy - approved at senior leadership or management committee level - that includes specific targets for AI integration in client service delivery, internal operations, and staff capability development?',
    singleChoiceOptions(
      'No firm-wide AI strategy exists',
      'Digital transformation goals exist but AI is not addressed as a specific strategic priority with its own targets and investment allocation',
      'An AI strategy has been developed but has not been formally approved at management committee level or communicated firm-wide',
      'A formally approved, firm-wide AI strategy exists with specific measurable targets, a named owner, and a dedicated budget allocation'
    )
  ),
  createQuestion(
    18,
    DIMENSION_4,
    'What proportion of your firm\'s annual L&D budget is currently allocated to AI-specific capability development - including AI tool training, AI methodology updates, and AI leadership development?',
    singleChoiceOptions(
      'Less than 5% or the figure is unknown to L&D leadership',
      '5-15%',
      '16-30%',
      'More than 30% with a documented plan to increase allocation as AI capability requirements deepen'
    )
  ),
  createQuestion(
    19,
    DIMENSION_4,
    'How confident are you that your firm\'s current AI capability development pace is keeping up with the Big 4 and leading mid-tier firms in your primary markets?',
    singleChoiceOptions(
      'We believe we are significantly behind the leading firms in our sector on AI capability',
      'We are genuinely uncertain about our competitive AI capability position',
      'We believe we are broadly comparable to most firms of similar size and market position',
      'We have evidence that our AI capability is ahead of comparable firms and we systematically monitor competitor AI developments to maintain this position'
    )
  ),
  createQuestion(
    20,
    DIMENSION_4,
    'Has your firm experienced talent attrition from high-performing staff - particularly at associate and manager level - where insufficient AI training or technology modernisation was cited as a contributing factor?',
    singleChoiceOptions(
      'Yes - this is a documented and recurring retention challenge that leadership has acknowledged',
      'We suspect it contributes but have not formally investigated its role in attrition',
      'It has appeared in exit interview data but is considered secondary to compensation factors',
      'AI capability development is a documented retention strategy element with specific programmes designed to retain technically ambitious staff'
    )
  ),
  createQuestion(
    21,
    DIMENSION_5,
    'Has your firm\'s professional indemnity insurance and risk management framework been reviewed to assess whether AI-assisted work products are covered under existing professional liability terms, and whether new AI-specific risk disclosures are required in client engagement letters?',
    singleChoiceOptions(
      'This review has not been conducted and we are uncertain about our liability position for AI-assisted work',
      'We are aware this review is needed but it has not yet been prioritised or resourced',
      'An internal review has been conducted but external legal or insurance advice has not been sought',
      'A comprehensive review has been conducted with external legal and insurance advice, engagement letter templates have been updated, and relevant staff have been briefed on liability implications'
    )
  ),
  createQuestion(
    22,
    DIMENSION_5,
    'Does your firm have documented protocols specifically designed to detect and prevent the inclusion of AI hallucinations - factually incorrect AI-generated content - in client deliverables?',
    singleChoiceOptions(
      'No specific protocols exist for AI hallucination detection in client work',
      'General review processes are relied upon without specific training on AI hallucination risks',
      'Guidance on AI verification has been shared informally but not formalised into the standard deliverable review process',
      'Documented protocols for AI output verification exist, reviewers are specifically trained on AI hallucination failure modes relevant to their practice area, and compliance is monitored'
    )
  ),
  createQuestion(
    23,
    DIMENSION_5,
    'When AI tools have meaningfully contributed to the analysis, findings, or recommendations in a client deliverable, does your firm have a consistent policy for how this contribution is disclosed to clients?',
    singleChoiceOptions(
      'No disclosure policy exists and AI contribution to deliverables is not disclosed to clients',
      'Individual partners make their own judgments about AI disclosure without firm guidance',
      'Informal guidance suggests disclosure in certain circumstances but it has not been formalised into policy',
      "A documented client AI disclosure policy exists, has been reviewed by the firm's legal and ethics function, is consistently applied, and is referenced in engagement letter templates"
    )
  ),
  createQuestion(
    24,
    DIMENSION_5,
    'For the AI tools your firm uses that are provided by third-party vendors, has your firm assessed the data security, model bias, and contractual protections relevant to using those tools with confidential client data?',
    singleChoiceOptions(
      'Third-party AI tools are used without formal risk assessment of data security or model characteristics',
      'General IT security review occurs but does not specifically assess AI-related risks such as training data use or model bias',
      'Assessment has been conducted for some high-visibility AI tools but not systematically for all tools in use',
      'All third-party AI tools used with client data are subject to formal risk assessment covering data security, model bias, contractual protections, and compliance with client data handling obligations'
    )
  ),
  createQuestion(
    25,
    DIMENSION_5,
    'Have fee-earning and management staff received specific training on AI ethics in professional services - covering topics such as appropriate AI use in client work, bias in AI-generated analysis, professional standards compliance, and client confidentiality in AI environments - within the last 12 months?',
    singleChoiceOptions(
      'No formal AI ethics training has been provided to any staff group',
      'Senior leadership has received some exposure but fee-earning and operational staff have not',
      'Technology and risk teams have received AI ethics training but it has not extended to fee-earning staff who use AI tools daily',
      'Role-appropriate AI ethics training has been provided to all relevant staff with documented completion records, and an annual refresh is built into the L&D calendar'
    )
  )
];

const smeQuestions: Question[] = [
  createQuestion(
    1,
    DIMENSION_1,
    'In a typical working week, how often do you or your management team use an AI tool - such as ChatGPT, Claude, Gemini, Copilot, or any other AI-powered tool - to complete tasks related to running your business?',
    singleChoiceOptions(
      'Rarely or never - AI tools are not currently part of how we work',
      'Occasionally, but informally and without a consistent approach to which tools we use or how',
      'Regularly for specific tasks such as writing, research, or communication, but we have not extended AI use systematically across our operations',
      'Daily, across multiple functions in the business, with an intentional approach to which tools we use and how we evaluate their outputs'
    )
  ),
  createQuestion(
    2,
    DIMENSION_1,
    'If you asked your team right now to describe three ways AI could improve how they do their specific jobs, how many of them could give you a confident, specific answer?',
    singleChoiceOptions(
      'Fewer than 20% of the team could answer this confidently',
      '20-40% could give some kind of answer but most would be vague or generic',
      '40-70% could give a reasonable answer based on their own research and curiosity',
      'More than 70% could give specific, confident answers because we have invested in building this awareness deliberately'
    )
  ),
  createQuestion(
    3,
    DIMENSION_1,
    'Are you aware of any regulations, data protection obligations, or industry standards that specifically affect how your business can use AI tools - particularly in relation to customer data, employee data, or automated decision-making?',
    singleChoiceOptions(
      'I am not aware of specific regulatory obligations related to AI use in my business',
      'I know regulations probably apply but I have not investigated what they specifically require',
      'I have a general understanding of the obligations that apply but have not implemented specific compliance measures',
      'I have assessed our specific obligations, implemented compliance measures, and can explain our AI data handling practices to customers or partners who ask'
    )
  ),
  createQuestion(
    4,
    DIMENSION_1,
    'Which of the following AI tools or capabilities does your business currently use regularly? Select all that apply.',
    multiSelectOptions([
      'Generative AI for writing, communication, or content creation',
      'AI tools for customer service or automated response management',
      'AI-powered bookkeeping, invoicing, or financial management',
      'AI-assisted marketing - social media, email, advertising optimisation',
      'AI tools for operations - scheduling, inventory, logistics',
      'AI-powered recruitment or HR tools',
      'Data analytics or business intelligence tools with AI features',
      'AI tools for market research or competitor monitoring'
    ]),
    true
  ),
  createQuestion(
    5,
    DIMENSION_1,
    'When did you or your key team members last complete a structured learning experience specifically focused on AI for business - not just watching videos or reading articles, but a course, workshop, or programme with specific learning outcomes?',
    singleChoiceOptions(
      'Never, or the question does not apply',
      'More than 12 months ago',
      '6-12 months ago',
      'Within the last 6 months through a structured programme with specific outcomes you can describe'
    )
  ),
  createQuestion(
    6,
    DIMENSION_2,
    "When you need to make an important business decision - about pricing, inventory, hiring, marketing spend, or customer strategy - how confident are you in the quality and completeness of the data available to inform that decision?",
    singleChoiceOptions(
      'We make most important decisions based on instinct and experience rather than data because our data is unreliable or inaccessible',
      'Some data is available but it is often incomplete, inconsistently recorded, or difficult to access quickly',
      'Reasonably good data exists for most major decisions but data quality and accessibility are inconsistent across different areas of the business',
      'We have reliable, well-organised data for most major decision areas, and we trust it enough to base significant business decisions on it confidently'
    )
  ),
  createQuestion(
    7,
    DIMENSION_2,
    'How does your business currently store and manage customer data - purchase history, preferences, contact information, and interaction records?',
    singleChoiceOptions(
      "Customer data is scattered across spreadsheets, phone contacts, messaging apps, and individual staff members' notes with no central system",
      'A basic system exists - such as a CRM or a well-maintained spreadsheet - but it is not consistently updated or used by all relevant staff',
      'A reasonable customer data system exists and is used consistently but it lacks the integration or completeness that would support AI-powered customer insights',
      'Customer data is systematically captured, consistently maintained in a structured system, and organised in a way that could support AI-powered analysis and personalisation'
    )
  ),
  createQuestion(
    8,
    DIMENSION_2,
    'Does your business systematically capture data on your core operational processes - such as production time, delivery performance, customer service resolution time, or employee productivity - in a way that would allow you to identify patterns and improvement opportunities?',
    singleChoiceOptions(
      'Operational data is not systematically captured or stored',
      'Some operational data is recorded but inconsistently and not in a format that makes analysis straightforward',
      'Key operational metrics are tracked but the data is not well-integrated and analysis requires significant manual effort',
      'Core operational data is systematically captured in structured formats and is regularly used to identify improvement opportunities and track performance'
    )
  ),
  createQuestion(
    9,
    DIMENSION_2,
    'How well do the different software tools your business uses - accounting software, CRM, inventory management, communications tools, and e-commerce platforms - share information with each other?',
    singleChoiceOptions(
      'Our tools are largely disconnected and staff spend significant time manually transferring data between systems',
      'Some tools share data but many critical integrations are missing and manual data transfer is still common',
      'The most important tool integrations exist but some data silos remain that create inefficiency',
      'Our core business tools are well-integrated with automated data sharing, minimal manual transfer, and a clear view of business performance across systems'
    )
  ),
  createQuestion(
    10,
    DIMENSION_2,
    'How many people in your business - beyond yourself - can confidently use data to identify a business problem, analyse its causes, and present a data-supported recommendation for addressing it?',
    singleChoiceOptions(
      'None or just one person',
      '2-3 people',
      '4-6 people',
      'More than 6 people with a deliberate plan to develop this capability further across the team'
    )
  ),
  createQuestion(
    11,
    DIMENSION_3,
    'Thinking about the three tasks in your business that consume the most staff time each week, have you formally evaluated whether AI tools could automate or significantly accelerate any of them?',
    singleChoiceOptions(
      'I have not formally evaluated any of our major time-consuming tasks for AI potential',
      'I have thought about it informally but have not done a structured evaluation',
      'I have evaluated one or two tasks and identified AI potential but have not yet implemented anything',
      'I have systematically evaluated our highest time-cost processes for AI potential and have already implemented AI solutions in at least one of them with measurable results'
    )
  ),
  createQuestion(
    12,
    DIMENSION_3,
    'When your business has adopted new technology tools in the past - accounting software, CRM, e-commerce platforms, or communication tools - which outcome best describes what typically happened?',
    singleChoiceOptions(
      'New tools were purchased but staff resisted using them and the business largely reverted to previous methods',
      'Tools were adopted by some staff but never achieved consistent use across the whole team',
      'Tools were adopted but without formal training or measurement of whether they actually improved business performance',
      'New tools were adopted with structured onboarding, consistent team usage, and documented improvement in the business outcomes they were designed to address'
    )
  ),
  createQuestion(
    13,
    DIMENSION_3,
    'Has your business identified specific points in your customer journey - from first contact through purchase, delivery, and after-sales - where AI tools could measurably improve the customer experience or reduce the cost of delivering it?',
    singleChoiceOptions(
      'We have not systematically mapped our customer journey or identified AI improvement opportunities within it',
      'We have a general sense of where AI could help customers but have not done a structured analysis',
      'We have identified specific AI improvement opportunities but have not yet evaluated tools or begun implementation',
      'We have mapped our customer journey against AI improvement opportunities, evaluated specific tools, and implemented at least one AI-powered customer experience improvement with measured results'
    )
  ),
  createQuestion(
    14,
    DIMENSION_3,
    'When you implement a change in how your business operates - a new process, a new tool, a new way of organising work - do you systematically measure whether the change actually improved productivity or business outcomes?',
    singleChoiceOptions(
      'Changes are made based on intuition and their impact is assessed informally without data',
      'Some changes are measured but there is no consistent approach to before-and-after performance tracking',
      'Key business metrics are tracked but the measurement is not always linked specifically to individual changes or initiatives',
      'Business changes are systematically measured with before-and-after data, and learnings from measurement consistently inform future decisions'
    )
  ),
  createQuestion(
    15,
    DIMENSION_3,
    'How aligned are the different functions in your business - sales, operations, finance, customer service, and HR - in their understanding of how AI could improve the business and their willingness to change how they work to integrate AI tools?',
    singleChoiceOptions(
      'There is significant variation in AI awareness and appetite across functions and no shared direction',
      'Some functions are more ready than others and there has been no organisation-wide conversation about AI adoption',
      'Most functions have a reasonable awareness of AI potential but a shared vision and implementation plan have not been developed',
      'All key functions share a common understanding of the AI direction, have been involved in identifying their own AI improvement opportunities, and are actively engaged in implementation'
    )
  ),
  createQuestion(
    16,
    DIMENSION_4,
    'How would you honestly characterise your own personal engagement with AI tools for business as the founder or senior leader?',
    singleChoiceOptions(
      'I am aware of AI and follow the topic in the news but do not personally use AI tools in how I run the business',
      'I use some AI tools personally but have not deliberately modelled AI adoption for my team or built it into how we work',
      'I use AI tools regularly and have shared enthusiasm for AI with my team but without a structured adoption plan',
      'I am a confident daily user of AI tools for business, I have a clear view of where AI should take my business in the next 12 months, and I actively lead AI adoption across my team'
    )
  ),
  createQuestion(
    17,
    DIMENSION_4,
    'Does your business have a documented plan for how AI will be integrated into your operations and customer offering over the next 12 months - with specific targets, a timeline, and a budget allocation?',
    singleChoiceOptions(
      'No AI plan exists at any level',
      'AI is mentioned in our general business goals but without specific targets, timeline, or budget',
      'I have a clear personal vision for AI in the business but it has not been documented or shared with the team as a plan',
      'A documented AI integration plan exists with specific targets, timeline, budget allocation, and team responsibilities - and progress is reviewed regularly'
    )
  ),
  createQuestion(
    18,
    DIMENSION_4,
    'What proportion of your annual operating budget - including time, money, and management attention - are you currently investing in building AI capability in your business?',
    singleChoiceOptions(
      'Less than 2% or no deliberate investment has been made',
      '2-5% with some investment in tools but limited investment in team capability development',
      '6-15% with investment in both tools and some staff training',
      'More than 15% with deliberate, structured investment in AI tools, staff capability development, and process redesign - and plans to increase this investment as the business scales'
    )
  ),
  createQuestion(
    19,
    DIMENSION_4,
    "How confident are you that your business's current AI adoption pace is keeping up with your most successful competitors in your sector?",
    singleChoiceOptions(
      'I believe our competitors are significantly ahead of us in AI adoption and this is affecting our competitive position',
      'I am genuinely uncertain about our competitive AI position because I do not have good visibility of what competitors are doing',
      'I believe we are broadly comparable to most competitors of similar size in our sector',
      'I have evidence that our AI adoption is ahead of the majority of comparable competitors and I actively monitor the competitive landscape to maintain this advantage'
    )
  ),
  createQuestion(
    20,
    DIMENSION_4,
    'Have you lost any strong team members - or struggled to attract strong candidates - specifically because your business was not seen as being modern, technologically progressive, or offering opportunities to develop AI and digital skills?',
    singleChoiceOptions(
      'Yes - this is a recurring problem that is limiting our ability to build the team we need',
      'I suspect it is a factor but have not specifically investigated it',
      'It has been mentioned by a candidate or departing employee but I consider it a minor factor',
      'AI capability development is a documented part of how we attract and retain talent and we communicate it actively in our employer brand'
    )
  ),
  createQuestion(
    21,
    DIMENSION_5,
    'If an AI tool you use in your business produced a systematically incorrect or biased output that affected your customers - such as unfair pricing, discriminatory service decisions, or incorrect product recommendations - how prepared is your business to detect this, respond to affected customers, and remediate the problem?',
    singleChoiceOptions(
      'We have no process for detecting or responding to AI errors that affect customers',
      'We would rely on customer complaints to identify the problem and respond case by case without a systematic approach',
      'We have some awareness of this risk and would attempt to respond but without a documented process',
      'We have a documented process for monitoring AI outputs for errors and bias, a customer remediation procedure, and staff trained on how to identify and escalate AI-related customer issues'
    )
  ),
  createQuestion(
    22,
    DIMENSION_5,
    'Are you aware of the specific cybersecurity risks associated with the AI tools your business uses - such as risks of sensitive business or customer data being included in AI training datasets, phishing attacks using AI-generated content, or AI-powered fraud targeting SMEs?',
    singleChoiceOptions(
      'I am not specifically aware of AI-related cybersecurity risks beyond general cybersecurity precautions',
      'I am aware these risks exist at a general level but have not assessed my specific exposure',
      'I have assessed our specific exposure and taken some precautions but do not have a comprehensive AI cybersecurity posture',
      'I have assessed our specific AI-related cybersecurity risks, implemented specific protections, and briefed relevant staff on the threats and how to recognise them'
    )
  ),
  createQuestion(
    23,
    DIMENSION_5,
    'If the primary AI tools your business currently relies on became unavailable tomorrow - due to pricing changes, service discontinuation, or regulatory restriction - how resilient is your business?',
    singleChoiceOptions(
      'Our operations would be significantly disrupted because we have built key processes around specific AI tools without contingency planning',
      'There would be meaningful disruption but we could revert to previous methods with some loss of productivity',
      'We have thought about this risk and have partial contingency measures but they are not fully developed',
      'We have deliberately built resilience into our AI tool usage - with documented alternatives, staff capability to operate without specific tools, and a continuity plan for key AI-dependent processes'
    )
  ),
  createQuestion(
    24,
    DIMENSION_5,
    'When AI influences how your business serves customers - such as automated responses, AI-generated content, AI-driven pricing, or AI-powered recommendations - do you have a consistent approach to whether and how this is disclosed to customers?',
    singleChoiceOptions(
      'AI involvement in customer interactions is not disclosed and no policy exists',
      'Disclosure happens inconsistently depending on individual staff judgment',
      'We have discussed this internally and have an informal approach but it is not documented or consistently applied',
      'We have a documented, consistently applied approach to customer transparency about AI involvement that reflects our values and meets any applicable regulatory requirements'
    )
  ),
  createQuestion(
    25,
    DIMENSION_5,
    'Have the members of your team who use AI tools in their work received any structured guidance or training on responsible AI use - covering topics such as verifying AI outputs before acting on them, protecting customer data when using AI tools, recognising AI-generated misinformation, and understanding the limitations of the AI tools they use?',
    singleChoiceOptions(
      'No structured guidance or training on responsible AI use has been provided to any team members',
      'Some informal guidance has been shared through conversation but nothing documented or structured',
      'Written guidance exists and has been shared but structured training with assessed understanding has not been provided',
      'All team members who use AI tools have received structured, role-appropriate guidance on responsible AI use with documented completion, and this is updated as our AI tool usage evolves'
    )
  )
];

const financialServicesQuestions: Question[] = [
  createQuestion(
    1,
    DIMENSION_1,
    'When you encounter an AI-generated credit risk assessment in your workflow, which of the following best describes your current practice?',
    singleChoiceOptions(
      'I accept the assessment without specific evaluation of how it was generated',
      'I am aware it is AI-generated but do not know how to evaluate its reliability',
      'I understand the general factors the model uses but cannot identify specific failure modes',
      'I can identify the key variables, assess confidence levels, and know when to override with human judgment'
    )
  ),
  createQuestion(
    2,
    DIMENSION_1,
    "How would you characterise your immediate team's understanding of the difference between rule-based automation and machine learning in the context of your fraud detection or compliance workflows?",
    singleChoiceOptions(
      'Most team members do not distinguish between the two',
      'A few team members understand the distinction but it is not widely shared knowledge',
      'Most team members understand the distinction conceptually but few have applied it practically',
      'Most team members can articulate the distinction and apply it when evaluating vendor proposals or system performance'
    )
  ),
  createQuestion(
    3,
    DIMENSION_1,
    "With respect to the Central Bank of Nigeria's published guidelines on AI use in financial services and Nigeria's Data Protection Act, which statement best describes your organisation's current position?",
    singleChoiceOptions(
      'We are not aware of specific CBN AI guidelines or NDPA obligations relevant to AI',
      'We are aware they exist but have not yet assessed our compliance obligations',
      'We have assessed our obligations but have not yet implemented compliance measures',
      'We have assessed our obligations and implemented documented compliance measures including staff training requirements'
    )
  ),
  createQuestion(
    4,
    DIMENSION_1,
    "Which of the following AI tools or capabilities are actively used in your department's work? Select all that apply.",
    multiSelectOptions([
      'Generative AI for document drafting or analysis (ChatGPT, Claude, Gemini)',
      'AI-assisted data analysis (Copilot in Excel, AI features in BI tools)',
      'Automated customer communication AI',
      'AI-powered compliance monitoring or transaction screening',
      'Machine learning models for credit scoring or risk assessment',
      'Large language models for regulatory document analysis'
    ]),
    true
  ),
  createQuestion(
    5,
    DIMENSION_1,
    'When did you last complete a formal learning experience (course, workshop, certification, or structured program) specifically focused on AI, machine learning, or data science applications in financial services?',
    singleChoiceOptions(
      'Never or more than 3 years ago',
      '1-3 years ago',
      '6-12 months ago',
      'Within the last 6 months'
    )
  ),
  createQuestion(
    6,
    DIMENSION_2,
    "When your team uses data to make decisions, which statement best describes your confidence in that data's reliability?",
    singleChoiceOptions(
      'We rarely question data quality and generally accept what systems provide',
      'We are aware of data quality issues but lack systematic processes to address them',
      'We have identified major data quality issues and have plans to address them',
      'We have systematic data quality monitoring, documented standards, and regular audits that we can demonstrate to regulators'
    )
  ),
  createQuestion(
    7,
    DIMENSION_2,
    'Does your organisation have a documented data governance policy that specifically addresses how AI-generated outputs should be stored, audited, and explained to regulators or customers?',
    singleChoiceOptions(
      'No documented policy exists',
      'A general data policy exists but does not specifically address AI outputs',
      'Our policy addresses AI outputs in principle but lacks operational specificity',
      'We have a documented, operationalised AI output governance policy reviewed in the last 12 months'
    )
  ),
  createQuestion(
    8,
    DIMENSION_2,
    'How would you characterise the accessibility of data across departments in your organisation for the purpose of building or evaluating AI models?',
    singleChoiceOptions(
      'Data is heavily siloed with limited cross-departmental access',
      'Some cross-departmental data sharing occurs but through manual, time-consuming processes',
      'Structured data sharing exists for specific use cases but is not systematic',
      'We have API-enabled, governed data sharing infrastructure that supports cross-departmental AI development'
    )
  ),
  createQuestion(
    9,
    DIMENSION_2,
    'When evaluating AI-powered vendor solutions (KYC providers, fraud detection systems, credit scoring platforms), does your team have a structured framework for assessing model bias, explainability, and regulatory compliance?',
    singleChoiceOptions(
      'We rely primarily on vendor assurances without independent evaluation',
      'We ask vendors questions but do not have a formal evaluation framework',
      'We have an informal checklist but it has not been formally adopted or trained to procurement teams',
      'We have a formal, documented AI vendor evaluation framework used consistently in procurement decisions'
    )
  ),
  createQuestion(
    10,
    DIMENSION_2,
    'What percentage of your team can independently perform basic data analysis using tools beyond Excel - such as SQL queries, Power BI, Tableau, or Python - to generate insights relevant to their role?',
    singleChoiceOptions(
      'Less than 10%',
      '10-25%',
      '26-50%',
      'More than 50%'
    )
  ),
  createQuestion(
    11,
    DIMENSION_3,
    'Thinking about your three most time-consuming weekly processes, how many of them have been formally evaluated for AI augmentation potential in the last 12 months?',
    singleChoiceOptions(
      'None',
      'One',
      'Two',
      'All three or more'
    )
  ),
  createQuestion(
    12,
    DIMENSION_3,
    'When new AI tools have been introduced in your organisation previously, which outcome best describes what typically happened?',
    singleChoiceOptions(
      'Tools were purchased but largely unused after initial deployment',
      'Tools were used by early adopters but never achieved broad adoption',
      'Tools achieved reasonable adoption but without structured measurement of impact',
      'Tools achieved strong adoption with documented productivity improvements and formal change management support'
    )
  ),
  createQuestion(
    13,
    DIMENSION_3,
    'In your organisation, who currently has the authority to approve the deployment of a new AI tool that will affect customer-facing decisions such as loan approvals or fraud flagging?',
    singleChoiceOptions(
      'No clear authority or process exists',
      'It requires approval but through an informal process that varies case by case',
      'A formal approval process exists but does not include AI-specific technical or ethical review',
      'A formal AI governance committee or equivalent body with documented criteria and technical AI expertise reviews all such deployments'
    )
  ),
  createQuestion(
    14,
    DIMENSION_3,
    'Does your organisation currently measure the productivity impact of AI tools that have been deployed - in terms of time saved, error reduction, or customer experience improvement?',
    singleChoiceOptions(
      'No measurement occurs',
      'Anecdotal feedback is collected but no formal measurement',
      'Some measurement occurs for specific tools but not systematically',
      'Systematic productivity measurement for all deployed AI tools with documented ROI reporting'
    )
  ),
  createQuestion(
    15,
    DIMENSION_3,
    'How often do technology, compliance, business operations, and HR teams formally collaborate on AI-related decisions in your organisation?',
    singleChoiceOptions(
      'Rarely or never',
      'Only when a specific problem forces collaboration',
      'Regular collaboration exists but is informal and undocumented',
      'Formal cross-functional AI governance processes with regular cadence and documented outputs'
    )
  ),
  createQuestion(
    16,
    DIMENSION_4,
    'How would you characterise your most senior leader\'s personal engagement with AI tools relevant to your business?',
    singleChoiceOptions(
      'They are aware of AI as a concept but do not personally use AI tools',
      'They use basic AI tools personally but do not model AI-positive behaviour organisationally',
      'They are active AI users and occasionally reference AI in communications but without strategic integration',
      'They are confident AI practitioners who set measurable AI adoption targets and model AI use visibly for the organisation'
    )
  ),
  createQuestion(
    17,
    DIMENSION_4,
    'Does your organisation have a documented AI strategy - approved at board or executive committee level - that includes specific capability development targets for your workforce?',
    singleChoiceOptions(
      'No AI strategy exists',
      'AI is mentioned in the overall digital strategy but without specific workforce development targets',
      'An AI strategy exists with workforce development components but has not been approved at board level',
      'A board-approved AI strategy exists with specific, measurable workforce capability targets and a dedicated budget'
    )
  ),
  createQuestion(
    18,
    DIMENSION_4,
    'What is your organisation\'s current annual investment in AI-related workforce development - including training, tools, certifications, and external expertise - as a percentage of total L&D budget?',
    singleChoiceOptions(
      'Less than 5% or unknown',
      '5-15%',
      '16-30%',
      'More than 30% with a plan to increase'
    )
  ),
  createQuestion(
    19,
    DIMENSION_4,
    "How confident are you that your organisation's current AI capability development pace is keeping up with your primary competitors in your sector?",
    singleChoiceOptions(
      'We believe we are significantly behind our primary competitors',
      'We are uncertain about our relative position',
      'We believe we are broadly comparable to competitors',
      'We believe we are ahead of the majority of our sector peers in AI capability'
    )
  ),
  createQuestion(
    20,
    DIMENSION_4,
    'Has your organisation experienced talent attrition specifically from high-performing employees citing insufficient AI skill development opportunities as a contributing factor?',
    singleChoiceOptions(
      'Yes, this is a documented retention problem',
      'We suspect it contributes to attrition but have not formally measured it',
      'We have heard this in exit interviews but consider it a minor factor',
      'AI skill development is a documented retention driver and we have specific programs addressing it'
    )
  ),
  createQuestion(
    21,
    DIMENSION_5,
    'If an AI model used in your credit decisioning, hiring, or customer segmentation was later found to have produced systematically biased outcomes against a protected group, how prepared is your organisation to detect, respond to, and remediate this?',
    singleChoiceOptions(
      'We have no current detection or response framework',
      'We would rely on regulatory guidance after the fact',
      'We have some internal processes but they have not been formally tested',
      'We have documented detection protocols, a tested response framework, and regular bias audits'
    )
  ),
  createQuestion(
    22,
    DIMENSION_5,
    'Does your organisation have a documented AI incident response plan - equivalent to your cybersecurity incident response plan - for scenarios where an AI system produces harmful outputs or fails in a way that affects customers or regulatory compliance?',
    singleChoiceOptions(
      'No',
      'We are developing one but it is not complete',
      'A plan exists but has not been tested or formally adopted',
      'Yes, tested, formally adopted, and reviewed within the last 12 months'
    )
  ),
  createQuestion(
    23,
    DIMENSION_5,
    'How does your organisation currently assess and monitor the AI practices of third-party vendors whose AI outputs you rely on - such as credit bureaus, fraud detection providers, or KYC platforms?',
    singleChoiceOptions(
      'We do not formally assess vendor AI practices',
      'We review vendor privacy policies but not AI-specific practices',
      'We ask vendors about their AI practices in procurement but without a formal evaluation framework',
      'We have formal vendor AI risk assessment criteria embedded in our procurement and ongoing vendor management processes'
    )
  ),
  createQuestion(
    24,
    DIMENSION_5,
    'When AI significantly influences a decision that affects your customers - such as loan rejection, fraud flagging, or pricing - does your organisation have a documented policy for how this is communicated to the customer?',
    singleChoiceOptions(
      'No policy exists',
      'We communicate AI involvement informally and inconsistently',
      'A policy exists but is not consistently implemented',
      'A documented, consistently implemented policy exists for AI-influenced customer communications'
    )
  ),
  createQuestion(
    25,
    DIMENSION_5,
    'Have employees in roles that use or are affected by AI systems received specific training on AI ethics, bias, and responsible AI use within the last 12 months?',
    singleChoiceOptions(
      'No formal AI ethics training has been provided',
      'Senior leadership has received some training but not operational staff',
      'Training has been provided to technology teams but not business operations',
      'Structured AI ethics training has been provided to all relevant staff with documented completion records'
    )
  )
];

export const ASSESSMENT_QUESTION_BANKS: Record<FirmType, Question[]> = {
  'financial-services': financialServicesQuestions,
  healthcare: healthcareQuestions,
  'consulting-firms': consultingQuestions,
  smes: smeQuestions
};

export const TOTAL_QUESTIONS = financialServicesQuestions.length;

export function getQuestionsForFirmType(firmType: FirmType | ''): Question[] {
  return ASSESSMENT_QUESTION_BANKS[firmType || DEFAULT_FIRM_TYPE];
}

export function getFirmTypeLabel(firmType: FirmType | ''): string {
  return FIRM_TYPE_OPTIONS.find((option) => option.value === firmType)?.label || 'Select firm type';
}
