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

# Retrieval Architecture

RepoPilot uses a bounded retrieval pipeline instead of blindly sending entire repositories into model context windows.

The current retrieval flow is:

1. **Selected file ingestion**  
   RepoPilot prioritizes high-signal repository files such as route handlers, source modules, package manifests, configuration files, architecture-relevant utilities, and README files. Sensitive files are filtered before ingestion.

2. **Defensive preprocessing**  
   Repository content is treated as untrusted input. Secret scanning and prompt-injection redaction run before repository text reaches the language model.

3. **Chunking**  
   Repository files are split into bounded chunks so retrieval can operate at section level granularity instead of only whole-file retrieval. Chunking also keeps context assembly within safe token limits.

4. **Deterministic scoring**  
   Current retrieval primarily uses deterministic ranking signals such as keyword overlap, file path relevance, filename importance, and architecture-aware heuristics.

5. **Hybrid retriever layer**  
   Retrieval logic is intended to flow through `hybridRetriever.ts` so ranking, chunking, fallback handling, and retrieval limits remain centralized instead of duplicated across API routes.

6. **Embedding utility layer**  
   RepoPilot includes the foundation for semantic retrieval, but embeddings are not fully wired into the default retrieval path yet. Embeddings should be generated during repository analysis, cached, and reused later during chat requests.

7. **Embedding cache abstraction**  
   Future semantic retrieval should first check a cache before generating embeddings. Cache misses may call the embedding provider while cache hits reuse stored vectors to reduce latency and token cost.

8. **Graceful fallback behavior**  
   If semantic retrieval is disabled, unavailable, rate-limited, or fails, RepoPilot should fall back to deterministic retrieval instead of blocking chat responses.

Current limitations:

- Semantic embeddings are not fully enabled in the primary retrieval pipeline yet.
- Retrieval currently relies mostly on deterministic ranking.
- Future semantic retrieval must remain feature-flagged, cached, bounded, and protected against prompt-injection and secret leakage.

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
```