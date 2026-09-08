# 60-minute launch checklist

**Use:** Complete immediately before the initial newsletter/waitlist send. Do not send if consent, suppression, landing-form, or legal-footer checks are incomplete.

| Time | Action | Completion evidence |
|---:|---|---|
| 0-5 min | Confirm the production brand and legal details: `Elevated AI`, `Elevated Associates LLC`, approved sender name/address, legal mailing address, preference-center URL, and unsubscribe URL. Replace every placeholder in the email, LinkedIn post, and tracking sheet. | Final assets contain no `[PLACEHOLDERS]` or `YOUR-DOMAIN`. |
| 5-15 min | Open `https://YOUR-DOMAIN/#discovery` in a logged-out/private browser. Confirm the URL resolves over HTTPS; the discovery form loads; required fields, validation, consent language, success state, and contact routing work; and the submission reaches `[CRM/INBOX OWNER]`. | One test submission is visible to the assigned owner and is marked as a test. |
| 15-20 min | Verify the event instrumentation for landing-page view, discovery-form start, discovery-form submit, and booked discovery call. Confirm UTMs are retained in the form/CRM where applicable. | Test event/session and UTM values are visible in the approved analytics/CRM destination. |
| 20-30 min | Build the send segment from explicit opt-in records only. Filter for `[NEWSLETTER/WAITLIST CONSENT FIELD] = opted in`; exclude unsubscribed, bounced, spam-complaint, suppressed, and previously opted-out contacts. Do not import purchased, scraped, cold, or unverified contacts. | Segment count and filters are recorded in the tracking sheet; consent source is retained. |
| 30-35 min | Check the segment against the intended senior B2B audience using only permitted, reliable fields such as role, company type, or stated interest. Do not infer sensitive characteristics or use personal data beyond the documented purpose. | Segment definition is documented; no ineligible records remain. |
| 35-42 min | Load email 1 into the approved sending platform. Confirm its honest subject and preview text, sender identity, text version, HTML version, legal footer, preference-center link, and unsubscribe link. Confirm the executive discovery CTA points to the production replacement for `https://YOUR-DOMAIN/#discovery` with the designated UTM values. | Rendering preview and link test pass; final send URL is recorded. |
| 42-47 min | Send internal test messages to `[APPROVER 1]` and `[APPROVER 2]`. Test desktop and mobile rendering, plain-text fallback, links, footer links, and reply-to inbox. | Approvals or defects are recorded. Fix defects before proceeding. |
| 47-52 min | Schedule or publish the LinkedIn organic post after verifying the same production CTA. Keep the post organic: do not configure automated direct messages or mass outreach. | Post draft/publish URL and owner are recorded. |
| 52-57 min | Obtain final approval from `[MARKETING OWNER]` and `[LEGAL/COMPLIANCE OWNER, IF REQUIRED]`. Confirm a monitored owner for form submissions and replies, plus the escalation path for complaints or erroneous sends. | Named approvals and monitoring owner are recorded. |
| 57-60 min | Send to the verified segment, or schedule the approved send time. Monitor delivery, bounces, unsubscribes, complaints, replies, landing-form submissions, and booked calls. Pause further sends and investigate any unexpected complaint, unsubscribe, or form-routing issue. | Send ID, timestamp, audience count, and early metrics are entered in the tracking sheet. |

## Permission-aware send rules

- Recipients must be explicitly opted in before each send; consent must be attributable to a source and retained under the organization’s policy.
- Honor unsubscribe requests and suppression lists immediately. Do not re-enroll an opted-out recipient without fresh, documented consent.
- Send only the three-email sequence to the qualified opt-in segment unless a recipient actively engages or separately grants additional permission.
- Use a plain, accurate sender identity and a monitored reply-to address. Escalate privacy, consent, and complaint issues to `[COMPLIANCE OWNER]`.
