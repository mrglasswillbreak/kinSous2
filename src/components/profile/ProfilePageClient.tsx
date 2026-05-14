"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { Bounty, Profile, UserRole } from "@/types";
import { formatCurrency } from "@/lib/mock-data";

interface ProfilePageClientProps {
  profile: Profile;
  liveBounties: Bounty[];
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  country: string;
  countryCode: string;
  avatarUrl: string;
  role: UserRole;
}

const COUNTRIES = [
  { name: "Nigeria", code: "NG" },
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Ghana", code: "GH" },
  { name: "Other", code: "XX" },
] as const;

const GENDER_OPTIONS = [
  { value: "", label: "Select" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

function fallbackAvatar(id: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`;
}

function formatJoinedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function getInitialForm(profile: Profile): ProfileForm {
  const [firstNameFallback = "", ...restName] = profile.name.split(" ");
  const country =
    profile.location.country === "Unknown" ? "" : profile.location.country;
  const countryRecord = COUNTRIES.find((item) => item.name === country);

  return {
    firstName: profile.firstName ?? firstNameFallback,
    lastName: profile.lastName ?? restName.join(" "),
    displayName: profile.name,
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    city: profile.location.city === "Unknown" ? "" : profile.location.city,
    country,
    countryCode: profile.location.countryCode || countryRecord?.code || "",
    avatarUrl: profile.avatarUrl.startsWith("https://i.pravatar.cc")
      ? ""
      : profile.avatarUrl,
    role: profile.role,
  };
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-charcoal">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ProfilePageClient({
  profile,
  liveBounties,
}: ProfilePageClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>(() => getInitialForm(profile));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const previewAvatar = form.avatarUrl || profile.avatarUrl || fallbackAvatar(profile.id);
  const activeBounties = liveBounties.filter(
    (bounty) => bounty.status === "OPEN" || bounty.status === "IN_PROGRESS"
  ).length;
  const completedBounties = liveBounties.filter(
    (bounty) => bounty.status === "COMPLETED"
  ).length;

  const profileCompleteness = useMemo(() => {
    const fields = [
      form.firstName,
      form.lastName,
      form.displayName,
      form.bio,
      form.phone || profile.email,
      form.city,
      form.country,
      form.avatarUrl || profile.avatarUrl,
    ];
    const complete = fields.filter(Boolean).length;
    return Math.round((complete / fields.length) * 100);
  }, [form, profile.email, profile.avatarUrl]);

  const set = (key: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess(false);
  };

  const handleCountryChange = (value: string) => {
    const country = COUNTRIES.find((item) => item.name === value);
    setForm((current) => ({
      ...current,
      country: value,
      countryCode: country?.code ?? "",
    }));
  };

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 750_000) {
      setError("Choose an image under 750 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        set("avatarUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const profileResponse = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: form.avatarUrl || null,
          bio: form.bio || null,
          city: form.city || null,
          country: form.country || null,
          countryCode: form.countryCode || null,
          dateOfBirth: form.dateOfBirth || null,
          firstName: form.firstName || null,
          gender: form.gender || null,
          lastName: form.lastName || null,
          name: form.displayName,
          phone: form.phone || null,
        }),
      });
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        setError(profileData.error || "Profile update failed.");
        return;
      }

      if (form.role !== profile.role) {
        const roleResponse = await fetch("/api/auth/update-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: form.role }),
        });
        const roleData = await roleResponse.json();

        if (!roleResponse.ok) {
          setError(roleData.error || "Role update failed.");
          return;
        }
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-card-border bg-input-surface px-3 py-2.5 text-sm text-charcoal placeholder:text-muted transition focus:outline-none focus:ring-2 focus:ring-primary-300";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-card">
          <div className="h-28 bg-gradient-to-br from-primary-400 via-primary to-secondary-600" />
          <div className="px-5 pb-5">
            <div className="-mt-12 flex flex-wrap items-end gap-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewAvatar}
                  alt={profile.name}
                  className="h-24 w-24 rounded-3xl object-cover ring-4 ring-card shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-charcoal shadow-sm"
                  aria-label="Upload profile picture"
                >
                  <Camera size={17} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold text-charcoal">
                    {profile.name}
                  </h1>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                    {profile.role}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <MapPin size={14} />
                  {profile.location.city}, {profile.location.country}
                </p>
              </div>

              <Link
                href="/settings"
                className="mb-1 flex items-center gap-2 rounded-2xl border border-card-border px-3 py-2 text-sm font-semibold text-charcoal transition hover:bg-subtle"
              >
                <Settings size={16} />
                Account Settings
              </Link>
            </div>

            {profile.bio && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charcoal">
                {profile.bio}
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Profile complete", value: `${profileCompleteness}%` },
                { label: "Active bounties", value: String(activeBounties) },
                { label: "Member since", value: formatJoinedDate(profile.createdAt) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-subtle p-4">
                  <p className="text-xl font-bold text-charcoal">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-card-border bg-card p-5 shadow-card">
            <h2 className="text-base font-bold text-charcoal">Account Snapshot</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-muted" />
                <span className="min-w-0 flex-1 truncate text-charcoal">
                  {profile.email ?? "No email added"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-muted" />
                <span className="min-w-0 flex-1 truncate text-charcoal">
                  {profile.phone ?? "No phone added"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-muted" />
                <span className="text-charcoal">
                  {profile.dateOfBirth ?? "Birthday not set"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck size={16} className="text-secondary-600" />
                <span className="text-charcoal">Session protected</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-card-border bg-card p-5 shadow-card">
            <h2 className="text-base font-bold text-charcoal">Activity</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-50 p-4">
                <p className="text-xl font-bold text-primary-700">
                  {liveBounties.length}
                </p>
                <p className="text-xs font-medium text-primary-700/75">
                  Total bounties
                </p>
              </div>
              <div className="rounded-2xl bg-secondary-50 p-4">
                <p className="text-xl font-bold text-secondary-700">
                  {completedBounties}
                </p>
                <p className="text-xs font-medium text-secondary-700/75">
                  Completed
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-card-border bg-card p-5 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-charcoal">Edit Profile</h2>
              <p className="mt-1 text-sm text-muted">
                Keep your public details current and trustworthy.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-primary transition disabled:opacity-60"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
                  Save Profile
                </>
              )}
            </motion.button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="First name">
              <input
                value={form.firstName}
                onChange={(event) => set("firstName", event.target.value)}
                className={inputCls}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name">
              <input
                value={form.lastName}
                onChange={(event) => set("lastName", event.target.value)}
                className={inputCls}
                autoComplete="family-name"
              />
            </Field>
            <Field label="Display name">
              <input
                value={form.displayName}
                onChange={(event) => set("displayName", event.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Phone number">
              <input
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                className={inputCls}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 555 123 4567"
              />
            </Field>
            <Field label="Date of birth">
              <input
                value={form.dateOfBirth}
                onChange={(event) => set("dateOfBirth", event.target.value)}
                className={inputCls}
                type="date"
              />
            </Field>
            <Field label="Gender">
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={(event) => set("gender", event.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(event) => set("city", event.target.value)}
                className={inputCls}
                placeholder="Lagos"
              />
            </Field>
            <Field label="Country">
              <div className="relative">
                <select
                  value={form.country}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  <option value="">Select</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
            </Field>
            <Field label="Profile picture URL">
              <div className="flex gap-2">
                <input
                  value={form.avatarUrl.startsWith("data:image/") ? "" : form.avatarUrl}
                  onChange={(event) => set("avatarUrl", event.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                  type="url"
                />
                <button
                  type="button"
                  onClick={() => set("avatarUrl", "")}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-card-border text-muted transition hover:bg-subtle"
                  aria-label="Remove profile picture"
                >
                  <X size={16} />
                </button>
              </div>
            </Field>
            <Field label="Account role">
              <div className="grid grid-cols-2 gap-2">
                {(["SEEKER", "HELPER"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, role }))}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-bold transition ${
                      form.role === role
                        ? "border-primary bg-primary-50 text-primary dark:bg-primary-900/20"
                        : "border-card-border text-charcoal hover:bg-subtle"
                    }`}
                  >
                    {role === "SEEKER" ? "Seeker" : "Helper"}
                  </button>
                ))}
              </div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Bio">
                <textarea
                  value={form.bio}
                  onChange={(event) => set("bio", event.target.value)}
                  className={`${inputCls} min-h-28 resize-none`}
                  maxLength={500}
                  placeholder="Share your food preferences, helper skills, favorite markets, or delivery notes."
                />
              </Field>
              <p className="mt-1.5 text-right text-xs text-muted">
                {form.bio.length}/500
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20">
              <X size={15} />
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20">
              <Check size={15} />
              Profile updated.
            </p>
          )}
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-card-border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-bold text-charcoal">
              <BadgeCheck size={17} className="text-primary" />
              Profile Quality
            </h2>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-badge">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              Complete profiles help helpers and seekers trust each other faster.
            </p>
          </div>

          <div className="rounded-3xl border border-card-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-charcoal">My Bounties</h2>
              <Link href="/bounties" className="text-xs font-bold text-primary">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {liveBounties.length === 0 ? (
                <div className="rounded-2xl bg-subtle p-4 text-center">
                  <p className="text-sm font-semibold text-charcoal">
                    No bounties yet
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Post a request to start getting bids.
                  </p>
                </div>
              ) : (
                liveBounties.slice(0, 4).map((bounty) => (
                  <Link
                    key={bounty.id}
                    href={`/bounties/${bounty.id}`}
                    className="block rounded-2xl bg-subtle p-3 transition hover:bg-badge"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-charcoal">
                          {bounty.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {bounty.status.replace("_", " ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-secondary-700">
                        {formatCurrency(bounty.budget, bounty.currency)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
