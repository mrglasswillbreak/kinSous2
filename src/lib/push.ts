import webPush, { PushSubscription } from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return false;
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushNotifications(
  subscriptions: PushSubscription[],
  payload: Record<string, unknown>,
) {
  if (!ensureConfigured() || subscriptions.length === 0) {
    return { invalidEndpoints: [] as string[] };
  }

  const invalidEndpoints: string[] = [];
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(subscription, JSON.stringify(payload), {
          timeout: 5000,
        });
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          invalidEndpoints.push(subscription.endpoint);
        } else {
          console.error("push send error", err);
        }
      }
    }),
  );

  return { invalidEndpoints };
}
