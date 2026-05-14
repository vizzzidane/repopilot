# RepoPilot

AI-powered repository onboarding and codebase intelligence platform.

RepoPilot helps developers understand unfamiliar repositories by combining structured repository ingestion, architecture-aware retrieval, conversational analysis, and defensive AI engineering techniques.

It is designed to reduce onboarding time for large or unfamiliar codebases by generating grounded repository intelligence directly from source files.

---

# What RepoPilot Does

RepoPilot analyzes GitHub repositories and generates:

- repository architecture summaries
- execution flow explanations
- onboarding guidance
- repository risk analysis
- contribution starting points
- architecture diagrams
- repository-specific Q&A
- conversational codebase exploration

Unlike naive "index everything" approaches, RepoPilot selectively retrieves high-signal files and applies defensive filtering before repository content reaches the language model.

---

# Core Features

## Repository Analysis

- High-signal repository indexing
- Architecture-aware file selection
- Dependency-aware retrieval
- Large repository handling with partial analysis fallback
- Execution flow tracing

## Conversational Repository Memory

- Multi-turn repository Q&A
- Context-aware follow-up questions
- Repository session continuity
- Analysis history persistence

## Architecture Visualization

- Mermaid-based architecture diagrams
- Execution flow diagrams
- Key dependency visibility

## Security and Defensive AI Engineering

- SSRF-safe GitHub URL validation
- Prompt injection redaction
- Secret redaction before LLM ingestion
- Bounded token/context handling
- Input sanitization
- Auth-aware API protection
- User + IP rate limiting

## Reliability and Engineering Workflow

- CI/CD validation pipeline
- Automated regression testing
- Usage observability and token estimation
- Repository analysis caching
- Structured retrieval chunking foundation

---

# Architecture Overview

## Analysis Pipeline

1. Validate and sanitize GitHub repository URL
2. Fetch repository metadata from GitHub
3. Select high-signal files
4. Filter blocked or dangerous files
5. Redact secrets and prompt-injection patterns
6. Build architecture-aware repository context
7. Generate repository intelligence using OpenAI
8. Persist analysis history and cached results

## Chat Pipeline

1. Load repository analysis context
2. Load bounded conversational history
3. Retrieve relevant repository files
4. Assemble grounded prompt context
5. Generate repository-specific responses
6. Persist conversational continuity

---

# Retrieval Strategy

RepoPilot intentionally avoids blindly embedding entire repositories into context windows.

Current retrieval system includes:

- selective repository indexing
- dependency-aware retrieval
- source file chunking
- bounded context assembly
- architecture-aware prompt construction

The retrieval layer is designed to evolve toward semantic vector retrieval for large-scale repositories.

---

# Security Considerations

RepoPilot treats repository content as untrusted input.

Current protections include:

- HTTPS-only GitHub validation
- non-GitHub host rejection
- credential stripping
- prompt injection redaction
- secret scanning/redaction
- request rate limiting
- bounded memory/context windows
- defensive sanitization
- controlled repository ingestion

---

# Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- React Markdown
- Mermaid

## Backend

- Next.js App Router APIs
- OpenAI API
- Prisma ORM
- PostgreSQL
- NextAuth
- Upstash Redis
- Upstash Rate Limit

## Tooling

- Vitest
- GitHub Actions
- ESLint
- Prisma

---

# Testing and CI

RepoPilot includes:

- automated build validation
- security regression tests
- retrieval utility tests
- CI enforcement through GitHub Actions

Every push runs:

- dependency installation
- Prisma validation
- automated tests
- production build verification

---

# Local Development

## 1. Install dependencies

```bash
npm install