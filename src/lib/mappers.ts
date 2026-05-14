import type { Bounty, Profile } from "@/types";
import type { DbBounty, DbUser } from "@/lib/db";

/** Convert a DbBounty row (with joined seeker fields) to the app Bounty type */
export function dbBountyToAppBounty(b: DbBounty): Bounty {
  const seeker: Profile = {
    id: b.seeker_id,
    name: b.seeker_name,
    avatarUrl:
      b.seeker_avatar_url ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(b.seeker_id)}`,
    role: "SEEKER",
    location: {
      city: b.seeker_city || "Unknown",
      country: b.seeker_country || "Unknown",
      countryCode: "XX",
    },
    createdAt: b.created_at,
  };

  return {
    id: b.id,
    title: b.title,
    description: b.description,
    category: b.category as Bounty["category"],
    status: b.status as Bounty["status"],
    budget: Number(b.budget),
    currency: b.currency as Bounty["currency"],
    seeker,
    location: {
      address: b.address || "",
      city: b.city || "Unknown",
      country: b.country || "Unknown",
    },
    tags: b.tags ?? [],
    bids: [],
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

/** Convert a DbUser row to the app Profile type */
export function dbUserToProfile(u: DbUser): Profile {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    firstName: u.first_name,
    lastName: u.last_name,
    dateOfBirth: u.date_of_birth,
    gender: u.gender,
    avatarUrl:
      u.avatar_url ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(u.id)}`,
    role: u.role as Profile["role"],
    location: {
      city: u.city || "Unknown",
      country: u.country || "Unknown",
      countryCode: u.country_code || "XX",
    },
    bio: u.bio ?? undefined,
    createdAt: u.created_at,
  };
}
