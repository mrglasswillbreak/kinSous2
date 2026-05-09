import Settings from "@/components/ui/Settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings · KinSous",
};

export default function SettingsPage() {
  return <div className="pt-4"><Settings /></div>;
}
