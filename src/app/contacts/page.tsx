import MessagesShell from "@/components/messages/MessagesShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts · KinSous",
  description: "Your contacts and active conversations",
};

export default function ContactsPage() {
  return (
    <div className="pt-4">
      <MessagesShell />
    </div>
  );
}
