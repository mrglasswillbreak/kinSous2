import { clearDrafts } from "./drafts";
export async function logout() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      const response = await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok)
        throw new Error("Could not detach notifications. Please retry logout.");
      await subscription.unsubscribe();
    }
  }
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) throw new Error("Logout failed. Please retry.");
  await clearDrafts();
}
