import ProfileCard from "@/components/profile/ProfileCard";
import { mockHelpers } from "@/lib/mock-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile · KinSous",
};

export default function ProfilePage() {
  return (
    <div className="pt-4 pb-24">
      <ProfileCard profile={mockHelpers[0]} />
    </div>
  );
}
