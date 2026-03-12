# User Flow

## First-Time Setup

1. User opens extension popup.
2. User enters role, skill, and habit goal.
3. User saves profile.

## Prompt Preparation

1. User selects a default template.
2. User can open in-page Prompt Builder from launcher or by pressing `F1` while focused in chat composer.
3. User fills required fields (task, context, attempt).
4. User generates structured prompt.
5. User copies prompt into AI chat.

## Real-Time Coaching

1. User submits prompt on supported platform.
2. Extension analyzes prompt quality.
3. Live bubble updates during typing (debounced draft scoring) and on submit.
4. Top-right overlays provide warnings or suggestions.
5. Stats are updated in local storage.

Submission signals:

- Enter key in prompt composer
- Send/Submit button click

## Risk Event: Large Paste

1. User pastes large code block.
2. Extension detects code-like paste content.
3. Warning asks user to explain and test before usage.
4. Repeated behavior triggers stronger pattern alert.

## Risk Event: Copy AI Output then Reuse

1. User copies a long assistant response.
2. User pastes that content into a prompt composer.
3. Extension warns user to rewrite with personal reasoning and verification steps before sending.

## Risk Event: Fast Copy After AI Output

1. AI produces a long response.
2. Extension starts a read-time countdown reminder.
3. If user copies too quickly (Ctrl+C or copy button), extension shows immediate warning with remaining read time.
