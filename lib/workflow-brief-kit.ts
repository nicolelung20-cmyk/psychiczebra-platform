export const WORKFLOW_BRIEF_KIT = String.raw`# Elevat AI — Workflow Brief Kit

**Version:** 1.0  
**Purpose:** Turn one clear offer into a measurable lead-to-cash process.  
**Use:** Copy this kit, fill in the blanks, and run one small test before automating.

---

## 1. The revenue loop

Use the same states for every prospect or order:

1. **VISITOR** — reached the offer page.
2. **LEAD_CAPTURED** — gave permission to be contacted and supplied a usable contact route.
3. **QUALIFIED** — has a relevant problem, authority/access, and a plausible timeline.
4. **OFFERED** — received a specific scope, price, and next step.
5. **CHECKOUT_STARTED** — opened checkout; this is not revenue.
6. **PAYMENT_PENDING** — checkout completed but the processor has not confirmed funds.
7. **PAID_CONFIRMED** — processor records a successful payment.
8. **DELIVERED** — promised product or service was provided.
9. **ACCEPTED** — customer confirms receipt or the agreed acceptance condition is met.

Exception states: **CANCELLED**, **REFUNDED**, **DISPUTED**, and **NEEDS_HUMAN_REVIEW**.

**Money rule:** count revenue only when the payment processor confirms payment. A click, open checkout, screenshot, email, or success-page visit is not proof of payment.

## 2. One-page offer brief

Fill in before promoting:

- **Buyer:** [Who has the problem?]
- **Problem:** [What costly or frustrating gap do they have?]
- **Outcome:** [What concrete deliverable will they receive?]
- **Scope:** [What is included?]
- **Exclusions:** [What is not included?]
- **Price and currency:** [$___ USD]
- **Delivery deadline:** [e.g. within 2 business days after intake]
- **Required customer input:** [What must they provide?]
- **Delivery channel:** [secure download / email / meeting]
- **Support boundary:** [what follow-up is included?]
- **Refund/cancellation terms:** [publish clear terms before checkout]
- **Proof of completion:** [delivery log, receipt, or customer acceptance]

Avoid guaranteed revenue, savings, or performance claims unless you can substantiate them.

## 3. Lead capture and qualification

Collect only what is needed, with clear consent to follow up:

| Field | Why it matters |
|---|---|
| Name and work email | Reply to the prospect |
| Company / role | Understand the context |
| Main bottleneck | Identify the real problem |
| Current process | Establish a baseline |
| Desired outcome | Scope the offer |
| Timeline | Decide the next step |
| Budget fit | Avoid proposing an unsuitable package |
| Consent and source | Respect contact preference and attribution |

Qualification questions:
- What happens between the first inquiry and getting paid?
- Where do prospects most often stall or disappear?
- How is follow-up assigned and measured today?
- What happens after payment, and how is delivery confirmed?
- What one metric would show improvement in 30 days?

Do not collect sensitive personal information unless genuinely required.

## 4. Follow-up templates

**First reply**
> Thanks for reaching out. To see whether I can help, what is the biggest gap between inquiry, payment, and delivery in your current process? If you share the current steps and the outcome you want, I’ll recommend a practical next step.

**After sending an offer**
> Quick follow-up on the [offer name] brief I sent. It covers [specific outcome] for [price] and includes [deliverables]. If the scope fits, you can use the checkout link in the brief; if not, tell me what needs to change.

**After confirmed payment**
> Payment is confirmed. Your next step is [intake link / required information]. Delivery is due [date/time] once the required intake is complete. I’ll confirm when the deliverable is ready.

**If payment is pending**
> Checkout has not yet been confirmed as paid. Please wait for the processor confirmation before treating the order as active. If you were charged but do not see confirmation, contact support with the checkout receipt—never send full card details.

## 5. Payment and fulfillment checklist

Before launch:
- [ ] Offer name, scope, price, currency, and refund terms match the checkout page.
- [ ] A server-side webhook verifies the processor signature.
- [ ] Only confirmed successful payments create paid records.
- [ ] Each processor session/event is processed idempotently (retries do not create duplicate orders).
- [ ] Product identity and amount are checked before fulfillment.
- [ ] Delivery route checks payment with the processor server-side; it does not trust a query parameter alone.
- [ ] Delivery is recorded with a timestamp.
- [ ] Failed or ambiguous events go to a review queue; no manual “paid” override without evidence.
- [ ] Refunds/disputes suspend or review access according to published policy.
- [ ] A real test-mode checkout is completed before relying on the flow; never run a test charge on a live account.

After each order:
- [ ] Confirm paid status in the processor.
- [ ] Match the order/session ID and product.
- [ ] Deliver only the purchased item.
- [ ] Record delivery timestamp and method.
- [ ] Confirm customer receipt where appropriate.
- [ ] Reconcile gross amount, refunds, fees, and net payout separately.

## 6. Automation brief template

Copy for each automation candidate:

- **Trigger:** [specific event]
- **Preconditions:** [what must be true]
- **Inputs:** [minimum required fields]
- **Action:** [one concrete operation]
- **Success evidence:** [database row / provider event / delivery receipt]
- **Failure path:** [retry, queue, or human review]
- **Idempotency key:** [stable event/order ID]
- **Permissions:** [least privilege]
- **Customer impact:** [what they see]
- **Rollback:** [how to disable safely]
- **Owner:** [person accountable]
- **Metric:** [conversion, response time, error rate, fulfillment time]

Automate repetitive, reversible work first. Keep refunds, unusual payments, legal commitments, and irreversible money movement behind explicit human approval.

## 7. Minimal KPI tracker

Record weekly, with definitions held constant:

| Metric | Formula |
|---|---|
| Qualified lead rate | qualified leads / captured leads |
| Offer rate | offers sent / qualified leads |
| Checkout conversion | paid orders / checkout starts |
| Confirmed gross sales | sum of processor-confirmed successful payments |
| Refund rate | refunded amount / gross successful payments |
| Delivery time | delivered timestamp − confirmed paid timestamp |
| Fulfillment success | delivered orders / paid orders |
| Customer acceptance | accepted orders / delivered orders |

Separate **gross sales**, **processor fees**, **refunds**, **disputes**, and **payouts received**. A payout is not the same measure as a new sale.

## 8. First 48 hours

**Hours 0–4**
- Pick one buyer and one painful problem.
- Write the offer brief and state exclusions.
- Make the checkout page match the offer.

**Hours 4–12**
- Walk the buyer path on mobile.
- Check privacy, contact consent, cancellation/refund terms, and the post-payment destination.
- Run a test-mode purchase and refund if test mode is available.

**Hours 12–24**
- Ask three relevant people for feedback; do not spam or imply endorsement.
- Record objections and refine scope, not just copy.

**Hours 24–48**
- Process the first genuine order only after the payment and delivery controls are verified.
- Measure each state in the revenue loop.
- Fix the largest observed drop-off before adding more tools or spend.

## 9. Weekly review

Answer:
1. Which state lost the most qualified prospects?
2. What evidence supports that conclusion?
3. What is the smallest reversible change to test?
4. What result would prove or disprove the change?
5. Did any payment, delivery, refund, or dispute need manual review?

**Operating rule:** verify the event, execute the smallest safe action, record the outcome, and improve from observed results—not assumptions.
`;
