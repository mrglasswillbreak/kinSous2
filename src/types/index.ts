// ─── Core TypeScript Types ────────────────────────────────────────────────────

export type UserRole = "SEEKER" | "HELPER";

export interface CertificationBadge {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
}

export interface HelperStats {
  completedOrders: number;
  averageRating: number;
  ratingPercentage?: number;
  totalReviews?: number;
  totalEarnings: number;
  currency: "USD" | "NGN";
}

export interface HelperInteractionHistoryItem {
  bountyId: string;
  bountyTitle: string;
  bountyStatus: BountyStatus;
  city: string;
  country: string;
  acceptedAmount: number;
  currency: "USD" | "NGN";
  interactedAt: string;
  reviewCompleted: boolean;
  reviewRating?: number;
  reviewComment?: string;
  reviewCreatedAt?: string;
}

export interface Profile {
  id: string;
  email?: string | null;
  phone?: string | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  avatarUrl: string;
  role: UserRole;
  location: { city: string; country: string; countryCode: string };
  bio?: string;
  chefScore?: number;
  certificationBadges?: CertificationBadge[];
  helperStats?: HelperStats;
  createdAt: string;
}

export type BountyStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "INCOMPLETE"
  | "CANCELLED";

export type BountyCategory =
  | "GROCERY"
  | "COOKING"
  | "CATERING"
  | "INGREDIENT_SOURCING"
  | "RECIPE_HELP"
  | "OTHER";

export interface BountyLocation {
  address: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface Bid {
  id: string;
  bountyId: string;
  helper: Profile;
  amount: number;
  currency: "USD" | "NGN";
  message: string;
  estimatedDeliveryMinutes: number;
  status: BidStatus;
  createdAt: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: BountyCategory;
  status: BountyStatus;
  budget: number;
  currency: "USD" | "NGN";
  seeker: Profile;
  location: BountyLocation;
  tags: string[];
  imageUrls?: string[];
  bids?: Bid[];
  createdAt: string;
  updatedAt: string;
}

export type ChatMessageType = "TEXT" | "SNAPSHOT" | "SYSTEM";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  type: ChatMessageType;
  content: string;
  createdAt: string;
}

export type DeliveryStage = "MARKET" | "IN_TRANSIT" | "ARRIVED";

export interface DeliveryStep {
  stage: DeliveryStage;
  label: string;
  description: string;
  completedAt?: string;
}

export interface HelperLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface DeliveryTracking {
  bountyId: string;
  helper: Profile;
  currentStage: DeliveryStage;
  steps: DeliveryStep[];
  helperLocation?: HelperLocation;
  estimatedArrivalMinutes?: number;
}

export type PaymentProvider = "STRIPE" | "FLUTTERWAVE";
export type PaymentStatus =
  | "IDLE"
  | "PENDING"
  | "ESCROWED"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export interface PaymentEscrow {
  id: string;
  bountyId: string;
  amount: number;
  currency: "USD" | "NGN";
  provider: PaymentProvider;
  status: PaymentStatus;
  seekerId: string;
  helperId?: string;
  stripePaymentIntentId?: string;
  flutterwaveTransactionId?: string;
  createdAt: string;
  releasedAt?: string;
}

export interface InitializeEscrowParams {
  bountyId: string;
  amount: number;
  currency: "USD" | "NGN";
  seekerId: string;
  helperId: string;
}

export interface UsePaymentEscrowReturn {
  escrow: PaymentEscrow | null;
  isLoading: boolean;
  error: Error | null;
  initializeEscrow: (params: InitializeEscrowParams) => Promise<void>;
  releaseEscrow: (bountyId: string) => Promise<void>;
  refundEscrow: (bountyId: string) => Promise<void>;
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export type DirectMessageType = "TEXT" | "IMAGE" | "SYSTEM";

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  type: DirectMessageType;
  content: string;
  read: boolean;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Conversation {
  id: string;
  participants: [Profile, Profile];
  bountyRef?: { id: string; title: string };
  lastMessage: DirectMessage;
  unreadCount: number;
  updatedAt: string;
  blockedByMe?: boolean;
  blockedByOther?: boolean;
}

export type PresenceStatus = "ONLINE" | "AWAY" | "OFFLINE";

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: string;
}

export interface ConversationTyping {
  userId: string;
  isTyping: boolean;
  updatedAt: string;
}

export type NotificationType =
  | "NEW_BID"
  | "BID_ACCEPTED"
  | "PAYMENT_ESCROWED"
  | "DELIVERY_UPDATE"
  | "NEW_MESSAGE"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  avatarUrl?: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  bountyId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
