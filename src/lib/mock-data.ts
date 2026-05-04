import type { Profile, Bounty, Bid, DeliveryTracking } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const mockHelpers: Profile[] = [
  {
    id: "helper-1",
    name: "Amara Okafor",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    role: "HELPER",
    location: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    bio: "Certified chef with 8 years experience in West African cuisine.",
    chefScore: 92,
    certificationBadges: [
      {
        id: "cert-1",
        name: "ServSafe Food Handler",
        issuer: "National Restaurant Association",
        issuedAt: "2023-01-15",
        expiresAt: "2026-01-15",
      },
      {
        id: "cert-2",
        name: "Culinary Arts Diploma",
        issuer: "Lagos Culinary Institute",
        issuedAt: "2018-06-01",
      },
    ],
    helperStats: {
      completedOrders: 234,
      averageRating: 4.9,
      totalEarnings: 1850000,
      currency: "NGN",
    },
    createdAt: "2022-03-10T00:00:00Z",
  },
  {
    id: "helper-2",
    name: "Marcus DeLeon",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    role: "HELPER",
    location: { city: "Houston", country: "United States", countryCode: "US" },
    bio: "Specializing in Tex-Mex and Caribbean fusion. Former restaurant owner.",
    chefScore: 87,
    certificationBadges: [
      {
        id: "cert-3",
        name: "HACCP Certification",
        issuer: "NSF International",
        issuedAt: "2022-09-01",
        expiresAt: "2025-09-01",
      },
    ],
    helperStats: {
      completedOrders: 156,
      averageRating: 4.7,
      totalEarnings: 12400,
      currency: "USD",
    },
    createdAt: "2022-07-22T00:00:00Z",
  },
];

// ── Seekers ───────────────────────────────────────────────────────────────────

export const mockSeekers: Profile[] = [
  {
    id: "seeker-1",
    name: "Chioma Nwosu",
    avatarUrl: "https://i.pravatar.cc/150?img=23",
    role: "SEEKER",
    location: { city: "Abuja", country: "Nigeria", countryCode: "NG" },
    createdAt: "2023-01-05T00:00:00Z",
  },
  {
    id: "seeker-2",
    name: "David Park",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    role: "SEEKER",
    location: { city: "Atlanta", country: "United States", countryCode: "US" },
    createdAt: "2023-04-18T00:00:00Z",
  },
  {
    id: "seeker-3",
    name: "Fatima Al-Hassan",
    avatarUrl: "https://i.pravatar.cc/150?img=38",
    role: "SEEKER",
    location: { city: "Kano", country: "Nigeria", countryCode: "NG" },
    createdAt: "2023-06-10T00:00:00Z",
  },
];

// ── Bids ──────────────────────────────────────────────────────────────────────

export const mockBids: Bid[] = [
  {
    id: "bid-1",
    bountyId: "bounty-1",
    helper: mockHelpers[0],
    amount: 4500,
    currency: "NGN",
    message:
      "I know exactly where to find fresh ugu leaves and stockfish in Wuse market. Can be there in 45 mins!",
    estimatedDeliveryMinutes: 45,
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "bid-2",
    bountyId: "bounty-1",
    helper: mockHelpers[1],
    amount: 5200,
    currency: "NGN",
    message:
      "Happy to help! I can source everything from Garki market and have it fresh.",
    estimatedDeliveryMinutes: 60,
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
];

// ── Bounties ──────────────────────────────────────────────────────────────────

export const mockBounties: Bounty[] = [
  {
    id: "bounty-1",
    title: "Need fresh ingredients for Egusi Soup",
    description:
      "Looking for someone to source fresh ugu leaves, stockfish, and palm oil from a reputable market vendor. Must be fresh – cooking for a family gathering this evening.",
    category: "INGREDIENT_SOURCING",
    status: "OPEN",
    budget: 6000,
    currency: "NGN",
    seeker: mockSeekers[0],
    location: {
      address: "Wuse Zone 4, Abuja",
      city: "Abuja",
      country: "Nigeria",
      lat: 9.0765,
      lng: 7.3986,
    },
    tags: ["egusi", "soup", "fresh-ingredients", "west-african"],
    imageUrls: [
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400",
    ],
    bids: mockBids,
    createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "bounty-2",
    title: "Authentic jollof rice cooking lesson via video",
    description:
      "Party of 12 coming this weekend. Need a Nigerian chef to walk me through making party jollof rice on a big stove. Will pay for 2-hour FaceTime session.",
    category: "COOKING",
    status: "OPEN",
    budget: 45,
    currency: "USD",
    seeker: mockSeekers[1],
    location: {
      address: "Atlanta, GA",
      city: "Atlanta",
      country: "United States",
      lat: 33.749,
      lng: -84.388,
    },
    tags: ["jollof-rice", "cooking-lesson", "Nigerian", "party-food"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "bounty-3",
    title: "Suya spice mix – need original toh-bak recipe",
    description:
      "My grandma used to make suya in Kano but I lost the recipe. Looking for an experienced suya maker to share the authentic toh-bak spice proportions via chat.",
    category: "RECIPE_HELP",
    status: "OPEN",
    budget: 2000,
    currency: "NGN",
    seeker: mockSeekers[2],
    location: {
      address: "Bompai Road, Kano",
      city: "Kano",
      country: "Nigeria",
      lat: 12.0022,
      lng: 8.5919,
    },
    tags: ["suya", "kano", "spice-mix", "recipe", "northern-nigeria"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: "bounty-4",
    title: "Catering for 50-person Eid al-Fitr celebration",
    description:
      "Need an experienced caterer for our Eid gathering. Menu should include masa, miyan kuka, tuwo shinkafa, and assorted meats. Event is in 10 days.",
    category: "CATERING",
    status: "OPEN",
    budget: 180000,
    currency: "NGN",
    seeker: mockSeekers[0],
    location: {
      address: "Maitama, Abuja",
      city: "Abuja",
      country: "Nigeria",
      lat: 9.0825,
      lng: 7.4766,
    },
    tags: ["catering", "eid", "hausa-cuisine", "event", "large-party"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "bounty-5",
    title: "Source plantains + scotch bonnet from Caribbean market",
    description:
      "Need someone to pick up ripe plantains, scotch bonnet peppers, and oxtail from the Caribbean market on Buford Hwy. I'll Venmo immediately on confirmation.",
    category: "GROCERY",
    status: "IN_PROGRESS",
    budget: 35,
    currency: "USD",
    seeker: mockSeekers[1],
    location: {
      address: "Buford Highway, Atlanta",
      city: "Atlanta",
      country: "United States",
      lat: 33.8534,
      lng: -84.3136,
    },
    tags: ["plantains", "caribbean", "grocery", "oxtail"],
    bids: [
      {
        id: "bid-3",
        bountyId: "bounty-5",
        helper: mockHelpers[1],
        amount: 33,
        currency: "USD",
        message: "I live right by Buford Hwy, can grab everything in 30 mins!",
        estimatedDeliveryMinutes: 30,
        status: "ACCEPTED",
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
];

// ── Delivery Tracking ─────────────────────────────────────────────────────────

export const mockDeliveryTracking: DeliveryTracking = {
  bountyId: "bounty-5",
  helper: mockHelpers[1],
  currentStage: "IN_TRANSIT",
  steps: [
    {
      stage: "MARKET",
      label: "At Market",
      description: "Helper is shopping for your items",
      completedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      stage: "IN_TRANSIT",
      label: "In Transit",
      description: "Helper is on the way to you",
    },
    {
      stage: "ARRIVED",
      label: "Arrived",
      description: "Items delivered successfully",
    },
  ],
  helperLocation: {
    lat: 33.831,
    lng: -84.346,
    heading: 180,
    speed: 35,
    updatedAt: new Date().toISOString(),
  },
  estimatedArrivalMinutes: 12,
};

// ── Utilities ─────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatCurrency(amount: number, currency: "USD" | "NGN"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const categoryLabels: Record<string, string> = {
  GROCERY: "Grocery Run",
  COOKING: "Cooking Help",
  CATERING: "Catering",
  INGREDIENT_SOURCING: "Ingredient Sourcing",
  RECIPE_HELP: "Recipe Help",
  OTHER: "Other",
};

export const categoryColors: Record<string, string> = {
  GROCERY: "bg-green-100 text-green-800",
  COOKING: "bg-orange-100 text-orange-800",
  CATERING: "bg-purple-100 text-purple-800",
  INGREDIENT_SOURCING: "bg-yellow-100 text-yellow-800",
  RECIPE_HELP: "bg-blue-100 text-blue-800",
  OTHER: "bg-gray-100 text-gray-800",
};
