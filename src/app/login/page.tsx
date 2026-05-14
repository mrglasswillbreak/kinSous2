"use client";

import {
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";
type ContactMethod = "email" | "phone";
type RegisterStep = 0 | 1 | 2 | 3;

interface RegisterFormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactMethod: ContactMethod;
  email: string;
  phone: string;
  password: string;
}

type RegisterField = keyof RegisterFormState;
type RegisterErrors = Partial<Record<RegisterField | "form", string>>;
type UpdateRegisterField = <Field extends RegisterField>(
  field: Field,
  value: RegisterFormState[Field]
) => void;

const INITIAL_REGISTER_FORM: RegisterFormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  contactMethod: "email",
  email: "",
  phone: "",
  password: "",
};

const REGISTER_STEPS = [
  { title: "What's your name?" },
  { title: "Birthday and gender" },
  { title: "Contact info" },
  { title: "Create a password" },
] as const;

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_BIRTH_DATE = "1900-01-01";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMaxBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 13);
  return formatDateInput(date);
}

function calculateAge(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;

  const dob = new Date(year, month - 1, day);
  const isValidDate =
    dob.getFullYear() === year &&
    dob.getMonth() === month - 1 &&
    dob.getDate() === day;

  if (!isValidDate) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);

  if (!hasBirthdayPassed) age -= 1;
  return age;
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function validateRegisterForm(
  form: RegisterFormState,
  step?: RegisterStep
): RegisterErrors {
  const errors: RegisterErrors = {};
  const shouldValidate = (candidate: RegisterStep) =>
    step === undefined || step === candidate;

  if (shouldValidate(0)) {
    if (!form.firstName.trim()) {
      errors.firstName = "Enter your first name";
    }
    if (!form.lastName.trim()) {
      errors.lastName = "Enter your last name";
    }
  }

  if (shouldValidate(1)) {
    if (!form.dateOfBirth) {
      errors.dateOfBirth = "Enter your date of birth";
    } else {
      const age = calculateAge(form.dateOfBirth);
      if (age === null || age > 120) {
        errors.dateOfBirth = "Enter a valid date of birth";
      } else if (age < 13) {
        errors.dateOfBirth = "You must be at least 13 years old";
      }
    }

    if (!form.gender) {
      errors.gender = "Select a gender option";
    }
  }

  if (shouldValidate(2)) {
    if (form.contactMethod === "email") {
      if (!form.email.trim()) {
        errors.email = "Enter your email address";
      } else if (!EMAIL_PATTERN.test(form.email.trim())) {
        errors.email = "Enter a valid email address";
      }
    } else if (!form.phone.trim()) {
      errors.phone = "Enter your phone number";
    } else if (!isValidPhone(form.phone)) {
      errors.phone = "Enter a valid phone number";
    }
  }

  if (shouldValidate(3)) {
    if (!form.password) {
      errors.password = "Create a password";
    } else if (form.password.length < 8) {
      errors.password = "Use at least 8 characters";
    }
  }

  return errors;
}

function getFirstErrorStep(errors: RegisterErrors): RegisterStep {
  if (errors.firstName || errors.lastName) return 0;
  if (errors.dateOfBirth || errors.gender) return 1;
  if (errors.email || errors.phone) return 2;
  return 3;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-500">{message}</p>;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon: ReactNode;
  label: string;
  rightSlot?: ReactNode;
}

function TextField({
  className = "",
  error,
  icon,
  label,
  rightSlot,
  ...props
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-charcoal">
        {label}
      </span>
      <div
        className={`relative flex items-center rounded-2xl border bg-input-surface transition focus-within:ring-2 focus-within:ring-primary-300 ${
          error ? "border-red-300" : "border-card-border"
        }`}
      >
        <span className="pointer-events-none absolute left-3.5 text-muted">
          {icon}
        </span>
        <input
          {...props}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-2xl bg-transparent py-3 pl-10 text-sm text-charcoal placeholder:text-muted focus:outline-none ${
            rightSlot ? "pr-10" : "pr-4"
          } ${className}`}
        />
        {rightSlot}
      </div>
      <FieldError message={error} />
    </label>
  );
}

function PasswordField({
  autoComplete,
  error,
  label,
  minLength,
  onChange,
  onToggle,
  placeholder = "Password",
  showPassword,
  value,
}: {
  autoComplete: string;
  error?: string;
  label: string;
  minLength?: number;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder?: string;
  showPassword: boolean;
  value: string;
}) {
  return (
    <TextField
      autoComplete={autoComplete}
      error={error}
      icon={<Lock size={17} />}
      label={label}
      minLength={minLength}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required
      rightSlot={
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 text-muted transition hover:text-charcoal"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
      type={showPassword ? "text" : "password"}
      value={value}
    />
  );
}

function ContactFields({
  errors,
  form,
  onChange,
}: {
  errors: RegisterErrors;
  form: RegisterFormState;
  onChange: UpdateRegisterField;
}) {
  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-2 rounded-2xl border border-card-border bg-subtle p-1"
        role="tablist"
        aria-label="Contact method"
      >
        {(["email", "phone"] as ContactMethod[]).map((method) => (
          <button
            key={method}
            type="button"
            aria-selected={form.contactMethod === method}
            onClick={() => onChange("contactMethod", method)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              form.contactMethod === method
                ? "bg-card text-primary shadow-sm"
                : "text-muted hover:text-charcoal"
            }`}
          >
            {method === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>

      {form.contactMethod === "email" ? (
        <TextField
          autoComplete="email"
          error={errors.email}
          icon={<Mail size={17} />}
          label="Email address"
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={form.email}
        />
      ) : (
        <TextField
          autoComplete="tel"
          error={errors.phone}
          icon={<Phone size={17} />}
          inputMode="tel"
          label="Phone number"
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="+1 555 123 4567"
          required
          type="tel"
          value={form.phone}
        />
      )}
    </div>
  );
}

function GenderFields({
  error,
  value,
  onChange,
}: {
  error?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-charcoal">
        Gender
      </span>
      <div className="grid grid-cols-2 gap-2">
        {GENDER_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[46px] items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                selected
                  ? "border-primary bg-primary-50 text-primary dark:bg-primary-900/20"
                  : "border-card-border bg-input-surface text-charcoal hover:border-primary-200"
              }`}
            >
              <span>{option.label}</span>
              {selected && <Check size={16} />}
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function NameFields({
  errors,
  form,
  onChange,
}: {
  errors: RegisterErrors;
  form: RegisterFormState;
  onChange: UpdateRegisterField;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        autoComplete="given-name"
        error={errors.firstName}
        icon={<User size={17} />}
        label="First name"
        onChange={(event) => onChange("firstName", event.target.value)}
        placeholder="First name"
        required
        type="text"
        value={form.firstName}
      />
      <TextField
        autoComplete="family-name"
        error={errors.lastName}
        icon={<User size={17} />}
        label="Last name"
        onChange={(event) => onChange("lastName", event.target.value)}
        placeholder="Last name"
        required
        type="text"
        value={form.lastName}
      />
    </div>
  );
}

function BirthdayGenderFields({
  errors,
  form,
  maxBirthDate,
  onChange,
}: {
  errors: RegisterErrors;
  form: RegisterFormState;
  maxBirthDate: string;
  onChange: UpdateRegisterField;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        error={errors.dateOfBirth}
        icon={<Calendar size={17} />}
        label="Date of birth"
        max={maxBirthDate}
        min={MIN_BIRTH_DATE}
        onChange={(event) => onChange("dateOfBirth", event.target.value)}
        required
        type="date"
        value={form.dateOfBirth}
      />
      <GenderFields
        error={errors.gender}
        onChange={(value) => onChange("gender", value)}
        value={form.gender}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const maxBirthDate = getMaxBirthDate();
  const [tab, setTab] = useState<Tab>("login");
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(
    INITIAL_REGISTER_FORM
  );
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [registerStep, setRegisterStep] = useState<RegisterStep>(0);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/seed", { method: "POST" }).catch(() => {});
  }, []);

  const fillDemo = () => {
    setTab("login");
    setIdentifier("chioma@kinsous.com");
    setLoginPassword("KinSous2024!");
    setError("");
    setRegisterErrors({});
  };

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    setError("");
    setRegisterErrors({});
  };

  const updateRegisterField: UpdateRegisterField = (field, value) => {
    setRegisterForm((current) => ({ ...current, [field]: value }));
    setError("");
    setRegisterErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;

      if (field === "contactMethod") {
        delete next.email;
        delete next.phone;
      }

      return next;
    });
  };

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function submitRegistration() {
    const validationErrors = validateRegisterForm(registerForm);

    if (Object.keys(validationErrors).length > 0) {
      setRegisterErrors(validationErrors);
      setRegisterStep(getFirstErrorStep(validationErrors));
      setError("Please complete the highlighted fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function submitRegisterForm(event: React.FormEvent) {
    event.preventDefault();
    await submitRegistration();
  }

  const goToNextRegisterStep = () => {
    const validationErrors = validateRegisterForm(registerForm, registerStep);

    if (Object.keys(validationErrors).length > 0) {
      setRegisterErrors(validationErrors);
      setError("");
      return;
    }

    setRegisterErrors({});
    setError("");
    setRegisterStep((current) =>
      Math.min(current + 1, REGISTER_STEPS.length - 1) as RegisterStep
    );
  };

  const goToPreviousRegisterStep = () => {
    setError("");
    setRegisterErrors({});
    setRegisterStep((current) => Math.max(current - 1, 0) as RegisterStep);
  };

  const renderMobileRegisterStep = () => {
    switch (registerStep) {
      case 0:
        return (
          <NameFields
            errors={registerErrors}
            form={registerForm}
            onChange={updateRegisterField}
          />
        );
      case 1:
        return (
          <BirthdayGenderFields
            errors={registerErrors}
            form={registerForm}
            maxBirthDate={maxBirthDate}
            onChange={updateRegisterField}
          />
        );
      case 2:
        return (
          <ContactFields
            errors={registerErrors}
            form={registerForm}
            onChange={updateRegisterField}
          />
        );
      case 3:
        return (
          <PasswordField
            autoComplete="new-password"
            error={registerErrors.password}
            label="Password"
            minLength={8}
            onChange={(value) => updateRegisterField("password", value)}
            onToggle={() => setShowRegisterPassword((current) => !current)}
            placeholder="At least 8 characters"
            showPassword={showRegisterPassword}
            value={registerForm.password}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-background dark:to-gray-900" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full ${tab === "register" ? "max-w-4xl" : "max-w-sm"}`}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-primary">
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">KinSous</h1>
          <p className="mt-1 text-sm text-muted">
            Your Cultural Culinary Marketplace
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-card">
          <div className="flex border-b border-card-border">
            {(["login", "register"] as Tab[]).map((nextTab) => (
              <button
                key={nextTab}
                type="button"
                onClick={() => changeTab(nextTab)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === nextTab
                    ? "border-b-2 border-primary bg-primary-50 text-primary dark:bg-primary-900/20"
                    : "text-muted hover:text-charcoal"
                }`}
              >
                {nextTab === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={submitLogin}
                className="p-6 space-y-4"
              >
                <TextField
                  autoComplete="username"
                  icon={<Mail size={17} />}
                  label="Email or phone number"
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Email or phone number"
                  required
                  type="text"
                  value={identifier}
                />
                <PasswordField
                  autoComplete="current-password"
                  label="Password"
                  onChange={setLoginPassword}
                  onToggle={() =>
                    setShowLoginPassword((current) => !current)
                  }
                  showPassword={showLoginPassword}
                  value={loginPassword}
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500 dark:border-red-800 dark:bg-red-900/20"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-primary transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={submitRegisterForm}
                className="p-5 md:p-8"
              >
                <div className="md:hidden">
                  <div className="mb-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Step {registerStep + 1} of {REGISTER_STEPS.length}
                      </p>
                      <p className="text-xs font-semibold text-primary">
                        {Math.round(
                          ((registerStep + 1) / REGISTER_STEPS.length) * 100
                        )}
                        %
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-badge">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${
                            ((registerStep + 1) / REGISTER_STEPS.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-charcoal">
                      {REGISTER_STEPS[registerStep].title}
                    </h2>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={registerStep}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {renderMobileRegisterStep()}
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500 dark:border-red-800 dark:bg-red-900/20"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-6 flex gap-3">
                    {registerStep > 0 && (
                      <button
                        type="button"
                        onClick={goToPreviousRegisterStep}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-card-border text-charcoal transition hover:bg-subtle"
                        aria-label="Go back"
                      >
                        <ChevronLeft size={19} />
                      </button>
                    )}
                    {registerStep === REGISTER_STEPS.length - 1 ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-primary transition disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            Create Account
                            <ArrowRight size={16} />
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={goToNextRegisterStep}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-primary transition"
                      >
                        Next
                        <ArrowRight size={16} />
                      </motion.button>
                    )}
                  </div>
                </div>

                <div className="hidden space-y-6 md:block">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal">
                      Create your KinSous account
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Enter your details to start booking and helping with food
                      runs.
                    </p>
                  </div>

                  <NameFields
                    errors={registerErrors}
                    form={registerForm}
                    onChange={updateRegisterField}
                  />

                  <BirthdayGenderFields
                    errors={registerErrors}
                    form={registerForm}
                    maxBirthDate={maxBirthDate}
                    onChange={updateRegisterField}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <ContactFields
                      errors={registerErrors}
                      form={registerForm}
                      onChange={updateRegisterField}
                    />
                    <PasswordField
                      autoComplete="new-password"
                      error={registerErrors.password}
                      label="Password"
                      minLength={8}
                      onChange={(value) =>
                        updateRegisterField("password", value)
                      }
                      onToggle={() =>
                        setShowRegisterPassword((current) => !current)
                      }
                      showPassword={showRegisterPassword}
                      placeholder="At least 8 characters"
                      value={registerForm.password}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500 dark:border-red-800 dark:bg-red-900/20"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-primary transition disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-4 max-w-sm rounded-2xl border border-card-border bg-card/80 p-4 backdrop-blur"
        >
          <p className="mb-2 text-center text-xs font-medium text-muted">
            Demo Account
          </p>
          <div className="space-y-1 text-center text-xs text-charcoal">
            <p>
              <span className="text-muted">Email:</span> chioma@kinsous.com
            </p>
            <p>
              <span className="text-muted">Password:</span> KinSous2024!
            </p>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-3 w-full rounded-xl border border-primary-200 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Use demo credentials
          </button>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted">
          KinSous | FolkProvidr | v0.1.0
        </p>
      </motion.div>
    </div>
  );
}
