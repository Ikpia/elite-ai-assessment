# 🧠 Elite Global AI — AI Readiness Assessment Platform
### Product Requirements Document (PRD)

---

> **Last Updated:** March 2026
> **Owner:** Elite Global AI — Product Team
> **Website:** [eliteglobalai.com](https://eliteglobalai.com)

---

## 📌 Table of Contents

1. [Overview & Problem Statement](#overview)
2. [User Personas](#personas)
3. [User Stories & Use Cases](#user-stories)
4. [Product Flow & User Journey](#flow)
5. [Assessment Structure & Scoring](#assessment)
6. [Technical Requirements](#technical)
7. [API & Integration Details](#api)
8. [Compliance & Data Privacy](#compliance)

---

## 1. Overview & Problem Statement

### What We're Building

The **Elite Global AI Readiness Assessment** is a B2B web application that enables organisations — primarily in financial services, healthcare, and consulting — to benchmark their teams' AI readiness across key dimensions. The platform collects structured survey responses from 5–20 employees per organisation, aggregates the data, and delivers an executive-grade report to the organisation's top-level director.

The report is tied to Elite Global AI's training and consultancy offerings, turning diagnostic insights into commercial pipeline.

---

### Why It Matters: The Business Case

> *"We ran the Elite Global AI Readiness Assessment with teams from 12 Nigerian financial institutions last quarter. The average AI literacy score across 247 participants: 31 out of 100. Comparable UK teams scored 68. That 37-point gap is not a skills gap — it is a competitive gap."*

Teams with AI literacy scores below 40 take an average of **4.2 hours** to complete analysis tasks that AI-proficient teams complete in **47 minutes**.

At scale across a 500-person operations team, that difference is approximately:

| Metric | Value |
|---|---|
| Hours lost per year | ~18,000 hrs |
| Estimated staff cost (Nigeria) | ~₦540,000,000 |
| Competitive disadvantage window | 3–5 years to recover |

The organisations that close this gap in 2026 will have a structural operational advantage. This platform is the entry point that surfaces that gap — and positions Elite Global AI as the solution.

---

## 2. User Personas

### Persona 1 — The Director (Report Recipient)
- **Role:** C-suite, Managing Director, Head of L&D, or COO
- **Org types:** Nigerian banks, fintechs, healthcare systems, consulting firms
- **Pain point:** No objective data on their team's AI capability; worried about falling behind peers
- **What they want:** A credible, visual, benchmark-referenced report they can act on immediately
- **Trigger to buy:** Seeing their score relative to industry benchmarks

---

### Persona 2 — The Respondent (Assessment Participant)
- **Role:** Individual Contributors, Managers, and C-suite staff
- **Volume:** 5–20 per organisation
- **Pain point:** Doesn't want another long survey; wants something that feels relevant to their actual work
- **What they want:** Quick, professional, non-judgmental experience
- **Behaviour:** Will drop off if navigation is confusing or questions feel generic

---

### Persona 3 — The Admin (Elite Global AI Internal Team)
- **Role:** Operations or account manager at Elite Global AI
- **What they do:** Monitors submissions, approves report generation, sends final report to director
- **What they want:** Simple dashboard, clear status indicators, one-click report approval

---

## 3. User Stories & Use Cases

### Respondent Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Respondent | Enter my company email at the start of the form | My responses are linked to my organisation without needing a login |
| US-02 | Respondent | See a progress indicator as I answer questions | I know how much of the assessment is left |
| US-03 | Respondent | Answer questions using clear, selectable options | I don't need to type freeform answers |
| US-04 | Respondent | Complete the assessment in under 10 minutes | It doesn't disrupt my working day |
| US-05 | Respondent | Know my individual responses are anonymous | I can answer honestly without fear of judgment |

### Director Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-06 | Director | Receive a branded email report once all responses are in | I get actionable insights without logging into another tool |
| US-07 | Director | See our organisation's score broken down by dimension | I can prioritise which capability gaps to address first |
| US-08 | Director | See how our score compares to industry benchmarks | I can contextualise what our results actually mean |
| US-09 | Director | Get a clear recommended next step in the report | I know exactly what to do with the findings |

### Admin Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-10 | Admin | See real-time submission count per organisation | I know when an assessment is ready to be finalised |
| US-11 | Admin | Approve report generation with a single action | I can control quality before delivery |
| US-12 | Admin | View aggregated scores per dimension before approval | I can spot anomalies before the report goes out |

---

## 4. Product Flow & User Journey

```
[Director shares assessment link with team]
         │
         ▼
[Step 1: Entry Screen]
Enter company email → domain validated (no Gmail/Yahoo/Hotmail)
Name + role level (C-suite / Manager / IC) + department
         │
         ▼
[Step 2: Assessment]
25 questions across 5 dimensions — Tally.so-style, one question per screen
Animated transitions | Progress bar | ~8 min average | Mobile-responsive
         │
         ▼
[Step 3: Submission Confirmation]
"Your response has been recorded. Results will be shared with your director."
         │
         ▼
[Admin Dashboard: Aggregation in Progress]
Real-time count of responses per org | Dimension score preview
         │
         ▼
[Admin Approves Report]
One-click trigger → report generated → email dispatched
         │
         ▼
[Director Receives Branded Email Report]
Score summary | Dimension breakdown | Benchmark comparison | CTA → Schedule Training Call
```

---

## 5. Assessment Structure & Scoring

### Dimensions Overview

| Dimension | # of Questions | Max Score |
|---|---|---|
| AI Awareness & Literacy | 5 | 20 |
| Data Infrastructure & Readiness | 5 | 20 |
| AI Strategy & Leadership | 5 | 20 |
| Workflow Integration & Adoption | 5 | 20 |
| Ethics, Risk & Compliance | 5 | 20 |
| **Total** | **25** | **100** |

### Readiness Thresholds

| Score Range | Readiness Level | Description |
|---|---|---|
| 0–30 | 🔴 Low | Significant foundational gaps across most dimensions |
| 31–54 | 🟠 Developing | Awareness exists but capability is inconsistent and untrained |
| 55–74 | 🟡 Moderate | Functional AI readiness with clear upskilling opportunities |
| 75–89 | 🟢 Advanced | Strong capability; focus on strategic integration and governance |
| 90–100 | 🔵 Leading | Benchmark-level readiness; focus on competitive differentiation |

---

### Dimension 1: AI Awareness & Literacy (20 pts)

**Q1 — Individual Understanding**
*"When you encounter an AI-generated credit risk assessment in your workflow, which of the following best describes your current practice?"*

| Option | Score |
|---|---|
| A — I accept the assessment without specific evaluation of how it was generated | 0 |
| B — I am aware it is AI-generated but do not know how to evaluate its reliability | 1 |
| C — I understand the general factors the model uses but cannot identify specific failure modes | 2 |
| D — I can identify the key variables, assess confidence levels, and know when to override with human judgment | 4 |

---

**Q2 — Team Understanding**
*"How would you characterise your immediate team's understanding of the difference between rule-based automation and machine learning in the context of your fraud detection or compliance workflows?"*

| Option | Score |
|---|---|
| A — Most team members do not distinguish between the two | 0 |
| B — A few team members understand the distinction but it is not widely shared knowledge | 1 |
| C — Most team members understand the distinction conceptually but few have applied it practically | 2 |
| D — Most team members can articulate the distinction and apply it when evaluating vendor proposals or system performance | 4 |

---

**Q3 — Regulatory AI Knowledge**
*"With respect to the CBN's published guidelines on AI use in financial services and Nigeria's Data Protection Act, which statement best describes your organisation's current position?"*

| Option | Score |
|---|---|
| A — We are not aware of specific CBN AI guidelines or NDPA obligations relevant to AI | 0 |
| B — We are aware they exist but have not yet assessed our compliance obligations | 1 |
| C — We have assessed our obligations but have not yet implemented compliance measures | 2 |
| D — We have assessed our obligations and implemented documented compliance measures including staff training requirements | 4 |

---

**Q4 — AI Tool Literacy** *(Multi-select)*
*"Which of the following AI tools or capabilities are actively used in your department's work?"*

- Generative AI for document drafting or analysis (ChatGPT, Claude, Gemini)
- AI-assisted data analysis (Copilot in Excel, AI features in BI tools)
- Automated customer communication AI
- AI-powered compliance monitoring or transaction screening
- ML models for credit scoring or risk assessment
- LLMs for regulatory document analysis
- None of the above

*Scoring: 0 (none) | 1 (1–2 tools) | 2 (3–4 tools) | 4 (5+ tools)*

---

**Q5 — Learning Currency**
*"When did you last complete a formal learning experience specifically focused on AI, machine learning, or data science applications in financial services?"*

| Option | Score |
|---|---|
| A — Never or more than 3 years ago | 0 |
| B — 1–3 years ago | 1 |
| C — 6–12 months ago | 2 |
| D — Within the last 6 months | 4 |

---

### Dimension 2: Data Infrastructure & Readiness (20 pts)

**Q6 — Data Quality Awareness**
*"When your team uses data to make decisions, which statement best describes your confidence in that data's reliability?"*

| Option | Score |
|---|---|
| A — We rarely question data quality and generally accept what systems provide | 0 |
| B — We are aware of data quality issues but lack systematic processes to address them | 1 |
| C — We have identified major data quality issues and have plans to address them | 2 |
| D — We have systematic data quality monitoring, documented standards, and regular audits | 4 |

---

**Q7 — Data Governance**
*"Does your organisation have a documented data governance policy that specifically addresses how AI-generated outputs should be stored, audited, and explained to regulators or customers?"*

| Option | Score |
|---|---|
| A — No documented policy exists | 0 |
| B — A general data policy exists but does not specifically address AI outputs | 1 |
| C — Our policy addresses AI outputs in principle but lacks operational specificity | 2 |
| D — We have a documented, operationalised AI output governance policy reviewed in the last 12 months | 4 |

---

**Q8 — Data Access & Silos**
*"How would you characterise the accessibility of data across departments in your organisation for the purpose of building or evaluating AI models?"*

| Option | Score |
|---|---|
| A — Data is heavily siloed with limited cross-departmental access | 0 |
| B — Some cross-departmental data sharing occurs but through manual, time-consuming processes | 1 |
| C — Structured data sharing exists for specific use cases but is not systematic | 2 |
| D — We have API-enabled, governed data sharing infrastructure that supports cross-departmental AI development | 4 |

---

**Q9 — Vendor AI Evaluation**
*"When evaluating AI-powered vendor solutions, does your team have a structured framework for assessing model bias, explainability, and regulatory compliance?"*

| Option | Score |
|---|---|
| A — We rely primarily on vendor assurances without independent evaluation | 0 |
| B — We ask vendors questions but do not have a formal evaluation framework | 1 |
| C — We have an informal checklist but it has not been formally adopted | 2 |
| D — We have a formal, documented AI vendor evaluation framework used consistently in procurement decisions | 4 |

---

**Q10 — Data Skills Baseline**
*"What percentage of your team can independently perform basic data analysis using tools beyond Excel — such as SQL, Power BI, Tableau, or Python?"*

| Option | Score |
|---|---|
| A — Less than 10% | 0 |
| B — 10–25% | 1 |
| C — 26–50% | 2 |
| D — More than 50% | 4 |

---

### Dimension 3: AI Strategy & Leadership (20 pts) — *[Mock]*

**Q11** — *"Does your organisation have a named executive or committee accountable for AI strategy and implementation?"*
A: No accountability structure (0) | B: Informal ownership (1) | C: Named owner, no mandate (2) | D: Executive sponsor with budget and mandate (4)

**Q12** — *"Has your organisation defined specific AI use cases it plans to implement in the next 12 months?"*
A: No defined use cases (0) | B: Use cases discussed but not documented (1) | C: Documented but not funded (2) | D: Documented, funded, and assigned to owners (4)

**Q13** — *"How does AI investment appear in your organisation's annual budget?"*
A: Not a budget line item (0) | B: Bundled under IT/tech (1) | C: Separate line item, limited scope (2) | D: Dedicated AI investment budget with ROI tracking (4)

**Q14** — *"How frequently does your leadership team review AI strategy and progress?"*
A: Never or ad hoc (0) | B: Annually (1) | C: Quarterly (2) | D: Monthly with structured KPIs (4)

**Q15** — *"Has your organisation conducted a formal AI readiness or maturity assessment in the past 2 years?"*
A: Never (0) | B: Informal internal review only (1) | C: External review but not acted upon (2) | D: External review with documented action plan (4)

---

### Dimension 4: Workflow Integration & Adoption (20 pts) — *[Mock]*

**Q16** — *"How many of your team's core workflows have an AI or automation component today?"*
A: None (0) | B: 1–2 workflows (1) | C: 3–5 workflows (2) | D: More than 5, systematically documented (4)

**Q17** — *"When a new AI tool is introduced in your department, how is adoption typically managed?"*
A: No structured adoption process (0) | B: Email announcement only (1) | C: Training session but no follow-up (2) | D: Structured change management with champions, training, and adoption metrics (4)

**Q18** — *"How would you rate your team's resistance to adopting AI-assisted workflows?"*
A: High resistance, cultural barrier (0) | B: Some resistance, no active resolution (1) | C: Moderate openness, limited champions (2) | D: Active enthusiasm with visible internal advocates (4)

**Q19** — *"Does your organisation track productivity metrics that would reveal the impact of AI tool adoption?"*
A: No productivity metrics tracked (0) | B: General productivity tracked, not AI-specific (1) | C: Some AI-specific metrics tracked informally (2) | D: Formal AI productivity dashboard reviewed by leadership (4)

**Q20** — *"Do employees in your team have dedicated time or resources for AI experimentation and learning?"*
A: No structured time or resources (0) | B: Informal, ad hoc only (1) | C: Occasional learning sprints (2) | D: Structured innovation time with management support (4)

---

### Dimension 5: Ethics, Risk & Compliance (20 pts) — *[Mock]*

**Q21** — *"Does your organisation have a published Responsible AI policy or framework?"*
A: No (0) | B: In development (1) | C: Exists but not operationalised (2) | D: Operationalised with staff training (4)

**Q22** — *"How does your organisation address the risk of bias in AI-generated outputs that affect customer decisions?"*
A: Not currently addressed (0) | B: Awareness exists but no process (1) | C: Audit process exists for some systems (2) | D: Systematic bias auditing for all customer-facing AI (4)

**Q23** — *"When an AI system makes a decision that affects a customer or employee, is there a documented human review escalation path?"*
A: No escalation path exists (0) | B: Informal escalation only (1) | C: Documented but not consistently followed (2) | D: Documented, trained, and audited regularly (4)

**Q24** — *"How prepared is your organisation to explain an AI-driven decision to a regulator or customer on short notice?"*
A: Not prepared at all (0) | B: Could provide general explanation only (1) | C: Could explain methodology but not specific decision logic (2) | D: Can provide full audit trail and explainability documentation on demand (4)

**Q25** — *"Does your organisation conduct AI-specific risk assessments before deploying new AI tools or models?"*
A: No risk assessment conducted (0) | B: General IT risk assessment only (1) | C: AI risk considered but no formal framework (2) | D: Formal AI risk assessment framework applied pre-deployment (4)

---

## 6. Technical Requirements

### Stack

| Layer | Decision | Detail |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR for report pages; SSG for landing page; API routes replace a separate backend entirely |
| Styling | **Tailwind CSS** | Utility-first; no component library mandated — developer's discretion |
| Database | **MongoDB** | Hosted on MongoDB Atlas (free tier sufficient for v1); Mongoose optional but not mandated |
| Authentication | **None** | Email collected as a plain form field; free provider domains blocked at input (see validation below) |
| Score engine | Server-side only | Scoring logic lives exclusively in Next.js API routes — never sent to client |
| PDF generation | **@react-pdf/renderer** | JSX-based, easy to brand; runs in API route on report generation |
| Email delivery | **Resend** | Simplest Next.js integration; sends from @eliteglobalai.com via DNS verification |
| Hosting | **Vercel** | Zero-config Next.js deployment; CI/CD from GitHub |

---

### Frontend Spec

| Requirement | Detail |
|---|---|
| Assessment UI | Tally.so-style — one question per screen, animated slide transitions, persistent progress bar |
| Responsive | Mobile-first; fully functional on tablet and desktop |
| Branding | Matches eliteglobalai.com — colours, fonts, logo, tone |
| Accessibility | WCAG 2.1 AA minimum |
| Performance | < 2s first contentful paint on 4G |

---

### MongoDB Data Models

**`submissions` collection**
```json
{
  "_id": "ObjectId",
  "orgDomain": "string",          // extracted from email, e.g. "gtbank.com"
  "orgName": "string",            // entered by respondent
  "respondentEmail": "string",
  "respondentName": "string",
  "respondentRole": "string",     // "c-suite" | "manager" | "ic"
  "respondentDept": "string",
  "answers": [
    { "questionId": "number", "score": "number" }
  ],
  "dimensionScores": {
    "aiLiteracy": "number",
    "dataReadiness": "number",
    "aiStrategy": "number",
    "workflowAdoption": "number",
    "ethicsCompliance": "number"
  },
  "totalScore": "number",
  "submittedAt": "ISODate"
}
```

**`organisations` collection**
```json
{
  "_id": "ObjectId",
  "domain": "string",             // unique identifier per org
  "orgName": "string",
  "directorEmail": "string",      // set by admin; report recipient
  "expectedRespondents": "number",
  "status": "string",             // "collecting" | "ready" | "approved" | "sent"
  "aggregatedScores": {
    "aiLiteracy": "number",
    "dataReadiness": "number",
    "aiStrategy": "number",
    "workflowAdoption": "number",
    "ethicsCompliance": "number",
    "total": "number"
  },
  "reportSentAt": "ISODate | null",
  "createdAt": "ISODate"
}
```

---

### Email Domain Validation

Block the following domains (non-exhaustive — developer to use a maintained blocklist package such as `disposable-email-domains`):

`gmail.com` · `yahoo.com` · `hotmail.com` · `outlook.com` · `icloud.com` · `protonmail.com` · `live.com` · `me.com`

Validation fires client-side on blur and server-side in `/api/assessment/validate-email` before any data is written.

---

### Admin Dashboard

| Feature | Detail |
|---|---|
| Org list | All orgs, response count vs. expected, current status badge |
| Score preview | Dimension-level aggregated scores visible before approval |
| Director email field | Admin sets/confirms director email per org before triggering report |
| Approval trigger | Single button → generates PDF → dispatches email → updates org status to `sent` |
| Protected route | Admin routes protected via a hardcoded admin token in environment variables (`.env`) — no full auth system needed for v1 |

---

## 7. API & Integration Details

### Next.js API Routes

| Route | Method | Description |
|---|---|---|
| `/api/assessment/validate-email` | POST | Validate company email domain — block free providers |
| `/api/assessment/submit` | POST | Write submission to MongoDB; recalculate org aggregate scores |
| `/api/assessment/status/[orgId]` | GET | Return submission count and dimension scores for an org |
| `/api/report/generate/[orgId]` | POST | Generate branded PDF report (admin only) |
| `/api/report/send/[orgId]` | POST | Dispatch report email to director via Resend (admin only) |

### Third-Party Services

| Service | Purpose | Notes |
|---|---|---|
| **MongoDB Atlas** | Primary database | Free M0 cluster sufficient for v1 |
| **Resend** | Transactional email — OTP + report delivery | Send from @eliteglobalai.com; verify DNS in Resend dashboard |
| **@react-pdf/renderer** | Branded PDF report generation | Runs server-side in Next.js API route |
| **Vercel** | Hosting and CI/CD | Connect GitHub repo; set env vars in Vercel dashboard |

---

## 8. Compliance & Data Privacy

| Requirement | Implementation |
|---|---|
| GDPR compliance | Data minimisation; no unnecessary storage; right to erasure |
| Anonymised responses | Individual responses stored without name linkage in reports; only org-level aggregates surfaced to director |
| Data retention | Raw submissions deleted from MongoDB 90 days post-report dispatch |
| NDPA alignment | Compliant with Nigeria Data Protection Act obligations for B2B data processors |
| Email domain | All outbound mail from @eliteglobalai.com via Resend DNS verification |
| Consent | Explicit opt-in checkbox at entry screen with link to privacy policy |
| Admin access | Protected via hardcoded `ADMIN_SECRET` env variable; no public-facing admin registration |

---

*Document maintained by Elite Global AI Product Team. March 2026.*
