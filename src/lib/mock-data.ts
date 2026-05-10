import type { Profile, Bounty, Bid, DeliveryTracking, Conversation, DirectMessage, Review } from "@/types";

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
  {
    id: "helper-3",
    name: "Ngozi Eze",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    role: "HELPER",
    location: { city: "Port Harcourt", country: "Nigeria", countryCode: "NG" },
    bio: "Niger Delta cuisine specialist — banga soup, fisherman stew, and native soups done right.",
    chefScore: 95,
    certificationBadges: [
      {
        id: "cert-4",
        name: "Food Safety Level 2",
        issuer: "NAFDAC Nigeria",
        issuedAt: "2021-11-10",
        expiresAt: "2024-11-10",
      },
      {
        id: "cert-5",
        name: "Catering Management Diploma",
        issuer: "Rivers State Culinary College",
        issuedAt: "2019-07-01",
      },
    ],
    helperStats: {
      completedOrders: 412,
      averageRating: 5.0,
      totalEarnings: 3200000,
      currency: "NGN",
    },
    createdAt: "2021-09-15T00:00:00Z",
  },
  {
    id: "helper-4",
    name: "Damilola Adeyemi",
    avatarUrl: "https://i.pravatar.cc/150?img=14",
    role: "HELPER",
    location: { city: "Abuja", country: "Nigeria", countryCode: "NG" },
    bio: "Abuja market expert. I know every stall in Wuse, Garki, and Utako markets. Fast, reliable sourcing.",
    chefScore: 81,
    certificationBadges: [
      {
        id: "cert-6",
        name: "ServSafe Manager",
        issuer: "National Restaurant Association",
        issuedAt: "2023-03-20",
        expiresAt: "2028-03-20",
      },
    ],
    helperStats: {
      completedOrders: 89,
      averageRating: 4.6,
      totalEarnings: 720000,
      currency: "NGN",
    },
    createdAt: "2023-02-01T00:00:00Z",
  },
  {
    id: "helper-5",
    name: "Toluwalope Fashola",
    avatarUrl: "https://i.pravatar.cc/150?img=56",
    role: "HELPER",
    location: { city: "Atlanta", country: "United States", countryCode: "US" },
    bio: "Nigerian-American home chef. Expert in Yoruba cuisine — efo riro, gbegiri, amala. Buford Hwy insider.",
    chefScore: 88,
    certificationBadges: [
      {
        id: "cert-7",
        name: "HACCP Certification",
        issuer: "NSF International",
        issuedAt: "2022-05-15",
        expiresAt: "2025-05-15",
      },
    ],
    helperStats: {
      completedOrders: 178,
      averageRating: 4.8,
      totalEarnings: 14900,
      currency: "USD",
    },
    createdAt: "2022-01-12T00:00:00Z",
  },
  {
    id: "helper-6",
    name: "Emeka Nwosu",
    avatarUrl: "https://i.pravatar.cc/150?img=61",
    role: "HELPER",
    location: { city: "London", country: "United Kingdom", countryCode: "GB" },
    bio: "Igbo cuisine ambassador in London. Ofe onugbu, oha soup, and fresh ukwa sourced from Peckham.",
    chefScore: 84,
    certificationBadges: [
      {
        id: "cert-8",
        name: "Food Hygiene Level 3",
        issuer: "Highfield Qualifications UK",
        issuedAt: "2022-08-01",
        expiresAt: "2025-08-01",
      },
    ],
    helperStats: {
      completedOrders: 203,
      averageRating: 4.7,
      totalEarnings: 11600,
      currency: "USD",
    },
    createdAt: "2021-12-05T00:00:00Z",
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
  OTHER: "bg-badge text-charcoal",
};

// ── Conversations ──────────────────────────────────────────────────────────────

function makeMsg(
  id: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatarUrl: string,
  content: string,
  minutesAgo: number,
  read = true,
  type: DirectMessage["type"] = "TEXT",
): DirectMessage {
  return {
    id,
    conversationId,
    senderId,
    senderName,
    senderAvatarUrl,
    type,
    content,
    read,
    createdAt: new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString(),
  };
}

export const mockConversationMessages: Record<string, DirectMessage[]> = {
  "conv-1": [
    makeMsg("m1-1", "conv-1", "helper-1", "Amara Okafor", "https://i.pravatar.cc/150?img=47",
      "Hey! I saw your bounty for Egusi ingredients. I'm near Wuse market right now 🛒", 62),
    makeMsg("m1-2", "conv-1", "seeker-1", "Chioma Nwosu", "https://i.pravatar.cc/150?img=23",
      "Great! Can you get fresh ugu leaves and stockfish? They must be really fresh.", 58),
    makeMsg("m1-3", "conv-1", "helper-1", "Amara Okafor", "https://i.pravatar.cc/150?img=47",
      "Absolutely, I know the best vendor here. Give me about 30 minutes.", 55),
    makeMsg("m1-4", "conv-1", "seeker-1", "Chioma Nwosu", "https://i.pravatar.cc/150?img=23",
      "Perfect! What's your bid price?", 50),
    makeMsg("m1-5", "conv-1", "helper-1", "Amara Okafor", "https://i.pravatar.cc/150?img=47",
      "₦4,500 including transport. I'll send you a snapshot once I pick them up for your approval 📸", 45),
    makeMsg("m1-6", "conv-1", "seeker-1", "Chioma Nwosu", "https://i.pravatar.cc/150?img=23",
      "Sounds good, I'll accept your bid now!", 40),
    makeMsg("m1-7", "conv-1", "helper-1", "Amara Okafor", "https://i.pravatar.cc/150?img=47",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400", 15, false, "IMAGE"),
    makeMsg("m1-8", "conv-1", "helper-1", "Amara Okafor", "https://i.pravatar.cc/150?img=47",
      "Here are the ugu leaves — super fresh! And the stockfish looks great too. Approve?", 14, false),
  ],
  "conv-2": [
    makeMsg("m2-1", "conv-2", "seeker-2", "David Park", "https://i.pravatar.cc/150?img=12",
      "Hi Marcus! I need help with a jollof rice cooking lesson for 12 people this weekend.", 120),
    makeMsg("m2-2", "conv-2", "helper-2", "Marcus DeLeon", "https://i.pravatar.cc/150?img=68",
      "Hey David! I'd love to help. Party jollof on a big stove is my specialty 🔥", 115),
    makeMsg("m2-3", "conv-2", "seeker-2", "David Park", "https://i.pravatar.cc/150?img=12",
      "Amazing! What does a 2-hour session cost?", 112),
    makeMsg("m2-4", "conv-2", "helper-2", "Marcus DeLeon", "https://i.pravatar.cc/150?img=68",
      "$45 for 2 hours via video. I'll guide you step by step — from the tomato base to the smoky finish.", 108),
    makeMsg("m2-5", "conv-2", "seeker-2", "David Park", "https://i.pravatar.cc/150?img=12",
      "Deal! What time works for you Saturday?", 100),
    makeMsg("m2-6", "conv-2", "helper-2", "Marcus DeLeon", "https://i.pravatar.cc/150?img=68",
      "Saturday 2pm CST works perfectly. I'll send the ingredient list tomorrow.", 95, false),
  ],
  "conv-3": [
    makeMsg("m3-1", "conv-3", "helper-5", "Toluwalope Fashola", "https://i.pravatar.cc/150?img=56",
      "Hi! I can pick up everything on your list from Buford Hwy within 30 mins 🏃‍♀️", 25),
    makeMsg("m3-2", "conv-3", "seeker-2", "David Park", "https://i.pravatar.cc/150?img=12",
      "Awesome, that would be perfect. Can you confirm you can get ripe plantains?", 22),
    makeMsg("m3-3", "conv-3", "helper-5", "Toluwalope Fashola", "https://i.pravatar.cc/150?img=56",
      "Yes! The Caribbean market on Buford always has perfect ripe ones. On my way now 🛒", 3, false),
  ],
};

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participants: [mockSeekers[0], mockHelpers[0]],
    bountyRef: { id: "bounty-1", title: "Need fresh ingredients for Egusi Soup" },
    lastMessage: mockConversationMessages["conv-1"][mockConversationMessages["conv-1"].length - 1],
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: "conv-2",
    participants: [mockSeekers[1], mockHelpers[1]],
    bountyRef: { id: "bounty-2", title: "Authentic jollof rice cooking lesson via video" },
    lastMessage: mockConversationMessages["conv-2"][mockConversationMessages["conv-2"].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "conv-3",
    participants: [mockSeekers[1], mockHelpers[4]],
    bountyRef: { id: "bounty-5", title: "Source plantains + scotch bonnet from Caribbean market" },
    lastMessage: mockConversationMessages["conv-3"][mockConversationMessages["conv-3"].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

// ── Reviews ───────────────────────────────────────────────────────────────────

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    bountyId: "bounty-5",
    authorId: "seeker-2",
    authorName: "David Park",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=12",
    targetId: "helper-2",
    rating: 5,
    comment: "Marcus was incredibly fast and found everything on my list. The plantains were perfectly ripe — will definitely hire again!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "rev-2",
    bountyId: "bounty-1",
    authorId: "seeker-1",
    authorName: "Chioma Nwosu",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=23",
    targetId: "helper-1",
    rating: 5,
    comment: "Amara knew exactly where to find the freshest ugu leaves. Sent me snapshots before buying — exactly what I needed for the family gathering.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "rev-3",
    bountyId: "bounty-2",
    authorId: "seeker-1",
    authorName: "Chioma Nwosu",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=23",
    targetId: "helper-1",
    rating: 4,
    comment: "Great cooking session! Learned so much about proper Egusi preparation. Only minor issue was a slight delay.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
];

// Current user for the demo (seeker-1 perspective)
export const currentUser = mockSeekers[0];
