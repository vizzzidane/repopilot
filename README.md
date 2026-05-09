# RepoPilot

AI onboarding copilot for GitHub repositories.

RepoPilot helps developers understand unfamiliar GitHub repositories by selectively indexing high-signal files, generating architecture diagrams, identifying key files, suggesting contribution tasks, and tracing execution flows through the codebase.

---

## Live Demo

[Live Demo](https://repopilot-one.vercel.app/)

---

## GitHub Repository

[GitHub Repository](https://github.com/vizzzidane/repopilot)

---

## The Problem

Developers often waste significant time trying to understand unfamiliar repositories before they can contribute productively.

Even experienced engineers struggle to:

- identify important files
- understand repository architecture
- trace execution flows
- figure out where to start contributing
- onboard quickly onto large codebases

---

## The Solution

RepoPilot acts as an AI onboarding copilot for GitHub repositories.

Instead of indexing an entire repository blindly, RepoPilot selectively extracts high-signal files such as:

- README files
- configuration files
- app entry points
- API routes
- services
- core source files

Using those files, RepoPilot generates:

- repository summaries
- architecture explanations
- architecture diagrams
- onboarding guidance
- contribution ideas
- setup steps
- execution flow traces
- repository-specific Q&A

---

## Key Features

### Selective Repository Indexing

Indexes only high-signal files instead of flooding the context window with unnecessary code.

### Repository Summary

Generates a concise technical overview of the repository.

### Architecture Diagrams

Creates Mermaid-based visual architecture diagrams automatically.

### Indexed Files Transparency

Shows exactly which files were indexed for analysis.

### GitHub File Links

Provides grounded navigation directly back to GitHub source files.

### Key Files to Inspect

Highlights the most important files for onboarding.

### Contribution Guidance

Suggests beginner-friendly contribution starting points.

### Risk and Unknowns Analysis

Identifies unclear or potentially risky areas in the repository.

### Repository-Specific Q&A

Answers questions about the repository using the indexed files.

### Execution Flow Tracing

Traces execution paths and generates flow diagrams for repository-specific questions.

---

## Demo Repository

Main demo repository used during presentation:

```text
https://github.com/vizzzidane/ipl-live-win-probability-predictor