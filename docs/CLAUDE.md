# Docs -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Purpose

This directory contains all non-code documentation for the OXAR protocol: architecture, whitepaper, brand guidelines, legal notes, and community resources.

## Structure

```
docs/
  protocol/
    architecture.md     System architecture and data flow
    whitepaper.md       Protocol whitepaper
  brand/                Brand guidelines, logos, color palette
  legal/                Legal disclaimers, regulatory notes
  community/            Community resources, onboarding guides
```

## Rules

### Markdown Only
All documentation is written in Markdown (`.md`). No Word docs, no Google Docs links, no PDFs unless they are exported artifacts.

### Language
- Technical documentation: English
- User-facing content (community/): may include Ukrainian translations where relevant to the target audience

### Keep Docs in Sync with Code
When you change the contract, SDK, or web app in a way that affects documented behavior:
1. Update the relevant doc in `protocol/`
2. If you add a new instruction, add it to `architecture.md`
3. If you change vault parameters or supported assets, update the whitepaper

Documentation that contradicts the code is worse than no documentation.

### Writing Style
- Be direct. Short sentences. No filler.
- Use code blocks for addresses, commands, and data structures.
- Use tables for structured comparisons (vault types, fee schedules).
- Use diagrams (Mermaid in Markdown) for flows when they clarify more than text.
- Define acronyms on first use: "OVDP (Ukrainian government domestic bonds)"

### File Size
Same 200-line guideline applies. If a document grows large, split it into focused sub-documents and link between them.

### What Belongs Here vs. Code Comments
- **Here**: Architecture decisions, protocol design, user-facing explanations, legal text
- **In code**: Implementation details, function behavior, edge cases
- **Neither**: Obvious things. Don't document what the code clearly says.

### Adding New Documentation
1. Place the file in the appropriate subdirectory
2. Use descriptive filenames in kebab-case (`token-economics.md`, `marketplace-flow.md`)
3. Start every doc with a level-1 heading that matches the filename concept
4. If the doc references specific code, include file paths so readers can find the source
