import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesPayment } from "../src/lib/payment-validation";
import { createToken, verifyToken } from "../src/lib/auth";
import { publicUser, publicBounty } from "../src/lib/public-data";
import type { DbUser, DbBounty } from "../src/lib/db";
test("payment verification rejects wrong amount, currency, reference and non-success", () => {
  const payment = {
    status: "successful",
    tx_ref: "ks-1",
    currency: "NGN",
    amount: 100.01,
  };
  assert.equal(matchesPayment(payment, "ks-1", 10001), true);
  for (const bad of [
    { amount: 100 },
    { amount: Infinity },
    { amount: "invalid" },
    { currency: "USD" },
    { tx_ref: "ks-other" },
    { status: "pending" },
  ])
    assert.equal(matchesPayment({ ...payment, ...bad }, "ks-1", 10001), false);
});
test("session signatures reject modification, missing expiry and expired tokens", () => {
  const payload = {
    userId: "u",
    email: null,
    name: "User",
    role: "SEEKER",
    exp: Date.now() + 10000,
  };
  const token = createToken(payload);
  assert.equal(verifyToken(token)?.userId, "u");
  assert.equal(verifyToken(token + "x"), null);
  assert.equal(
    verifyToken(createToken({ ...payload, exp: Date.now() - 1 })),
    null,
  );
  assert.equal(verifyToken(createToken({ ...payload, exp: NaN })), null);
  const [, signature] = token.split(".");
  assert.equal(
    verifyToken(
      Buffer.from(JSON.stringify({ ...payload, role: "HELPER" })).toString(
        "base64url",
      ) +
        "." +
        signature,
    ),
    null,
  );
});
test("public responses exclude secrets, personal fields and nonparticipant addresses", () => {
  const user = {
    id: "h",
    name: "Helper",
    password_hash: "secret",
    email: "private@example.test",
    phone: "private",
    date_of_birth: "private",
    total_earnings: 1000,
  } as DbUser;
  const safe = publicUser(user);
  assert.equal(safe.password_hash, undefined);
  assert.equal(safe.email, null);
  assert.equal(safe.total_earnings, undefined);
  const bounty = {
    id: "b",
    seeker_id: "s",
    address: "Private address",
    bids: [],
  } as unknown as DbBounty;
  assert.equal(publicBounty(bounty).address, null);
  assert.equal(publicBounty(bounty, "stranger").address, null);
  assert.equal(publicBounty(bounty, "s").address, "Private address");
});
