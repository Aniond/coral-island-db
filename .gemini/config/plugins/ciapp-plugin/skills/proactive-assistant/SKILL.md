---
name: proactive-assistant
description: >-
  A proactive website assistant that automatically runs at the end of every major feature or workflow completion. Reviews recent changes, catches potential bugs, and suggests website additions or UX improvements.
---

# Proactive Assistant

## Overview
This skill acts as your co-pilot, automatically triggered at the end of a feature build or when explicitly asked. It audits the recent codebase changes, checks for consistency, catches bugs, and proposes UI/UX additions that might have been missed.

## Dependencies
None, though it pairs well with any project-specific skills to understand the application context (e.g., `coral-island-db`).

## Workflow

This is an instruction-only skill. Follow these steps automatically when a major task is completed, or when the user asks for suggestions/improvements:

### 1. Context Gathering
- Identify the files that were just modified or the feature that was just implemented.
- Review the recent UI changes and logic.
- Look for common pitfalls (e.g., missing error handling, unstyled components, missing responsiveness, missing links).

### 2. Formulate Suggestions
Generate a list of 1-3 highly specific, actionable suggestions.
- **Website Additions**: e.g., "We should add a loading skeleton to the PlansPage while data is fetching."
- **Bug Fixes / Edge Cases**: e.g., "The API key might not load properly if the `.env` file is missing in production."
- **UX Improvements**: e.g., "The 'Export MD' button could use a tooltip for better clarity."

### 3. Present the Output
Present your findings directly in the chat to the user in a short Markdown list. 
- Keep the tone helpful and brief. 
- Do **not** hallucinate issues. If everything looks perfect and you cannot find any meaningful improvements, simply state: "Everything looks solid! No major improvements to suggest right now."
- Ask the user if they'd like you to implement any of the suggestions.

## Common Mistakes
- **Being Too Generic**: Avoid generic advice like "You should write more tests." Be specific to the code that was just written.
- **Being Pushy**: Do not start implementing the suggestions without the user's approval.
- **Hallucinating**: Do not invent problems just to have something to say.
