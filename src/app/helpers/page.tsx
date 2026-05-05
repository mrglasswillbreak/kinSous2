import HelpersPage from "@/components/profile/HelpersPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Helpers · KinSous",
  description: "Find verified culinary helpers near you",
};

export default function HelpersRoute() {
  return <div className="pt-4"><HelpersPage /></div>;
}
