# Prompt Marketplace

Prompt Marketplace gives users a fast way to browse curated prompts without leaving the extension.

## Source of truth

The library is stored in [Prompt Library Source](../prompts.md).

That markdown file is imported into the extension bundle and parsed locally at runtime.

## Core capabilities

- browse prompts by category
- search prompt text locally
- filter by category
- show inline prompt suggestions while the user types in supported AI chat inputs
- copy prompts to clipboard
- insert prompts into supported AI chat inputs
- insert and send prompts on supported AI chat pages
- track local usage for trending prompts

## Supported categories

- Developer
- Learning
- Writing
- Productivity
- Image Generation
- Business
- Daily Life

## Marketplace data model

Each parsed prompt is normalized into a local object with:

- stable id
- title
- full prompt text
- category key and label
- duplicate count from source import
- source line numbers
- derived keywords for search

## Caching and trending

The extension stores local marketplace usage in `chrome.storage.local`.

Tracked actions:

- copy
- insert
- send
- inline suggestion insert

Trending prompts are ranked from:

- total local usage
- send weight
- insert weight
- copy weight
- recent usage recency

## AI chat integration

Marketplace actions reuse the same AI input detection path as the Quick Prompt Builder.

Supported targets:

- ChatGPT
- Claude
- Gemini
- Grok
- DeepSeek

If the active tab is not a supported AI chat page, the marketplace shows a friendly failure message instead of silently doing nothing.

## Inline prompt suggestions

AI Dev Coach can surface a lightweight suggestion dropdown directly in the AI chat composer.

The inline suggestions are ranked from:

- typed query relevance
- lightweight intent detection
- role-aware weighting
- local prompt popularity

The first release stays local-first and reuses the same prompt library stored in `docs/prompts.md`.
