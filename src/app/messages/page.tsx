import ConversationList from "@/components/messages/ConversationList";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Messages · KinSous",
  description: "Your conversations with helpers and seekers",
};

export default function MessagesPage() {
  return (
    <div className="pt-4">
      <Suspense fallback={null}>
        <ConversationList />
      </Suspense>
    </div>
  );
}
