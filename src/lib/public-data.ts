import type { DbUser, DbBid, DbBounty } from "./db";
export function publicUser(user: DbUser): DbUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    bio: user.bio,
    city: user.city,
    country: user.country,
    country_code: user.country_code,
    created_at: user.created_at,
    email: null,
    phone: null,
    first_name: null,
    last_name: null,
    date_of_birth: null,
    gender: null,
    completed_orders: user.completed_orders,
    average_rating: user.average_rating,
    rating_percentage: user.rating_percentage,
    total_reviews: user.total_reviews,
  };
}
export function publicBid(bid: DbBid): DbBid {
  return {
    ...bid,
    helper_email: null,
    helper_phone: null,
    helper_date_of_birth: null,
    helper_gender: null,
    helper_first_name: null,
    helper_last_name: null,
  };
}
export function publicBounty(bounty: DbBounty, userId?: string): DbBounty {
  const participant =
    bounty.seeker_id === userId ||
    bounty.bids?.some((b) => b.status === "ACCEPTED" && b.helper_id === userId);
  return {
    ...bounty,
    address: participant ? bounty.address : null,
    bids: bounty.bids?.map(publicBid),
  };
}
