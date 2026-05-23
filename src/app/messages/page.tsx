import MessagesShell from "@/components/messages/MessagesShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages · KinSous",
  description: "Your conversations with helpers and seekers",
};

export default function MessagesPage() {
  return (
    <div className="pt-4">
      <MessagesShell />
    </div>
  );
}
