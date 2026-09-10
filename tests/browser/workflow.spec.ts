import { test, expect } from "@playwright/test";
test("two accounts can post, bid, select a helper and exchange a private message", async ({
  request,
  playwright,
}) => {
  await request.post("/api/auth/seed");
  expect(
    (
      await request.post("/api/auth/login", {
        data: { email: "chioma@kinsous.com", password: "KinSous2024!" },
      })
    ).ok(),
  ).toBeTruthy();
  const helper = await playwright.request.newContext({
    baseURL: "http://localhost:3100",
  });
  const anonymous = await playwright.request.newContext({
    baseURL: "http://localhost:3100",
  });
  try {
    expect((await anonymous.get("/api/orders")).status()).toBe(401);
    expect(
      (
        await helper.post("/api/auth/login", {
          data: { email: "amara@kinsous.com", password: "KinSous2024!" },
        })
      ).ok(),
    ).toBeTruthy();
    const created = await request.post("/api/bounties", {
      data: {
        title: "Fresh ingredients for dinner",
        description:
          "Please shop for vegetables and fresh ingredients for a family meal.",
        category: "GROCERY",
        budget: 5000,
        currency: "NGN",
        address: "10 Test Road",
        city: "Lagos",
        country: "Nigeria",
        tags: ["vegetables"],
      },
    });
    expect(created.status()).toBe(201);
    const bounty = (await created.json()).bounty;
    const outsider = await anonymous.get("/api/bounties/" + bounty.id);
    expect((await outsider.json()).bounty.address).toBeNull();
    const bidResponse = await helper.post(`/api/bounties/${bounty.id}/bids`, {
      data: {
        amount: 4500,
        message: "I can get these fresh from the market.",
        estimatedDeliveryMinutes: 60,
      },
    });
    expect(bidResponse.status()).toBe(201);
    const bid = (await bidResponse.json()).bid;
    const accepted = await request.post(
      `/api/bounties/${bounty.id}/bids/${bid.id}/accept`,
    );
    expect(accepted.ok()).toBeTruthy();
    const { conversationId } = await accepted.json();
    expect(conversationId).toBeTruthy();
    expect(
      (await helper.post(`/api/bounties/${bounty.id}/complete`)).status(),
    ).toBe(403);
    const clientId = crypto.randomUUID();
    const sent = await helper.post(
      `/api/messages/conversations/${conversationId}/messages`,
      {
        data: {
          type: "TEXT",
          content: "I will bring fresh vegetables.",
          clientId,
        },
      },
    );
    expect(sent.status()).toBe(201);
    const retry = await helper.post(
      `/api/messages/conversations/${conversationId}/messages`,
      {
        data: {
          type: "TEXT",
          content: "I will bring fresh vegetables.",
          clientId,
        },
      },
    );
    expect(retry.status()).toBe(201);
    expect((await retry.json()).message.id).toBe(
      (await sent.json()).message.id,
    );
    const thread = await request.get(
      `/api/messages/conversations/${conversationId}`,
    );
    expect(thread.ok()).toBeTruthy();
    expect(
      (await thread.json()).messages.filter(
        (m: { content: string }) =>
          m.content === "I will bring fresh vegetables.",
      ),
    ).toHaveLength(1);
    expect(
      (
        await anonymous.get(`/api/messages/conversations/${conversationId}`)
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.post("/api/bounties", {
          data: {
            title: "Another grocery request",
            description: "Valid description for a grocery request.",
            category: "GROCERY",
            budget: 5000,
            currency: "USD",
            city: "Lagos",
            country: "Nigeria",
          },
        })
      ).status(),
    ).toBe(400);
  } finally {
    await helper.dispose();
    await anonymous.dispose();
  }
});
