# AI Prompt Library

A focused collection of reusable prompts for developer workflows and technical learning.

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

### 36. Incident Triage

Help triage this production issue.

Incident summary:
{{incident_summary}}

Known signals:
- Error rate: {{error_rate}}
- Impacted service: {{service}}
- Started at: {{start_time}}
- Recent changes: {{recent_changes}}

Return:
1. Most likely causes
2. Safest next checks
3. Rollback criteria
4. Short stakeholder update

### 37. Migration Risk Review

Review this migration plan:

{{migration_plan}}

Focus on:
- Data integrity risks
- Rollback gaps
- Observability gaps
- Dependency ordering
- Test coverage gaps

Return the highest-risk items first.

### 38. PR Review Comment Reply

Draft a reply to this pull request review comment:

{{review_comment}}

Context:
- Change summary: {{change_summary}}
- Constraint or tradeoff: {{constraint}}
- Proposed action: {{proposed_action}}

Return:
1. A concise reply
2. The code or test follow-up to make

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

### 75. Interview Drill

Help me practice for a technical interview on {{topic}}.

Include:
- 5 interview questions from easy to hard
- What a strong answer should cover
- One common weak answer pattern
- One short homework task to reinforce the topic
