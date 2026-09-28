"use client";

import { FormEvent, useState } from "react";
import { sendContact } from "@/lib/api";

export default function ContactPage() {
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as {
      name: string;
      email: string;
      message: string;
    };
    try {
      await sendContact(data);
      setStatus("Message received. We’ll get back to you.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send");
    }
  }

  return (
    <div className="mx-auto grid w-[min(1000px,calc(100%-2rem))] gap-10 py-16 md:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Visit / write</p>
        <h1 className="mt-3 text-6xl">Come try the fits.</h1>
        <p className="mt-6 text-muted">
          BMS Fashionz
          <br />
          Kishanpura Chowk–Lamba Pind Chowk Road, Jalandhar
          <br />
          Shop 8 Women · Shop 9 Kids · Shop 10 All · Shop 11 All
          <br />
          Open 11:00 AM – 9:30 PM
        </p>
        <p className="mt-4 text-muted">
          +91 98765 43210
          <br />
          hello@bmsfashionz.demo
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-white p-6">
        <label className="grid gap-2 text-sm">
          Name
          <input name="name" required className="rounded-xl border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Email
          <input name="email" type="email" required className="rounded-xl border border-line px-3 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Message
          <textarea name="message" required rows={5} className="rounded-xl border border-line px-3 py-3" />
        </label>
        <button className="rounded-full bg-ink py-3 text-ivory">Send message</button>
        {status ? <p className="text-sm text-gold">{status}</p> : null}
      </form>
    </div>
  );
}
