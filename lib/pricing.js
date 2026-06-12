export const USD_NGN_RATE = Number(process.env.NEXT_PUBLIC_USD_NGN_RATE || 1360);

export const USD_PRICES = {
  "book-1": 2.59,
  "book-2": 3.59,
  "book-3": 3.59,
  trilogy: 6.59,
  giftTrilogy: 4.59
};

export function usdToNgn(amount) {
  return Math.round(Number(amount || 0) * USD_NGN_RATE);
}

export function usdBookPrice(book) {
  return Number(book?.usdPrice || USD_PRICES[book?.id] || 0);
}
