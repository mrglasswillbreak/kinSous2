import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getBounties } from "@/lib/db";
import { dbBountyToAppBounty } from "@/lib/mappers";
import ProfileCard from "@/components/profile/ProfileCard";
import type { Metadata } from "next";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Profile · KinSous",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const dbUser = await getUserById(session.userId);
  if (!dbUser) redirect("/login");

  const profile: Profile = {
    id: dbUser.id,
    name: dbUser.name,
    avatarUrl:
      dbUser.avatar_url ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(dbUser.id)}`,
    role: dbUser.role as Profile["role"],
    location: {
      city: dbUser.city || "Unknown",
      country: dbUser.country || "Unknown",
      countryCode: dbUser.country_code || "XX",
    },
    bio: dbUser.bio ?? undefined,
    createdAt: dbUser.created_at,
  };

  // Fetch this user's own bounties from the real DB
  const dbBounties = await getBounties({ seekerId: dbUser.id }).catch(() => []);
  const liveBounties = dbBounties.map(dbBountyToAppBounty).slice(0, 5);

  return (
    <div className="pt-4 pb-24">
      <ProfileCard profile={profile} isCurrentUser liveBounties={liveBounties} />
    </div>
  );
}
