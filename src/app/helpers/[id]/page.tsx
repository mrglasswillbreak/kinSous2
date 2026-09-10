import { publicUser } from "@/lib/public-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileCard from "@/components/profile/ProfileCard";
import { getUserById, listHelperInteractionHistory } from "@/lib/db";
import { dbHelperHistoryToAppHistory, dbUserToProfile } from "@/lib/mappers";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dbUser = await getUserById(id).catch(() => null);
  const name = dbUser?.name;
  return {
    title: name ? `${name} · Helper Profile · KinSous` : "Helper Profile · KinSous",
    description: name
      ? `View ${name}'s certifications, ratings, and active jobs.`
      : "View helper profile",
  };
}

export default async function HelperProfilePage({ params }: Props) {
  const { id } = await params;
  const dbUser = await getUserById(id).catch(() => null);
  if (!dbUser) notFound();
  const profile = dbUserToProfile(publicUser(dbUser));
  const helperHistoryRows: Awaited<ReturnType<typeof listHelperInteractionHistory>> = [];
  const helperHistory = helperHistoryRows.map(dbHelperHistoryToAppHistory);

  return (
    <div className="pt-4 lg:pt-6 pb-24 lg:pb-10">
      <ProfileCard profile={profile} helperHistory={helperHistory} />
    </div>
  );
}
