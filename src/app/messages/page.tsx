import ConversationList from "@/components/messages/ConversationList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages · KinSous",
  description: "Your conversations with helpers and seekers",
};

export default function MessagesPage() {
  return (
    <div className="pt-4">
      <ConversationList />
    </div>
  );
}
