import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getBounties } from "@/lib/db";
import { dbBountyToAppBounty, dbUserToProfile } from "@/lib/mappers";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile · KinSous",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const dbUser = await getUserById(session.userId);
  if (!dbUser) redirect("/login");

  const profile = dbUserToProfile(dbUser);

  // Fetch this user's own bounties from the real DB
  const dbBounties = await getBounties({ seekerId: dbUser.id }).catch(() => []);
  const liveBounties = dbBounties.map(dbBountyToAppBounty).slice(0, 5);

  return (
    <ProfilePageClient profile={profile} liveBounties={liveBounties} />
  );
}
