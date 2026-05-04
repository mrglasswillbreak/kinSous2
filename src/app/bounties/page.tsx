import Feed from "@/components/feed/Feed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bounty Board · KinSous",
  description: "Browse and respond to culinary requests in your area",
};

export default function BountiesPage() {
  return <div className="pt-4"><Feed /></div>;
}
