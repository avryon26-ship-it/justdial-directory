"use client";
import { useState } from "react";
import { createReport, DataError } from "@/lib/data";
import { Icon } from "@/components/shared/Icon";

export function ReportForm({ listingId, listingName }: { listingId: string; listingName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      createReport({ listingId, listingName, message, contact });
      setDone(true);
      setError("");
    } catch (err) {
      setError(err instanceof DataError ? err.message : "Sorry, we could not send this. Please try again.");
    }
  }

  if (done)
    return (
      <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800" data-testid="report-done">
        Thank you. Your report has been sent to our team.
      </p>
    );

  return (
    <div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm text-slate-700" data-testid="report-open">
          <Icon name="flag" size={16} /> Report wrong information
        </button>
      ) : (
        <form onSubmit={submit} className="card space-y-3 p-4" aria-label="Report wrong information">
          <h3 className="font-semibold">Report wrong information</h3>
          <div>
            <label htmlFor="rep-msg" className="label">What is wrong?</label>
            <textarea id="rep-msg" className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="For example: the phone number has changed" required />
          </div>
          <div>
            <label htmlFor="rep-contact" className="label">Your phone or email (optional)</label>
            <input id="rep-contact" className="input" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" data-testid="report-submit">Send report</button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
