export function matchesPayment(
  data: {
    status?: unknown;
    tx_ref?: unknown;
    currency?: unknown;
    amount?: unknown;
  },
  reference: string,
  amountKobo: number,
): boolean {
  const amount = Number(data.amount);
  return (
    data.status === "successful" &&
    data.tx_ref === reference &&
    data.currency === "NGN" &&
    Number.isFinite(amount) &&
    Math.round(amount * 100) === amountKobo
  );
}
