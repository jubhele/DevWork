# GovTender — System Architecture (Mermaid Diagrams)

*Maintained by Mbhali. Updated on every production delivery.*

---

## 1. Full System Flow

```mermaid
flowchart TD
    subgraph CRAWL["Crawl Layer (nightly)"]
        C1[Playwright\netenders.gov.za] --> N[Normaliser]
        C2[BeautifulSoup\ncidb / sita] --> N
        C3[Scrapy\nSOEs / municipal] --> N
    end

    N --> DB[(PostgreSQL\ntenders)]

    DB --> M{Matcher\nClaude Haiku 4.5}
    SUB[(subscribers)] --> M
    M --> TM[(tender_matches)]
    TM --> EMAIL[Resend\nDaily Digest]

    EMAIL --> DASH[Next.js Dashboard]
    DASH --> API[FastAPI Backend]
    API --> GEN[Proposal Generator\nClaude Sonnet 4.6]
    SUBDOCS[(subscriber_documents\npgvector)] --> GEN
    GEN --> DOCX[.docx + PDF\npython-docx / WeasyPrint]
    DOCX --> AUTO[Playwright\nForm Automation]
    AUTO --> PORTALS[Government Portals]
    AUTO --> PROPS[(proposals\nsubmission_ref)]
```

---

## 2. Database Schema

```mermaid
erDiagram
    subscribers {
        uuid id PK
        text email
        text company_name
        text csd_number
        int bbbee_level
        date bbbee_expiry
        text cidb_grade
        text[] geographic_reach
        text[] service_lines
        text[] sectors
        text stripe_customer_id
        text plan_tier
        bool plan_active
        timestamptz created_at
    }

    tenders {
        uuid id PK
        text source_portal
        text ref_number
        text title
        text description
        text issuing_entity
        numeric estimated_value
        timestamptz closing_date
        text unspsc_code
        text cidb_grade
        int bbbee_level
        text geographic_scope
        jsonb required_docs
        timestamptz crawled_at
    }

    tender_matches {
        uuid id PK
        uuid tender_id FK
        uuid subscriber_id FK
        int score
        text reason
        bool included_in_digest
        timestamptz scored_at
    }

    proposals {
        uuid id PK
        uuid tender_id FK
        uuid subscriber_id FK
        text status
        text docx_path
        text pdf_path
        text submission_ref
        timestamptz submitted_at
        timestamptz created_at
    }

    subscriber_documents {
        uuid id PK
        uuid subscriber_id FK
        text filename
        text doc_type
        text content_chunk
        vector embedding
        timestamptz created_at
    }

    portal_credentials {
        uuid id PK
        uuid subscriber_id FK
        text portal
        text username_enc
        text password_enc
        text nonce
    }

    subscribers ||--o{ tender_matches : "receives"
    subscribers ||--o{ proposals : "owns"
    subscribers ||--o{ subscriber_documents : "uploads"
    subscribers ||--o{ portal_credentials : "stores"
    tenders ||--o{ tender_matches : "matched in"
    tenders ||--o{ proposals : "has"
```

---

## 3. Tender Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Crawled : nightly crawl
    Crawled --> Scored : matcher run
    Scored --> Digested : score >= 60
    Digested --> ProposalDraft : subscriber clicks Generate
    ProposalDraft --> ProposalReady : Claude Sonnet completes
    ProposalReady --> Submitted : Playwright submits
    Submitted --> Awarded : subscriber marks outcome
    Submitted --> NotAwarded : subscriber marks outcome
    Awarded --> [*]
    NotAwarded --> [*]
```

---

## 4. API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | None | Liveness probe |
| POST | /auth/login | None | Issue JWT |
| GET | /tenders | JWT | Paginated matched tenders for subscriber |
| GET | /tenders/{id} | JWT | Single tender detail + match reason |
| POST | /proposals/generate | JWT | Trigger proposal generation |
| GET | /proposals/{id} | JWT | Proposal status + download URLs |
| GET | /subscribers/profile | JWT | Read subscriber profile |
| PUT | /subscribers/profile | JWT | Update subscriber profile |
| POST | /subscribers/documents | JWT | Upload capability document |
| POST | /webhooks/stripe | Stripe-sig | Subscription lifecycle events |

---

## 5. Agent Workforce Flow (per task)

```mermaid
sequenceDiagram
    participant H as Human
    participant ML as Mlawuli
    participant SB as Sibali
    participant W as Worker Agent
    participant MB as Mbhali

    H->>ML: Submit task (JSON)
    ML->>SB: Cost clearance + payload trim
    SB-->>ML: APPROVED + optimized_payload + token_budget
    ML->>W: Execute (Umakhi / Mvavanyi / etc.)
    W-->>ML: COMPLETED (JSON)
    ML->>SB: Final cost indexing
    opt if Production Stage
        ML->>MB: Post-production handoff
        MB-->>ML: Docs updated
    end
    ML-->>H: Result
```
