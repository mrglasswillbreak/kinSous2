import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileCard from "@/components/profile/ProfileCard";
import { mockHelpers } from "@/lib/mock-data";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const helper = mockHelpers.find((h) => h.id === params.id);
  return {
    title: helper ? `${helper.name} · Helper Profile · KinSous` : "Helper Profile · KinSous",
    description: helper
      ? `View ${helper.name}'s certifications, ratings, and active jobs.`
      : "View helper profile",
  };
}

export default function HelperProfilePage({ params }: Props) {
  const helper = mockHelpers.find((h) => h.id === params.id);
  if (!helper) notFound();

  return (
    <div className="pt-4 pb-24">
      <ProfileCard profile={helper} />
    </div>
  );
}
