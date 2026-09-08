# Campaign tracking sheet template

Create one spreadsheet with the following tabs. Replace bracketed placeholders before use. Record only business data needed to operate the campaign and handle it according to the organization’s privacy policy.

## Tab 1 — Campaign registry

| Field | Example / rule |
|---|---|
| Campaign ID | `elevated-ai-launch-2026q3` |
| Product / sender | `Elevated AI / Elevated Associates LLC` |
| Audience | `Explicitly opted-in [NEWSLETTER/WAITLIST NAME] subscribers` |
| Consent source | `[FORM, EVENT, OR WAITLIST SOURCE]` |
| Consent evidence location | `[CRM FIELD OR EXPORT LOCATION]` |
| Send segment rule | `Consent = opted in; exclude unsubscribed, bounced, complained, suppressed` |
| Landing-page URL | `https://YOUR-DOMAIN/#discovery` |
| Launch owner | `[NAME]` |
| Form/CRM owner | `[NAME]` |
| Measurement window | `[e.g., send date through 14 days after final email]` |

## Tab 2 — UTM link builder

Use one consistent URL for the executive discovery CTA in each channel. Replace `YOUR-DOMAIN` with the production domain and preserve the anchor after the query string.

**Base URL:** `https://YOUR-DOMAIN/?utm_source=[SOURCE]&utm_medium=[MEDIUM]&utm_campaign=elevated-ai-launch-2026q3&utm_content=[CONTENT]#discovery`

| Channel | Source | Medium | Content | Example final URL |
|---|---|---|---|---|
| Email 1 | `newsletter` | `email` | `launch-email-1` | `https://YOUR-DOMAIN/?utm_source=newsletter&utm_medium=email&utm_campaign=elevated-ai-launch-2026q3&utm_content=launch-email-1#discovery` |
| Email 2 | `newsletter` | `email` | `launch-email-2` | `https://YOUR-DOMAIN/?utm_source=newsletter&utm_medium=email&utm_campaign=elevated-ai-launch-2026q3&utm_content=launch-email-2#discovery` |
| Email 3 | `newsletter` | `email` | `launch-email-3` | `https://YOUR-DOMAIN/?utm_source=newsletter&utm_medium=email&utm_campaign=elevated-ai-launch-2026q3&utm_content=launch-email-3#discovery` |
| LinkedIn organic | `linkedin` | `organic-social` | `launch-post` | `https://YOUR-DOMAIN/?utm_source=linkedin&utm_medium=organic-social&utm_campaign=elevated-ai-launch-2026q3&utm_content=launch-post#discovery` |

Use lowercase, hyphenated values. Do not put a recipient name, email address, company name, or other personal data in UTM parameters.

## Tab 3 — Send and channel log

| Date | Asset | Channel | Segment / post audience | Explicit opt-in verified? | Send/post ID or URL | CTA URL / UTM content | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| [DATE] | Email 1 | Email | [SEGMENT NAME + COUNT] | Yes | [SEND ID] | `launch-email-1` | [NAME] | [Scheduled/Sent/Paused] |
| [DATE] | Email 2 | Email | [SEGMENT NAME + COUNT] | Yes | [SEND ID] | `launch-email-2` | [NAME] | [Scheduled/Sent/Paused] |
| [DATE] | Email 3 | Email | [SEGMENT NAME + COUNT] | Yes | [SEND ID] | `launch-email-3` | [NAME] | [Scheduled/Sent/Paused] |
| [DATE] | Launch post | LinkedIn organic | [PAGE/FOLLOWER CONTEXT] | N/A | [POST URL] | `launch-post` | [NAME] | [Draft/Published] |

## Tab 4 — Funnel metrics

Enter counts by asset and for the campaign total. Define each metric consistently with the sending and analytics platforms; do not compare figures with incompatible definitions.

| Metric | Definition | Formula (spreadsheet row example) |
|---|---|---|
| Delivered | Emails accepted by recipient servers | Input |
| Unique opens | Unique delivered recipients who opened, where measurable | Input |
| Unique CTA clicks | Unique recipients who clicked the discovery CTA | Input |
| Landing-page sessions | Sessions with the matching campaign UTM | Input |
| Form starts | Sessions that began the discovery form | Input |
| Form submissions | Valid discovery-form submissions | Input |
| Booked executive discovery calls | Confirmed bookings attributable to the campaign | Input |
| Qualified discovery calls | Calls meeting the organization’s documented qualification criteria | Input |
| Opportunities created | Qualified opportunities created in the CRM | Input |
| Unsubscribes | Valid unsubscribe events | Input |
| Spam complaints | Valid complaint events | Input |
| Delivery rate | Delivered / sent | `=IFERROR(B2/A2,0)` |
| Unique open rate | Unique opens / delivered | `=IFERROR(C2/B2,0)` |
| CTA click rate | Unique CTA clicks / delivered | `=IFERROR(D2/B2,0)` |
| Landing conversion rate | Form submissions / landing-page sessions | `=IFERROR(G2/E2,0)` |
| Form completion rate | Form submissions / form starts | `=IFERROR(G2/F2,0)` |
| Booking conversion rate | Booked calls / form submissions | `=IFERROR(H2/G2,0)` |
| Qualification rate | Qualified discovery calls / booked calls | `=IFERROR(I2/H2,0)` |
| Unsubscribe rate | Unsubscribes / delivered | `=IFERROR(K2/B2,0)` |
| Complaint rate | Spam complaints / delivered | `=IFERROR(L2/B2,0)` |

### Suggested tab layout

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sent | Delivered | Unique opens | Unique CTA clicks | Landing sessions | Form starts | Form submissions | Booked calls | Qualified calls | Opportunities | Unsubscribes | Complaints |

## Review cadence and decision rules

- Review delivery, unsubscribe, complaint, and reply signals after each email. Pause the sequence for affected contacts immediately when an unsubscribe, complaint, bounce, or suppression event occurs.
- Review click-to-form, form completion, booking, and qualification by UTM content to understand which message creates relevant engagement.
- Treat funnel metrics as observations, not promised outcomes. Document material changes to audience, copy, form, or attribution definitions in the campaign registry.
