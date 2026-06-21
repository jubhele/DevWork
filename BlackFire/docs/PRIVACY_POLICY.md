# BlackFire Solutions — Privacy Policy

**Effective date:** 21 June 2026  
**Last reviewed:** 21 June 2026  
**Responsible party:** BlackFire Solutions (Pty) Ltd

---

## 1. Introduction

BlackFire Solutions (Pty) Ltd ("BlackFire", "we", "us") operates the Umlilo Operations Portal and related services (collectively, "the Portal"). This Privacy Policy explains how we collect, use, store, disclose, and protect personal information in compliance with the **Protection of Personal Information Act 4 of 2013 (POPIA)**.

By accessing the Portal you confirm that you have read and understood this policy.

---

## 2. Responsible Party

| | |
|---|---|
| **Name** | BlackFire Solutions (Pty) Ltd |
| **Registration** | To be confirmed |
| **Contact** | info@blackfiresolutions.co.za |
| **Information Officer** | J. Shange |

---

## 3. Personal Information We Collect

We collect only the minimum personal information necessary to operate the Portal:

| Category | Examples | Purpose |
|----------|----------|---------|
| Identity | Full name, employee number | Authentication, audit trail |
| Contact | Email address, phone number | Notifications, incident escalation |
| Access credentials | Hashed password, session tokens | Secure authentication |
| Operational records | Callout logs, task assignments, safety file entries | Service delivery to host company |
| Usage data | Login timestamps, page access logs | Security monitoring and audit |

We do **not** collect sensitive personal information (special categories under POPIA §26) unless explicitly required by the service and disclosed separately.

---

## 4. Lawful Basis for Processing

We process personal information under the following POPIA grounds:

- **Performance of a contract** — operating the Portal on behalf of the host company (AECI Chempark during the pilot phase) and its authorised personnel.
- **Compliance with a legal obligation** — maintaining audit trails, OHS Act records, and security incident logs as required by law.
- **Legitimate interests** — fraud prevention, system security, and Portal improvement.

---

## 5. How We Use Your Information

- Authenticating users and managing access levels
- Recording security callouts, task completions, and safety audits
- Generating invoices and financial reports for host company management
- Sending system notifications (password resets, assignment alerts)
- Maintaining an audit log for compliance and incident review
- Improving Portal performance and reliability

We do **not** sell, rent, or share personal information with third parties for marketing purposes.

---

## 6. Data Sharing

Personal information may be shared with:

| Recipient | Reason | Safeguard |
|-----------|--------|-----------|
| Host company management (AECI Chempark) | Operational reporting | Data processing agreement |
| Cloud hosting provider (Afrihost) | Server infrastructure | Standard contractual clauses |
| AI service providers (Anthropic, OpenAI) | Automated report generation — **anonymised data only** | No personal identifiers transmitted |

All third-party processors are bound by equivalent data protection obligations.

---

## 7. Data Retention

| Data type | Retention period |
|-----------|-----------------|
| Operational callout and task records | 5 years from creation |
| Safety file records | 3 years or as required by OHS Act |
| Financial records | 7 years (Companies Act requirement) |
| Audit logs | 3 years |
| Authentication tokens | Expire on logout or after 30 days of inactivity |
| Deleted account data | Purged within 30 days of deletion request |

---

## 8. Security Measures

We implement the following to protect personal information:

- Passwords are hashed using bcrypt (cost factor ≥ 12) — plain-text passwords are never stored
- All Portal traffic is encrypted in transit (HTTPS/TLS 1.2+)
- API endpoints require authenticated sessions or Bearer tokens
- Database access is restricted to the application server; no public DB port exposure
- Rate limiting protects login endpoints against brute-force attacks
- Access is role-based — users see only what their role permits

---

## 9. Your Rights Under POPIA

You have the right to:

| Right | How to exercise |
|-------|----------------|
| **Access** — request a copy of your personal information | Email info@blackfiresolutions.co.za |
| **Correction** — correct inaccurate or outdated information | Contact your system administrator or email us |
| **Deletion** — request erasure of your account and personal data | Use the "Delete my account" option in Support, or email us |
| **Objection** — object to processing under legitimate interests | Email us with the specific objection |
| **Complain** — lodge a complaint with the regulator | Information Regulator: inforeg.org.za |

We will respond to requests within **30 days**.

---

## 10. Cookies and Session Data

The Portal uses a single session cookie (`bf_portal`) strictly to maintain your authenticated session. This cookie:

- Is **HTTP-only** and **Secure** — not accessible from JavaScript
- Expires when you sign out or after 7 days of inactivity
- Does not track behaviour across sites
- Is not used for advertising

We do not use third-party analytics cookies or tracking pixels.

---

## 11. Children

The Portal is a business-to-business operations tool intended for use by authorised personnel only. It is not directed at or designed for use by persons under the age of 18.

---

## 12. Changes to This Policy

We will notify registered users by email at least 14 days before material changes take effect. The current version is always available at `/privacy` within the Portal.

---

## 13. Contact

For any privacy-related queries, correction requests, or deletion requests:

**BlackFire Solutions (Pty) Ltd — Information Officer**  
Email: info@blackfiresolutions.co.za  
Postal: *(address to be added)*

**Information Regulator of South Africa**  
Website: [inforeg.org.za](https://inforeg.org.za)  
Email: inforeg@justice.gov.za
