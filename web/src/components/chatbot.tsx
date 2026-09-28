"use client";

import { useMemo, useState } from "react";

type Message = { role: "bot" | "you"; text: string };

const replies: { test: RegExp; text: string }[] = [
  {
    test: /nri|canada|london|usa|uk|abroad|international|ship|dubai|australia/i,
    text: "Yes, we ship worldwide. At checkout pick Worldwide. Shipping is ₹2,499. You pay in rupees. We pack from Kishanpura Road, Jalandhar.",
  },
  {
    test: /qr|bill|scan|receipt/i,
    text: "Every order gets a QR. Anyone who scans it opens the live bill — items, total, shipping and status. Try a sample: /bill/bms-nri-001",
  },
  {
    test: /store|shop|address|jalandhar|kishanpura|lamba|where/i,
    text: "Four shops on one stretch — Kishanpura Chowk to Lamba Pind Chowk Road. Shop 8 Women, Shop 9 Kids, Shop 10 All, Shop 11 All. Open 11:00 AM – 9:30 PM.",
  },
  {
    test: /women|suit|dress|heel|dupatta/i,
    text: "Shop 8 is women only — silk suits, cotton daily suits, western dresses, heels, totes. Same pieces are on the website with the same description.",
  },
  {
    test: /kid|child|school|frock/i,
    text: "Shop 9 is kids — graphic tees, frocks, school shoes, polos, jackets. Sizes run 2–11 years.",
  },
  {
    test: /size|fit|exchange/i,
    text: "India orders: easy 7-day exchange. Worldwide orders: send us a photo within 7 days of delivery and we will help with a swap.",
  },
  {
    test: /price|cost|how much/i,
    text: "Honest tags, no fake discounts. Shirts from ₹1,899, suits ₹2,199–₹3,499, kids from ₹799. Free India shipping above ₹1,999.",
  },
  {
    test: /help|don.?t know|what to buy|outfit|wedding|casual|birthday|club|gedi|occasion/i,
    text: "Open Help me pick. Tell us the occasion — wedding, casual, birthday, club, gedi or office. We shortlist pieces step by step and make a full outfit.",
  },
  {
    test: /order|track|status/i,
    text: "Place an order in checkout, then scan the QR on the success screen. Status moves placed → packed → shipped → on the way → delivered.",
  },
];

function answer(input: string) {
  const hit = replies.find((row) => row.test.test(input));
  return (
    hit?.text ??
    "I can help with what to wear, shipping, shops on Kishanpura Road, sizes or bills. Ask in simple words."
  );
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "bot",
      text: "Hi, this is BMS Fashionz. Four shops on Kishanpura Road, and we ship worldwide. How can I help?",
    },
  ]);

  const chips = useMemo(() => ["What should I buy?", "Where are the shops?", "QR bill", "Kids sizes"], []);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "you", text: clean }, { role: "bot", text: answer(clean) }]);
    setInput("");
  }

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {open ? (
        <section className="mb-3 flex h-[440px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ivory shadow-[0_24px_80px_rgba(18,17,15,0.35)]">
          <header className="flex items-center justify-between bg-[#141210] px-5 py-3 text-ivory">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">BMS Fashionz</p>
              <p className="font-serif text-xl">Chat help</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "bot" ? "bg-white text-ink" : "ml-auto bg-ink text-ivory"
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {chips.map((chip) => (
              <button
                key={chip}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs"
                onClick={() => send(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a suit, a size, Canada..."
              className="flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm outline-none"
            />
            <button className="rounded-full bg-gold px-4 text-sm text-ink">Send</button>
          </form>
        </section>
      ) : null}
      <button
        className="rounded-lg bg-[#141210] px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-ivory shadow-lg transition hover:bg-[#c4a574] hover:text-ink"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Ask BMS"}
      </button>
    </div>
  );
}
