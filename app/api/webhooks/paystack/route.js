import { createHmac } from "node:crypto";
import { json, readState, uid, writeState } from "@/lib/store";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) return json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured." }, { status: 500 });

  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  if (hash !== signature) return json({ ok: false, error: "Invalid Paystack signature." }, { status: 401 });

  const event = JSON.parse(rawBody);
  if (event.event !== "charge.success") return json({ ok: true, ignored: true });

  const reference = event.data?.reference;
  const state = await readState();
  const transaction = state.transactions?.find((item) => item.reference === reference);
  if (!transaction) return json({ ok: true, missingReference: true });

  const exists = state.purchases?.some((item) => item.paymentReference === reference);
  if (!exists) {
    state.purchases = state.purchases || [];
    state.purchases.push({
      id: uid("purchase"),
      userId: transaction.userId,
      productType: transaction.productType,
      bookId: transaction.bookId || null,
      sectionId: transaction.sectionId || null,
      amount: Number(transaction.amount),
      paymentReference: reference,
      paymentGateway: "Paystack",
      status: "Successful",
      createdAt: new Date().toISOString()
    });
  }

  transaction.status = "Successful";
  transaction.verifiedAt = new Date().toISOString();
  await writeState(state);
  return json({ ok: true });
}
