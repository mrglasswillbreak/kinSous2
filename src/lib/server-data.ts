import { unstable_cache } from "next/cache";
import { getBounties, getHelpers } from "@/lib/db";
import { dbBountyToAppBounty, dbUserToProfile } from "@/lib/mappers";

export const CACHE_TAGS = {
  bounties: "bounties",
  helpers: "helpers",
} as const;

export const HOME_PAGE_REVALIDATE_SECONDS = 60;

const getCachedRecentBounties = unstable_cache(
  async () => {
    const bounties = await getBounties();
    return bounties.slice(0, 3).map(dbBountyToAppBounty);
  },
  ["home-recent-bounties"],
  { revalidate: HOME_PAGE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.bounties] }
);

const getCachedTopHelpers = unstable_cache(
  async () => {
    const helpers = await getHelpers();
    return helpers.slice(0, 5).map(dbUserToProfile);
  },
  ["home-top-helpers"],
  { revalidate: HOME_PAGE_REVALIDATE_SECONDS, tags: [CACHE_TAGS.helpers] }
);

export async function getHomePageData() {
  const [recentBounties, topHelpers] = await Promise.all([
    getCachedRecentBounties(),
    getCachedTopHelpers(),
  ]);

  return { recentBounties, topHelpers };
}
