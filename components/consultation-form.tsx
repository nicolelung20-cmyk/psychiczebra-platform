"use client";

import { FormEvent, useState } from "react";

type ConsultationResponse = {
  error?: string;
  message?: string;
};

export function ConsultationForm() {
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ConsultationResponse;

      if (!response.ok) {
        setStatus({
          kind: "error",
          message: body.error ?? "We could not send your inquiry. Please try again.",
        });
        return;
      }

      event.currentTarget.reset();
      setStatus({
        kind: "success",
        message: body.message ?? "Thank you. Your inquiry has been received.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? `We could not send your inquiry: ${error.message}`
            : "We could not send your inquiry. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="consultation-form" onSubmit={submitConsultation}>
      <div className="form-field">
        <label htmlFor="fullName">Name</label>
        <input autoComplete="name" id="fullName" name="fullName" required />
      </div>
      <div className="form-field">
        <label htmlFor="email">Work email</label>
        <input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="form-field">
        <label htmlFor="title">Title</label>
        <input autoComplete="organization-title" id="title" name="title" required />
      </div>
      <div className="form-field">
        <label htmlFor="company">Company</label>
        <input autoComplete="organization" id="company" name="company" required />
      </div>
      <div className="form-field">
        <label htmlFor="teamSize">Organization size</label>
        <select defaultValue="" id="teamSize" name="teamSize" required>
          <option disabled value="">Select an option</option>
          <option value="1-50">1–50 people</option>
          <option value="51-200">51–200 people</option>
          <option value="201-500">201–500 people</option>
          <option value="501-1000">501–1,000 people</option>
          <option value="1001+">1,001+ people</option>
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="investment">Anticipated investment</label>
        <select defaultValue="" id="investment" name="investment" required>
          <option disabled value="">Select an option</option>
          <option value="5000-10000">$5k–$10k</option>
          <option value="10000-15000">$10k–$15k</option>
          <option value="15000-plus">$15k+</option>
          <option value="exploring">Still exploring</option>
        </select>
      </div>
      <div className="form-field form-field-full">
        <label htmlFor="priority">What decision or business priority should AI help address?</label>
        <textarea id="priority" name="priority" required rows={4} />
      </div>
      <button className="button button-primary form-submit" disabled={submitting} type="submit">
        {submitting ? "Sending inquiry..." : "Request an executive discovery call"} <span aria-hidden="true">→</span>
      </button>
      <p className="form-privacy">Your details are used only to respond to this implementation inquiry.</p>
      {status && (
        <p
          aria-live="polite"
          className={`form-status form-status-${status.kind}`}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
