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
  totalEarnings: number;
  currency: "USD" | "NGN";
}

export interface Profile {
  id: string;
  name: string;
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
