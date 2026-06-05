import { paystackRequest } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

export async function POST(request) {
  try {
    const userId = userIdFrom(request);
    const payload = await readJson(request);
    requireFields(payload, ["reference"]);
    if (!userId) return json({ ok: false, error: "Missing user session." }, { status: 401 });

    const reference = String(payload.reference).trim();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

    const state = await readState();
    state.transactions = state.transactions || [];
    state.purchases = state.purchases || [];

    const transaction = state.transactions.find((item) => item.reference === reference && item.userId === userId);
    if (!transaction) return json({ ok: false, error: "Payment reference not found." }, { status: 404 });

    const existing = state.purchases.find((item) => item.paymentReference === reference);
    if (existing) return json({ ok: true, purchase: existing, alreadyVerified: true });

    const verification = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
    const paid = verification.data.status === "success";
    const expectedAmount = Math.round(Number(transaction.amount || 0) * 100);
    const paidAmount = Number(verification.data.amount || 0);

    if (!paid || paidAmount !== expectedAmount) {
      transaction.status = paid ? "Amount Mismatch" : verification.data.status || "Failed";
      await writeState(state);
      return json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
    }

    const purchase = {
      id: uid("purchase"),
      userId,
      productType: transaction.productType,
      bookId: transaction.bookId || null,
      sectionId: transaction.sectionId || null,
      amount: Number(transaction.amount),
      paymentReference: reference,
      paymentGateway: "Paystack",
      status: "Successful",
      createdAt: new Date().toISOString()
    };

    state.purchases.push(purchase);
    transaction.status = "Successful";
    transaction.verifiedAt = purchase.createdAt;
    transaction.gatewayResponse = verification.data.gateway_response;
    await writeState(state);

    return json({ ok: true, purchase, transaction });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
