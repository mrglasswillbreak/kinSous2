import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Flame, Map, MapPin, MessageCircle, Shield, Star, Video } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/mock-data";
import { getHomePageData } from "@/lib/server-data";

const features = [
  { icon: Flame, title: "Bounty Board", description: "Post food requests and get bids from local culinary helpers", href: "/bounties", color: "bg-primary-50 text-primary-500" },
  { icon: Video, title: "Live Calls", description: "Message, audio, or video chat after a bidder is selected", href: "/bounties", color: "bg-blue-50 text-blue-600" },
  { icon: Shield, title: "Secure Escrow", description: "Funds held safely until you confirm your order", href: "/payment", color: "bg-secondary-50 text-secondary-500" },
  { icon: MapPin, title: "Live Tracking", description: "Follow your helper's real-time location", href: "/tracker", color: "bg-purple-50 text-purple-600" },
  { icon: MessageCircle, title: "Contacts", description: "Chat with helpers and manage your orders", href: "/contacts", color: "bg-indigo-50 text-indigo-600" },
  { icon: Map, title: "Tracker", description: "Real-time delivery tracking with live map", href: "/tracker", color: "bg-teal-50 text-teal-600" },
].slice(0, 4);

export const revalidate = 60;

export default async function HomePage() {
  const { recentBounties, topHelpers } = await getHomePageData();
  const ratedHelpers = topHelpers.filter((helper) => helper.helperStats?.averageRating !== undefined);
  const avgHelperRating = ratedHelpers.length
    ? (
        ratedHelpers.reduce(
          (sum, helper) => sum + (helper.helperStats?.averageRating ?? 0),
          0
        ) / ratedHelpers.length
      ).toFixed(1)
    : "N/A";

  return (
    <div className="mx-auto max-w-md pb-24 lg:max-w-5xl lg:pb-10">
      <div className="relative overflow-hidden px-5 pb-8 pt-12 lg:mx-4 lg:mt-6 lg:rounded-3xl lg:pb-12 lg:pt-14">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-background to-secondary-50 lg:rounded-3xl" />

        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-primary">
                <Flame size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-charcoal">KinSous</h1>
                <p className="text-xs text-muted">FolkProvidr</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold leading-tight text-charcoal lg:text-4xl">
              Taste Your <span className="text-primary">Heritage,</span>
              <br />Wherever You Are
            </h2>
            <p className="mt-2 leading-relaxed text-muted lg:text-base">
              Connect with local culinary helpers for authentic West African food experiences — from Lagos to Atlanta.
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/bounties"
                className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-transform active:scale-95"
              >
                Post a Bounty <ArrowRight size={16} />
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-2xl border border-card-border bg-card px-5 py-2.5 text-sm font-semibold text-charcoal shadow-card transition-transform active:scale-95"
              >
                Become a Helper
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="space-y-4 rounded-3xl border border-card-border bg-card p-6 shadow-card">
              {[
                { value: `${recentBounties.length}`, label: "Recent Bounties", emoji: "🍽️" },
                { value: `${topHelpers.length}`, label: "Active Helpers", emoji: "👨‍🍳" },
                { value: avgHelperRating === "N/A" ? "N/A" : `${avgHelperRating}★`, label: "Avg Helper Rating", emoji: "⭐" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-card-border bg-subtle p-3"
                >
                  <span className="text-2xl">{stat.emoji}</span>
                  <div>
                    <p className="text-2xl font-bold leading-none text-charcoal">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 flex items-center justify-around rounded-3xl border border-card-border bg-card p-4 shadow-card lg:hidden">
        {[
          { value: `${recentBounties.length}`, label: "Recent Bounties" },
          { value: `${topHelpers.length}`, label: "Active Helpers" },
          { value: avgHelperRating === "N/A" ? "N/A" : `${avgHelperRating}★`, label: "Avg Rating" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-xl font-bold text-charcoal">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 px-4">
        <h3 className="mb-3 text-lg font-bold text-charcoal">How It Works</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="h-full rounded-3xl border border-card-border bg-card p-4 shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${feature.color}`}>
                <feature.icon size={20} />
              </div>
              <p className="text-sm font-bold text-charcoal">{feature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4 lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-charcoal">Recent Bounties</h3>
            <Link href="/bounties" className="flex items-center gap-1 text-sm font-semibold text-primary">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentBounties.length === 0 ? (
              <div className="rounded-2xl border border-card-border bg-card p-4 text-center shadow-card">
                <p className="text-sm font-semibold text-charcoal">No bounties yet</p>
                <p className="mt-1 text-xs text-muted">Be the first to post one.</p>
              </div>
            ) : (
              recentBounties.map((bounty) => (
                <Link
                  key={bounty.id}
                  href={`/bounties/${bounty.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3 shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
                >
                  <Image
                    src={bounty.seeker.avatarUrl}
                    alt={bounty.seeker.name}
                    width={40}
                    height={40}
                    unoptimized={bounty.seeker.avatarUrl.startsWith("data:")}
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal">{bounty.title}</p>
                    <p className="text-xs text-muted">
                      {bounty.location.city} · {timeAgo(bounty.createdAt)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-secondary-700">
                    {formatCurrency(bounty.budget, bounty.currency)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 lg:mt-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-charcoal">Top Helpers</h3>
            <Link href="/helpers" className="flex items-center gap-1 text-sm font-semibold text-primary">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex -mx-4 gap-3 overflow-x-auto px-4 pb-2 lg:hidden" style={{ scrollbarWidth: "none" }}>
            {topHelpers.length === 0 ? (
              <div className="min-w-full rounded-2xl border border-card-border bg-card p-4 text-center shadow-card">
                <p className="text-sm font-semibold text-charcoal">No helpers yet</p>
                <p className="mt-1 text-xs text-muted">New helpers will appear here.</p>
              </div>
            ) : (
              topHelpers.map((helper) => (
                <Link
                  key={helper.id}
                  href={`/helpers/${helper.id}`}
                  className="w-44 flex-shrink-0 rounded-3xl border border-card-border bg-card p-4 text-center shadow-card transition active:scale-[0.98]"
                >
                  <Image
                    src={helper.avatarUrl}
                    alt={helper.name}
                    width={56}
                    height={56}
                    unoptimized={helper.avatarUrl.startsWith("data:")}
                    className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-primary-100"
                  />
                  <p className="mt-2 truncate text-sm font-bold text-charcoal">{helper.name}</p>
                  <p className="text-xs text-muted">{helper.location.city}</p>
                  {helper.helperStats ? (
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-charcoal">
                        {helper.helperStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted">
                        ({helper.helperStats.completedOrders})
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted">New Helper</p>
                  )}
                  {helper.chefScore && (
                    <div className="mt-2 inline-block rounded-full bg-primary-50 px-2 py-0.5">
                      <span className="text-xs font-bold text-primary">🔥 {helper.chefScore}</span>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
          <div className="hidden grid-cols-2 gap-3 lg:grid">
            {topHelpers.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-card-border bg-card p-4 text-center shadow-card">
                <p className="text-sm font-semibold text-charcoal">No helpers yet</p>
                <p className="mt-1 text-xs text-muted">New helpers will appear here.</p>
              </div>
            ) : (
              topHelpers.map((helper) => (
                <Link
                  key={helper.id}
                  href={`/helpers/${helper.id}`}
                  className="flex items-center gap-3 rounded-3xl border border-card-border bg-card p-4 shadow-card transition hover:shadow-card-hover active:scale-[0.98]"
                >
                  <Image
                    src={helper.avatarUrl}
                    alt={helper.name}
                    width={48}
                    height={48}
                    unoptimized={helper.avatarUrl.startsWith("data:")}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-2 ring-primary-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-charcoal">{helper.name}</p>
                    <p className="text-xs text-muted">{helper.location.city}</p>
                    {helper.helperStats ? (
                      <div className="mt-1 flex items-center gap-1">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-charcoal">
                          {helper.helperStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted">
                          ({helper.helperStats.completedOrders})
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted">New Helper</p>
                    )}
                  </div>
                  {helper.chefScore && (
                    <div className="rounded-full bg-primary-50 px-2 py-0.5">
                      <span className="text-xs font-bold text-primary">🔥 {helper.chefScore}</span>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
