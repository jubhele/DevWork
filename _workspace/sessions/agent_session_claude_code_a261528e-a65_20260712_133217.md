# Session: Agent payment agreement review — Jubhele as signatory
Date: 2026-07-12
Provider: Claude Code
Model: claude-fable-5
Project: homolemo-in-europe
Project Root: c:\DevWork\Homolemo In Europe

## Project Determination
Status: resolved
Source: explicit_user_binding

## Goal
Review `Agent_payment_agreement.pdf` from LLC Sports Consulting Management (Kartlos Rukhaia, Tbilisi) in light of the user's clarification that the father, Jubhele Shange, is the sole financial committer and signatory. Deliver an assessment of the agreement's terms and risks before signing.

## Model Recommendation
Task tier: 3-Complex (contract review / risk reasoning)
Recommended model: Opus-tier or above  Trust score: 10/10
Active model: claude-fable-5  Status: correct

## Decisions
- Treated the prompt as a request for assessment, not document modification — no files changed.
- Routed conceptually to uMhloli (research/threat-modelling of the offer).

## Work Done
- Bound session to Homolemo In Europe project via constitution-hook ProjectBind.
- Read the 4-page payment agreement PDF and delivered a risk assessment: EUR 13,500 fee in two installments (31 Jul / 31 Aug 2026), placement at FC Iveria or FC Iberia 2010, 6-month 500 GEL/month player contract.
- Flagged: no refund/failure clause, fee vastly exceeds player salary, unfixed club, possible FIFA minor-fee violation, blank party identity fields, joint-liability wording despite father-only commitment, unstated visa/insurance costs, undefined role of representative Cockrill Geoffry Malvin.

## Resumed 2026-07-12
- User requested an updated agreement document. Drafted revised agreement incorporating all flagged fixes at `Homolemo In Europe\_drafts\Agent_payment_agreement_REVISED_20260712.md`; generated PDF and editable DOCX alongside via make-pdf.

## Agent Accountability

| Task ID | Assigned Agent | Completed By | Status | Iterations | Note |
|---------|---------------|--------------|--------|------------|------|
| T1 | uMhloli | uMhloli (Claude Code as uMlawuli) | COMPLETED | 1 | Agreement risk assessment delivered to user |

## Blockers / Next Steps
- User to decide whether to sign, negotiate, or request a marked-up counterproposal / email to the agency.
- Verify Amunene's age against FIFA Football Agent Regulations minor-fee prohibition before any payment.

## Learnings
- The Homolemo In Europe placement offer changed club (now FC Iveria / FC Iberia 2010) and carries a EUR 13,500 agency fee; Jubhele signs alone despite the contract naming both parents as jointly agreeing parties. Trust matrix scores confirmed unchanged.

## Goal Status
PENDING
