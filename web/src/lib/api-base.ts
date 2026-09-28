const fallback =
  process.env.NODE_ENV === "production"
    ? "https://api.revilen.com/bms-fashionz/api"
    : "http://localhost:4000/api";

export const API = (process.env.NEXT_PUBLIC_API_URL ?? fallback).replace(/\/+$/, "");
