# AI Prompt Library

A categorized collection of reusable prompts for writing, business, coding,
productivity, image generation, daily life, and learning.

## Writing

### 1. Blog Post from Outline

Write a 1,200-word blog post about {{topic}} for {{audience}}.

Structure:
- Hook intro (2 sentences)
- 5 subheadings with 2-3 paragraphs each
- Conclusion with CTA

Tone: conversational, authoritative. Use specific examples.

### 2. Rewrite for Clarity

Rewrite this text to be clearer and more concise.

Requirements:
- Cut unnecessary words
- Fix passive voice
- Improve flow
- Keep the same meaning and tone

Text:
{{paste_text}}

Return only the rewritten version.

### 3. 5 Opening Hooks

Write 5 opening hooks for a blog post about {{topic}}.

Requirements:
1. Surprising statistic
2. Contrarian statement
3. Story or anecdote
4. Direct question
5. Bold claim

Each hook should be 1-2 sentences.

### 4. Content Repurposer

Take this content and create:
1. LinkedIn post (150 words)
2. Twitter/X thread (5 tweets)
3. Email newsletter intro (100 words)
4. Instagram caption with 5 hashtags

Content:
{{paste_text}}

### 5. Executive Summary

Write an executive summary (250 words max) for this document:

{{paste_text}}

Structure:
- Key finding (1 sentence)
- Context (2-3 sentences)
- 3-5 bullet insights
- Recommended action

### 6. Headline A/B Tester

Generate 10 headline variations for:
"{{headline}}"

Include:
- 3 how-to options
- 2 listicle options
- 2 question-based options
- 2 benefit-driven options
- 1 contrarian option

Each headline must stay under 65 characters.

### 7. Product Description

Write a product description for {{product}}.

Specs: {{specs}}
Target buyer: {{persona}}
Price: {{price}}

Format:
- One-line hook
- 3 benefit bullets
- Social proof placeholder
- CTA

Keep it under 150 words.

### 8. Tone Converter

Rewrite this in a {{professional/casual/humorous/academic}} tone while
keeping the same message.

Original:
{{paste_text}}

### 9. Article Outline

Create a detailed outline for a {{word_count}}-word article about
{{topic}}.

Include:
- H1 with keyword "{{keyword}}"
- 6-8 H2 sections
- 2-3 bullets per section
- Meta description (155 chars)

### 10. Story Framework

Write a 500-word short story.

Setting: {{setting}}
Character: {{character}} with flaw {{flaw}}
Conflict: {{conflict}}
Resolution: {{bittersweet/triumphant/open}}

Use vivid sensory details. Show, do not tell.

### 11. Cold Email

Write a cold email to {{role}} at {{company_type}}.

Goal: {{goal}}
Product: {{description}}
Pain: {{pain}}

Requirements:
- Under 100 words
- No "hope this finds you well"
- Personalized opening
- One CTA
- P.S. with social proof

### 12. Follow-Up Email

Write follow-up #{{number}} for a prospect who has not responded.

Context: {{summary}}
Days since last email: {{days}}

Include:
- New value (insight or case study)
- Different angle
- Question CTA

Keep it under 75 words.

## Business

### 21. Google Ads Copy

Write Google Ads for {{product}}.

Deliver:
- 5 headlines (max 30 chars)
- 3 descriptions (max 90 chars)

Keyword: {{keyword}}
USP: {{usp}}

Focus on benefits over features.

### 22. Landing Page Copy

Write landing page copy for {{product}} targeting {{audience}}.

Include:
- Hero headline + subheadline
- 3 benefit sections
- Social proof
- FAQ (4 items)
- CTA

Tone: {{tone}}

### 23. 90-Day Marketing Plan

Create a 90-day marketing plan for {{business}} with {{budget}} per
month.

Include:
- 3 channels with rationale
- Weekly content topics
- 5 KPIs with targets
- 2 quick wins for month 1

### 24. Value Proposition

Create a value proposition using this format:

For {{customer}} who {{need}}, our {{product}} is a {{category}} that
{{benefit}}. Unlike {{competitor}}, we {{differentiator}}.

Then write 3 one-liners under 15 words.

### 25. Email Welcome Sequence

Write a 5-email welcome sequence for {{business}}.

Email timing:
- Day 0: Welcome + quick win
- Day 2: Story + proof
- Day 4: Overcome objection
- Day 7: Case study
- Day 10: Offer

For each email include:
- Subject line
- ~150 word body
- One CTA

### 26. SWOT Analysis

Perform a SWOT analysis for {{company}} in {{industry}}.

Include:
- 4-5 points per quadrant
- Short explanation for each point

End with: Top strategic priority: [one sentence].

### 27. Meeting Summary

Summarize these meeting notes:

{{paste_notes}}

Output:
1. Key decisions
2. Action items (who, what, when)
3. Open questions
4. Next meeting agenda

Under 300 words.

### 28. Competitive Analysis

Compare {{product}} vs {{comp_1}}, {{comp_2}}, and {{comp_3}}.

Evaluate:
- Pricing
- 5 key features
- Target audience
- Strengths
- Weaknesses

Return a comparison table plus a 100-word summary.

## Developer

### 31. Debug This Error

Error in {{language}}:

{{paste_error}}

Code:
{{paste_code}}

Provide:
1. Root cause
2. Fixed code
3. Explanation
4. Prevention tips

### 32. Code Review

Review this code:

{{paste_code}}

Check for:
- Logic errors
- Edge cases
- Performance
- Security
- Naming
- Error handling

For each issue include severity, line reference, and recommended fix.

### 33. Refactor for Readability

Refactor this code for readability:

{{paste_code}}

Requirements:
- Preserve functionality
- Use descriptive names
- Extract repeated logic
- Keep comments minimal and useful

Return the refactored code plus a short explanation.

### 34. Unit Tests

Write unit tests using {{framework}} for:

{{paste_code}}

Cover:
- Happy paths
- Edge cases
- Error cases

Use descriptive test names.

### 35. System Design Prompt

Design a high-level architecture for {{system}}.

Context:
- Users: {{users}}
- Traffic: {{traffic}}
- Availability target: {{sla}}
- Constraints: {{constraints}}

Deliver:
1. Core components
2. Data flow
3. Scaling strategy
4. Security considerations
5. Key tradeoffs

## Productivity

### 41. Decision Matrix

Help decide between {{option_1}}, {{option_2}}, and {{option_3}}.

Criteria with weights:
{{criteria_with_weights}}

Score each option from 1-10, calculate weighted totals, and recommend the
best option.

### 42. Weekly Planner

Plan my week.

Priorities: {{list_3}}
Projects: {{list}}
Available time: {{hours}}

Rules:
- Deep work in the morning
- Group similar tasks
- Add buffer time
- Flag overflow work

### 43. Meeting Agenda Builder

Create a 30-minute meeting agenda for {{topic}}.

Participants: {{participants}}
Goal: {{goal}}
Context: {{context}}

Output:
- Agenda sections with time boxes
- Required pre-read
- Decisions needed
- Follow-up owner list

## Image Generation

### 51. Product Hero Image Prompt

Create an image-generation prompt for a hero shot of {{product}}.

Include:
- Subject and composition
- Lighting
- Camera angle
- Background details
- Style references
- Negative prompt

Output one polished prompt and one shorter variation.

### 52. Brand Illustration Prompt

Create 3 image prompts for a brand illustration system.

Brand: {{brand}}
Audience: {{audience}}
Style: {{style}}
Palette: {{palette}}
Mood: {{mood}}

For each prompt include composition, rendering style, and negative prompt.

### 53. Character Portrait Prompt

Write a detailed portrait prompt for {{character}}.

Include:
- Age and appearance
- Wardrobe
- Expression
- Setting
- Lighting
- Lens or framing
- Art style

Return one cinematic prompt and one minimalist prompt.

## Daily Life

### 61. Weekly Meal Plan

Create a healthy 7-day meal plan.

Constraints:
- Budget: {{budget}}
- Diet: {{diet}}
- Cooking time: {{time_limit}}
- Goal: {{goal}}

Include breakfast, lunch, dinner, and one shopping list.

### 62. Weekend Trip Planner

Plan a weekend trip to {{destination}}.

Budget: {{budget}}
Travel style: {{style}}
Start point: {{start_location}}
Interests: {{interests}}

Return:
- Day-by-day itinerary
- Estimated costs
- Packing list
- 3 backup options for weather changes

### 63. Daily Reset Routine

Build a daily reset routine for {{person_type}}.

Problems to solve:
{{problems}}

Include:
- Morning reset
- Midday reset
- Evening shutdown
- One simple habit tracker

### 64. Stress Reduction Plan

Create a realistic stress reduction plan.

Context:
{{context}}

Include:
- Immediate actions for today
- 3 daily habits
- 2 weekly habits
- When to ask for professional help

## Learning

### 71. Explain Like I'm 10

Explain {{topic}} simply.

Structure:
1. Simple explanation
2. Everyday analogy
3. Slightly more advanced explanation
4. One thing to remember
5. Expert version (3 sentences)

### 72. Debate Both Sides

Debate both sides of {{topic}}.

PRO:
- 3 arguments with evidence
- Best counter to CON

CON:
- 3 arguments with evidence
- Best counter to PRO

End with a balanced conclusion.

### 73. Book Summary

Summarize:
"{{book}}" by {{author}}

Include:
- Core thesis
- 5-7 key ideas
- 3 best quotes
- Practical takeaways
- Who should read it
- Connection to {{related_topic}}

### 74. Learning Roadmap

Create a learning roadmap for {{topic}} over {{timeframe}}.

Include:
- Beginner, intermediate, and advanced milestones
- Weekly practice plan
- Suggested projects
- Common mistakes to avoid
- How to measure progress
