import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileCard from "@/components/profile/ProfileCard";
import { getUserById } from "@/lib/db";
import { dbUserToProfile } from "@/lib/mappers";
import { mockHelpers } from "@/lib/mock-data";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Try DB first, fall back to mock for demo helpers
  const dbUser = await getUserById(id).catch(() => null);
  const name = dbUser?.name ?? mockHelpers.find((h) => h.id === id)?.name;
  return {
    title: name ? `${name} · Helper Profile · KinSous` : "Helper Profile · KinSous",
    description: name
      ? `View ${name}'s certifications, ratings, and active jobs.`
      : "View helper profile",
  };
}

export default async function HelperProfilePage({ params }: Props) {
  const { id } = await params;

  // Try to load from DB
  const dbUser = await getUserById(id).catch(() => null);
  if (dbUser) {
    const profile = dbUserToProfile(dbUser);
    return (
      <div className="pt-4 pb-24">
        <ProfileCard profile={profile} />
      </div>
    );
  }

  // Fall back to mock helpers (demo data)
  const mockHelper = mockHelpers.find((h) => h.id === id);
  if (!mockHelper) notFound();

  return (
    <div className="pt-4 pb-24">
      <ProfileCard profile={mockHelper} />
    </div>
  );
}
