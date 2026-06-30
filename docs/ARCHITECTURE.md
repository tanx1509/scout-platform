# Scout Platform Architecture

## System Diagram

The Scout platform operates as an event-driven, multi-agent evaluation pipeline built on Next.js, Prisma (PostgreSQL), and AI Services.

```mermaid
graph TD
    %% User Inputs
    Upload[Recruiter Uploads XLSX/CSV] --> Parser[Dataset Parser]
    Parser --> DB[(PostgreSQL + Prisma)]
    
    JD[Job Description Setup] --> DB
    
    %% Event Trigger
    DB --> Orchestrator[WorkflowCoordinator Agent]
    
    %% Multi-Agent Evaluation
    subgraph Agent Pipeline
        Orchestrator --> ResumeAgent[Resume Evaluator]
        Orchestrator --> GithubAgent[GitHub Analyzer]
        Orchestrator --> TechAgent[Technical Screener]
        
        ResumeAgent -.-> ExternalLLM[LLM Service]
        GithubAgent -.-> GithubAPI[GitHub API]
        GithubAgent -.-> ExternalLLM
    end
    
    %% Results Synthesis
    Agent Pipeline --> EvaluatorAgent[Evaluator Coordinator]
    EvaluatorAgent --> Scoring[Scoring Matrix]
    Scoring --> DB
    
    %% Recruiter UI
    DB --> Dashboard[Recruiter Cockpit]
    Dashboard --> Actions[Outreach Actions]
    
    %% Outreach
    Actions --> Resend[Resend Email API]
    Actions --> Calendar[Google Calendar API]
```

## Data Model & Pipeline Stages

1.  **Ingestion**: 
    *   XLSX/CSV datasets are parsed (extracting `name`, `email`, `branch`, `cgpa`, `github`, `best_ai_project`, `test_code`, etc.).
    *   Candidates are saved to `Candidate` table. Initial `JobMatch` is created with status `APPLIED`.
2.  **Orchestration**: 
    *   The `WorkflowCoordinator` runs a batch process over pending candidates.
    *   It parallelizes fetching external data (GitHub) and formatting existing dataset fields.
3.  **Evaluation (The Agents)**:
    *   **Resume Evaluator**: Cross-references academic metrics (CGPA, Branch), research work, and provided summary against the Job Description.
    *   **GitHub Analyzer**: Fetches public repos deterministically. Calculates a technical baseline score. If the URL is invalid or blocked, fails gracefully without blocking the pipeline.
    *   **Evaluator Coordinator**: Synthesizes the signals from the sub-agents.
4.  **Scoring Rubric (0-100)**:
    *   `technicalScore` (35%): Derived from GitHub analysis and explicit technical test results.
    *   `projectScore` (25%): Quality/relevance of the `best_ai_project`.
    *   `educationScore` (15%): Branch alignment (e.g., Computer Science) and CGPA.
    *   `researchScore` (15%): Presence and relevance of `research_work`.
    *   `assessmentScore` (10%): Initial logical/coding test results.
    *   *Note: If GitHub data is missing, weights dynamically adjust to prioritize project descriptions and test scores.*
5.  **Output**:
    *   The `EvaluatorAgent` updates the `JobMatch` record with the overall score, a discrete recommendation (`STRONG_HIRE`, `HIRE`, `FURTHER_EVALUATION`, `DO_NOT_PROCEED`), generated evidence, and identified risks.
    *   Agent actions are logged to `AgentActivity` for explainability.

## Scalability & Concurrency Notes

*   **Database Connections**: Prisma handles connection pooling, but serverless environments (like Vercel) require careful connection management to avoid exhaustion.
*   **API Limits**: 
    *   The GitHub API has strict rate limits. The `GithubAgent` should implement robust backoff/retry logic and caching (the `GithubCache` model) to minimize redundant calls.
    *   LLM API limits (tokens/minute and requests/minute) are the primary bottleneck in processing hundreds of candidates simultaneously.
*   **Batching**: The `/api/orchestrator/batch` endpoint should be transitioned from a synchronous HTTP request to a background queue worker (e.g., Inngest, BullMQ) for true scalability, allowing retries and preventing timeout errors on large datasets.
*   **File Storage**: Currently relying on URLs. Natively uploading resumes requires an S3-compatible storage layer.

## Security Considerations

*   **OAuth**: Email/Calendar integrations require Google OAuth2 with restrictive scopes (e.g., `calendar.events`). Refresh tokens must be encrypted at rest.
*   **LLM Injection**: Candidate inputs (Resume text, GitHub bio) are passed to LLMs. Strict system prompts and output schema enforcement (JSON parsing) are required to prevent prompt injection that could artificially inflate a candidate's score.
