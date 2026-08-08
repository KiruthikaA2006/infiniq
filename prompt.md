# InfiniQ — AI Interviewer Platform

This document contains the prompts used during the development of InfiniQ, an adaptive AI interviewer platform created for the ABTalks AI Cohort challenge.

The project was developed step by step, starting from the problem understanding and product direction, followed by UI/UX, interviewer intelligence, curriculum integration, candidate personalization, API implementation, testing, and responsive web design.

The core idea behind InfiniQ is:

> Build the interviewer, not the interview.

---

## Understanding the Problem

I want to build the ABTalks AI Interview Agent challenge.

Before writing any code, study the complete problem statement carefully.

The goal is not to create a list of technical questions.

The goal is to build an AI interviewer that can understand a candidate's learning journey, conduct a realistic technical conversation, ask intelligent follow-ups, adapt difficulty, maintain context, evaluate reasoning, and provide actionable feedback.

First understand the complete problem and propose a realistic architecture for the interviewer.

Do not start coding until the product behavior and architecture are clear.

---

## Defining InfiniQ

I want to turn the AI Interview Agent into a real product.

The product name is:

**InfiniQ**

InfiniQ is an AI interviewer platform designed to conduct personalized technical interviews.

It should feel intelligent, calm, professional, technically rigorous, and context-aware.

The candidate should feel like they are speaking with an experienced technical interviewer.

Avoid making the product feel like a chatbot, quiz application, course platform, or generic AI assistant.

The interview itself should remain the primary experience.

---

## Designing the Interview Experience

Design the emotional and interaction model for InfiniQ.

The interview should move naturally through curiosity, focus, challenge, confidence, reflection, and assessment.

The interviewer should begin with a question appropriate for the candidate.

During the interview, the candidate should feel:

> "This interviewer actually understands what I know."

The AI should communicate its state through subtle interface signals such as listening, analyzing, synthesizing, following up, increasing difficulty, and moving to another technical area.

The experience should feel like a real technical interview rather than a scripted chatbot conversation.

---

## Creating the Visual Identity

Create a premium visual system for InfiniQ.

Use a modern AI research and developer-tool aesthetic with Apple-like precision and Linear-style simplicity.

Use a dark premium interface with matte black backgrounds, charcoal surfaces, soft indigo/violet accents, high-contrast typography, and subtle motion.

Use Inter for the primary interface typography and JetBrains Mono for technical labels, metrics, system states, and interview telemetry.

Avoid cyberpunk visuals, excessive neon, glowing grids, heavy chat bubbles, cartoon avatars, and unnecessary decoration.

The interface should feel sophisticated, calm, intelligent, and professional.

---

## Building The Core

Create a signature visual element for the InfiniQ interviewer called:

**The Core**

The Core represents the active intelligence of the interviewer.

It should react naturally to states such as idle, listening, thinking, understanding, and complete.

Idle should feel calm.

Listening should feel attentive.

Thinking should feel active.

Understanding should feel focused.

Complete should return naturally to a calm state.

The Core should communicate intelligence without becoming a decorative glowing orb.

---

## Building the Design System

Create the foundational design system for InfiniQ.

Set up reusable styles and components for:

Buttons

Typography

Badges

Progress indicators

Interview states

Status indicators

Loading states

Error states

Empty states

Containers

The Core

The system should work consistently across desktop, tablet, and mobile.

---

## Building the Landing Experience

Build a professional landing page for InfiniQ.

The first screen should immediately explain what InfiniQ does.

The core message should communicate:

> An adaptive AI interviewer that understands your technical journey.

Explain that InfiniQ studies the candidate profile, creates a personalized interview, asks technical questions, follows up based on responses, adapts difficulty, evaluates reasoning, and produces a final technical assessment.

The main call to action should be:

**Start Interview**

Do not make the landing page look like an education platform.

InfiniQ is an interviewer.

---

## Candidate Selection

Create a candidate selection experience using the supplied candidate profiles.

Display useful candidate information such as name, role, experience, education, mission progress, completed topics, and learning signals.

Make it clear that InfiniQ uses the candidate's history to personalize the interview.

The experience should communicate:

> "The interviewer has prepared for me."

---

## Interview Briefing

Before the interview begins, show a concise candidate briefing.

Include the candidate's identity, role, experience, education, relevant completed topics, demonstrated strengths, areas worth probing, and suggested interview difficulty.

Keep the information focused.

Do not expose unnecessary internal AI reasoning.

The purpose of this screen is to establish that InfiniQ has prepared specifically for the candidate.

---

## Interview Chamber

Create the main InfiniQ interview workspace.

Do not build a traditional chat interface.

The current interviewer question should be the strongest visual element.

Include the interview question, question progress, candidate response area, submit action, interviewer state, and adaptive signals.

Use subtle states such as:

LISTENING

ANALYZING

SYNTHESIZING

FOLLOW-UP

DEEPER CHALLENGE

The candidate should always understand what the interviewer is asking and what is expected from them.

---

## Real Interview Interaction

Make the interviewer experience interactive.

When a candidate submits an answer, InfiniQ should receive the response, analyze it, evaluate the technical reasoning, decide whether a follow-up is necessary, adapt the difficulty, and generate the next question.

Support keyboard submission with Ctrl + Enter on desktop and Cmd + Enter where appropriate.

Prevent empty responses.

If an answer is too short, the interviewer should naturally request more depth instead of immediately moving forward.

---

## Adaptive Interview Engine

Implement the actual InfiniQ interviewer engine.

Separate the system into candidate data, curriculum data, AI provider, interview planner, evaluator, follow-up engine, adaptation engine, interview memory, and orchestrator.

The core loop should be:

Candidate Profile  
→ Interview Plan  
→ Question  
→ Candidate Answer  
→ Evaluation  
→ Memory Update  
→ Interviewer Decision  
→ Next Question

This should behave like a dynamic interview rather than a fixed questionnaire.

---

## Candidate-Aware Planning

InfiniQ must not conduct the same interview for every candidate.

The interviewer should consider years of experience, job role, education, completed missions, failed missions, skipped missions, attempts, first-try performance, and learning signals.

Use these signals to determine the starting difficulty, technical areas to investigate, areas requiring foundation repair, and areas where deeper questioning is appropriate.

Strong candidates should receive more architecture and trade-off questions.

Candidates with knowledge gaps should receive focused foundational questions before being pushed into advanced topics.

---

## Technical Reasoning Evaluation

InfiniQ should evaluate technical thinking rather than simply checking keywords.

Evaluate accuracy, technical depth, reasoning, communication, trade-off awareness, architectural thinking, strengths, weaknesses, misconceptions, and missing concepts.

The interviewer should care about:

> Why did the candidate make that decision?

not simply:

> Did the candidate mention the expected keyword?

---

## Intelligent Follow-Ups

Create a contextual follow-up system.

Follow-up questions must be derived from the candidate's actual response.

Avoid generic questions such as:

> Can you explain more?

Instead, investigate the candidate's technical choices, assumptions, constraints, trade-offs, failure scenarios, scalability, and reliability.

The follow-up should make the candidate feel that the interviewer actually listened to their previous answer.

---

## Adaptive Difficulty

InfiniQ should continuously adjust interview difficulty.

Strong technical answer:

→ Increase difficulty.

Weak answer:

→ Return toward fundamentals.

Very short answer:

→ Request more depth.

Strong reasoning:

→ Move toward architecture and trade-offs.

Misconception:

→ Ask a focused corrective question.

Use explicit interviewer decisions such as:

FOLLOW_UP

NEW_TOPIC

DEEPER_CHALLENGE

FOUNDATION_REPAIR

Keep the decisions explainable internally.

---

## Interview Memory

InfiniQ must remember important parts of the conversation.

Maintain structured memory containing topics covered, candidate claims, demonstrated strengths, knowledge gaps, misconceptions, missing concepts, difficulty trajectory, and important technical decisions.

The interviewer should be able to reference something the candidate said earlier.

This is essential for making the experience feel like a real interview.

---

## AI Provider

Create a provider-independent AI layer.

If an API key is available, use the configured LLM provider.

If no API key is available, use a deterministic mock interviewer.

The mock interviewer should still demonstrate technical reasoning, answer analysis, follow-up generation, difficulty adaptation, context awareness, and question variation.

The complete interview must remain demoable without requiring a live API key.

---

## Structured AI Validation

Validate all structured AI output before using it.

Use Zod schemas.

If the model returns malformed output:

Try a correction request.

Validate the response again.

If the second attempt also fails, use a deterministic fallback evaluator.

The interviewer must never crash because an AI response was malformed.

---

## Interview Orchestrator

Create the central InfiniQ interviewer orchestrator.

It should coordinate candidate loading, curriculum loading, interview planning, question generation, candidate responses, evaluation, memory updates, follow-up decisions, difficulty adaptation, interview completion, and final assessment generation.

Maintain interview state using sessionId.

Support recovery when a temporary network or API failure occurs.

---

## Curriculum Integration

Use the official 31-day AI Cohort curriculum supplied with the challenge.

Do not replace it with simplified mock curriculum data.

InfiniQ should understand the modules, daily topics, learning objectives, tools, and mission types.

Use the curriculum as the knowledge map for selecting interview topics.

---

## Candidate Profile Integration

Use the supplied candidate profile JSON directly.

Load all provided candidates.

Use their identity, role, experience, education, mission history, passed missions, failed missions, skipped missions, attempts, and learning signals.

Do not hard-code a single candidate.

Different candidates should receive different interview strategies.

---

## Interview Flow

Build a realistic multi-turn interview.

The interviewer must cover at least four different curriculum areas.

Questions should adapt based on candidate responses.

The interview should contain follow-up opportunities, difficulty changes, topic transitions, and foundation repair where necessary.

Avoid unnecessary repetition.

The interview should feel like one continuous technical conversation.

---

## Official API

Implement the official challenge endpoint exactly as specified:

POST /api/interview

The endpoint must maintain state using sessionId.

The first request initializes the interview.

Subsequent requests contain the candidate's latest response.

When the interview is complete, return the required structured feedback containing:

summary

strengths

gaps

next

Do not replace or rename the official endpoint.

---

## Session Recovery

InfiniQ must preserve the interview when a connection temporarily fails.

Keep the sessionId, current question, interview memory, candidate context, and current interview state.

Allow the candidate to retry without restarting the interview.

---

## Final Interview Assessment

After the interview, generate a professional technical assessment.

Include the overall assessment, technical depth, accuracy, reasoning, communication, strengths, knowledge gaps, misconceptions, recommended next steps, curriculum areas evaluated, and relevant interviewer decisions.

The final result should feel like a serious technical interview report.

---

## Responsive Web Platform

The initial interface feels too much like a mobile application.

Transform InfiniQ into a professional responsive web-based AI interviewer platform.

Do not simply stretch the mobile interface onto desktop.

The desktop version should feel like a serious AI SaaS product.

Desktop should use the available screen width intelligently with a professional header, candidate selection layout, large interview workspace, contextual information, and assessment reporting.

Tablet layouts should adapt naturally.

Mobile should use a single-column layout with touch-friendly controls.

All devices must use the same responsive web application.

---

## Desktop Interview Workspace

Design the main interview workspace for large screens.

The primary area should contain the current question, response area, interview progress, and submission controls.

A secondary area can contain candidate context, difficulty, topics being evaluated, and interviewer signals.

The question must remain the strongest visual element.

The layout should feel like a professional technical interview environment rather than a dashboard.

---

## Responsive Candidate Selection

Create a responsive candidate selection experience.

On desktop, use a structured grid or professional candidate list.

On smaller screens, use compact stacked cards.

Keep candidate identity, role, experience, education, mission completion, and relevant learning signals visible without overwhelming the interface.

The experience should remain a professional web platform at every breakpoint.

---

## Responsive Final Assessment

Create a responsive final interview report.

On desktop, organize the assessment into clear sections.

On tablet and mobile, stack the sections naturally.

Clearly communicate:

Overall assessment

Technical depth

Reasoning

Accuracy

Communication

Strengths

Gaps

Recommended next steps

Topics evaluated

The final screen should feel like the outcome of a serious technical interview.

---

## Final Quality Review

Perform a complete quality review of InfiniQ.

Verify the AI interviewer behavior, candidate personalization, curriculum integration, adaptive questioning, contextual follow-ups, technical reasoning evaluation, interview memory, interview completion, final assessment, session recovery, official API compliance, responsive layouts, accessibility, loading states, error states, retry behavior, and empty states.

Do not add unnecessary features.

Prioritize interview quality, reliability, usability, and visual polish.

Run the complete test suite and production build.

Fix any genuine issues before considering the platform complete.

---

## Final Product Definition

InfiniQ is an adaptive AI interviewer platform.

It is not a chatbot.

It is not a quiz.

It is not an online course.

It is not a learning dashboard.

InfiniQ acts as an intelligent technical interviewer that studies the candidate's background, understands their learning history, builds a personalized interview, asks technical questions, listens to reasoning, identifies strengths and weaknesses, asks contextual follow-ups, adjusts difficulty, maintains context, and produces a structured technical assessment.

The central product principle is:

> **Build the interviewer, not the interview.**

the same questiion in asking for all the candidates based on their curriculam diffrent questions should be asked for different candiates the question should not repeat for any of the candidates it should be like an interviewer asking the follow up questions based on their previous answer provided by the candidates.check the candidates curriculam before asking questions

just give me the zayn malik curriculam to check the implementation

i have noticed that from 8 question same question is repeated twice for the same candidate . the thing is the quesstion has not to repeat for the same candidate and the question asked for one candidate should not asked for another candidate although their curriculam is same.
reduce the use of to wrap up, to conclue while the asking question it looks like unprofessional ask the question in formal manner

change the name synapse to "InfiniQ" everywhere there is synapse

it is not a interview we are designing a interviewer to ask question based on their curriculam so the main concept here is the AI interviewer