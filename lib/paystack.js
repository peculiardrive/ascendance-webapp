import { randomBytes } from "node:crypto";
import { readState } from "./store";
import { USD_PRICES, usdBookPrice, usdToNgn } from "./pricing";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export function paystackReference(prefix = "ASC") {
  return `${prefix}-${Date.now()}-${randomBytes(5).toString("hex")}`.toUpperCase();
}

export function paystackAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

export async function paystackRequest(path, options = {}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok || data.status === false) {
    throw new Error(data.message || "Paystack request failed.");
  }
  return data;
}

export async function resolvePaymentProduct({ productType, bookId, sectionId }) {
  const state = await readState();

  if (productType === "trilogy") {
    return {
      productType,
      bookId: null,
      sectionId: null,
      amount: usdToNgn(state.settings.trilogyPriceUsd || USD_PRICES.trilogy),
      usdAmount: Number(state.settings.trilogyPriceUsd || USD_PRICES.trilogy),
      product: "Full Trilogy"
    };
  }

  if (productType === "gift-trilogy") {
    return {
      productType,
      bookId: null,
      sectionId: null,
      amount: usdToNgn(state.settings.giftPriceUsd || USD_PRICES.giftTrilogy),
      usdAmount: Number(state.settings.giftPriceUsd || USD_PRICES.giftTrilogy),
      product: "Gift Ascendance Trilogy"
    };
  }

  if (productType === "section") {
    const section = state.books.flatMap((book) => book.sections || []).find((item) => item.id === sectionId);
    if (!section) throw new Error("Section not found.");
    return {
      productType,
      bookId: null,
      sectionId,
      amount: Number(section.price || 0),
      product: section.title
    };
  }

  const book = state.books.find((item) => item.id === bookId);
  if (!book) throw new Error("Book not found.");
  return {
    productType: "book",
    bookId,
    sectionId: null,
    amount: usdToNgn(usdBookPrice(book)),
    usdAmount: usdBookPrice(book),
    product: book.title
  };
}
