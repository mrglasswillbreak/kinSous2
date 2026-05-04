import Tracker from "@/components/tracker/Tracker";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Tracking · KinSous",
  description: "Track your helper in real-time",
};

export default function TrackerPage() {
  return <div className="pt-4"><Tracker /></div>;
}
