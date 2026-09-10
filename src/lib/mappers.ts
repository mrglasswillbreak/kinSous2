import type {
  Bid,
  Bounty,
  HelperInteractionHistoryItem,
  Profile,
} from "@/types";
import type {
  DbBid,
  DbBounty,
  DbHelperInteractionHistoryRow,
  DbUser,
} from "@/lib/db";

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
    bids: (b.bids ?? []).map(dbBidToAppBid),
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

/** Convert a DbBid row (with joined helper fields) to the app Bid type */
export function dbBidToAppBid(bid: DbBid): Bid {
  return {
    id: bid.id,
    bountyId: bid.bounty_id,
    helper: {
      id: bid.helper_id,

      name: bid.helper_name,
      firstName: bid.helper_first_name,
      lastName: bid.helper_last_name,

      avatarUrl:
        bid.helper_avatar_url ||
        `https://i.pravatar.cc/150?u=${encodeURIComponent(bid.helper_id)}`,
      role: bid.helper_role as Profile["role"],
      location: {
        city: bid.helper_city || "Unknown",
        country: bid.helper_country || "Unknown",
        countryCode: bid.helper_country_code || "XX",
      },
      bio: bid.helper_bio ?? undefined,
      createdAt: bid.helper_created_at,
    },
    amount: Number(bid.amount),
    currency: bid.currency as Bid["currency"],
    message: bid.message,
    estimatedDeliveryMinutes: bid.estimated_delivery_minutes,
    status: bid.status as Bid["status"],
    createdAt: bid.created_at,
  };
}

/** Convert a DbUser row to the app Profile type */
export function dbUserToProfile(u: DbUser): Profile {
  const completedOrders = Number(u.completed_orders ?? 0);
  const averageRating = Number(u.average_rating ?? 0);
  const totalReviews = Number(u.total_reviews ?? 0);
  const ratingPercentage = Number(
    u.rating_percentage ?? (averageRating > 0 ? (averageRating / 5) * 100 : 0),
  );
  const totalEarningsNgn = Number(
    u.total_earnings_ngn ??
      (u.earnings_currency === "NGN" ? (u.total_earnings ?? 0) : 0),
  );
  const totalEarningsUsd = Number(
    u.total_earnings_usd ??
      (u.earnings_currency === "USD" ? (u.total_earnings ?? 0) : 0),
  );
  const earningsCurrency = u.earnings_currency === "USD" ? "USD" : "NGN";
  const totalEarnings =
    earningsCurrency === "USD" ? totalEarningsUsd : totalEarningsNgn;
  const hasStats = u.role === "HELPER";

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
      u.avatar_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(u.id)}`,
    role: u.role as Profile["role"],
    location: {
      city: u.city || "Unknown",
      country: u.country || "Unknown",
      countryCode: u.country_code || "XX",
    },
    bio: u.bio ?? undefined,
    helperStats: hasStats
      ? {
          completedOrders,
          averageRating,
          ratingPercentage,
          totalReviews,
          totalEarnings,
          currency: earningsCurrency,
          earningsByCurrency: {
            NGN: totalEarningsNgn,
            USD: totalEarningsUsd,
          },
        }
      : undefined,
    chefScore:
      u.role === "HELPER" && ratingPercentage > 0
        ? Math.min(100, Math.round(ratingPercentage))
        : undefined,
    createdAt: u.created_at,
  };
}

export function dbHelperHistoryToAppHistory(
  row: DbHelperInteractionHistoryRow,
): HelperInteractionHistoryItem {
  return {
    bountyId: row.bounty_id,
    bountyTitle: row.bounty_title,
    bountyStatus: row.bounty_status as Bounty["status"],
    city: row.city || "Unknown",
    country: row.country || "Unknown",
    acceptedAmount: Number(row.accepted_amount),
    currency: (row.currency === "USD"
      ? "USD"
      : "NGN") as HelperInteractionHistoryItem["currency"],
    interactedAt: row.interacted_at,
    reviewCompleted: Boolean(row.review_id),
    reviewRating: row.review_rating ?? undefined,
    reviewComment: row.review_comment ?? undefined,
    reviewCreatedAt: row.review_created_at ?? undefined,
  };
}
