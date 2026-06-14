"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { apiFetch, ApiError } from "@/lib/api-client";

// ─── Env-driven feature flags (NEXT_PUBLIC_ → available in the browser) ───
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const recaptchaEnabled = Boolean(RECAPTCHA_SITE_KEY);

// Social OAuth: only show buttons when provider keys are configured.
// Add NEXT_PUBLIC_GOOGLE_ENABLED=true / NEXT_PUBLIC_GITHUB_ENABLED=true to .env
// to show these buttons once the OAuth flow is wired up.
const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED);
const githubEnabled = Boolean(process.env.NEXT_PUBLIC_GITHUB_ENABLED);
const showSocialSection = googleEnabled || githubEnabled;

// Declare the grecaptcha global injected by the reCAPTCHA v2 script
declare global {
  interface Window {
    // Called by the reCAPTCHA script once it finishes loading
    onRecaptchaLoad?: () => void;
    grecaptcha: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
  }
}

import { useToast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  // reCAPTCHA v2 state
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // ── Inject reCAPTCHA v2 explicit-render script when the feature is enabled ──
  useEffect(() => {
    if (!recaptchaEnabled) return;
    // Skip if already injected
    if (document.getElementById("recaptcha-script")) return;

    // Called automatically by the script once it has loaded
    window.onRecaptchaLoad = () => {
      if (!recaptchaContainerRef.current) return;
      widgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "light",
        callback: (token: string) => setRecaptchaToken(token),
        "expired-callback": () => setRecaptchaToken(null),
        "error-callback": () => setRecaptchaToken(null),
      });
    };

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    // explicit render + onload callback
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // ── Mesh background micro-animation ──
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      const mesh = document.querySelector(".mesh-bg") as HTMLElement;
      if (mesh) {
        mesh.style.backgroundImage = `
          radial-gradient(at ${x}% ${y}%, rgba(254, 20, 122, 0.08) 0px, transparent 50%),
          radial-gradient(at ${100 - x}% ${100 - y}%, rgba(32, 23, 71, 0.08) 0px, transparent 50%)
        `;
      }
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /**
   * 🔑 SIGN IN HANDLER:
   * Requests authentication from custom JWT endpoint and displays a global progress toast.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Guard: reCAPTCHA checkbox must be completed before submitting
    if (recaptchaEnabled && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setSubmitting(true);
    const apiCall = apiFetch("/api/auth/login", {
      method: "POST",
      json: { username, password, recaptchaToken: recaptchaToken ?? undefined },
    });

    try {
      await toastPromise(apiCall, {
        loading: "Verifying credentials...",
        success: "Signed in successfully!",
        error: (err) => err instanceof Error ? err.message : "Authentication failed",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err instanceof ApiError && err.status === 429 && err.retryAfter
            ? `Too many attempts. Try again in ${err.retryAfter}s.`
            : err.message,
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      // Reset reCAPTCHA on error so the user can try again
      if (recaptchaEnabled && widgetIdRef.current !== null) {
        window.grecaptcha?.reset(widgetIdRef.current);
        setRecaptchaToken(null);
      }
      setSubmitting(false);
    }
  }

  return (
    /*
     * Mirrors the Stitch reference exactly:
     *   body { min-h-screen flex items-center justify-center p-md overflow-hidden }
     */
    <div className="login-page-shell">
      {/* Atmospheric mesh background */}
      <div className="mesh-bg" />

      {/* ─────────────── Login Card ─────────────── */}
      <main className="login-card relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-xl shadow-2xl md:flex-row">

        {/* ═══════════ LEFT PANEL — Branding ═══════════ */}
        <section className="relative flex w-full flex-col justify-between overflow-hidden bg-secondary py-10 px-xl md:w-1/2">
          {/* Decorative glows */}
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-tertiary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary-container/10 blur-3xl" />

          {/* Top: Logo + headline */}
          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-base">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-tertiary">
                <Icon name="dashboard" className="text-[32px] text-white" />
              </div>
              <h1 className="font-headline-md text-headline-md font-extrabold tracking-tight text-white">
                IssueTracker
              </h1>
            </div>

            <div className="space-y-md">
              <h2 className="font-headline-lg text-headline-lg leading-tight text-white">
                Streamline your <br />
                <span className="text-tertiary">workflow</span>.
              </h2>
              <p className="max-w-xs font-body-lg text-body-lg text-white/70">
                The next generation of SaaS management. Monitor, track, and
                resolve system issues with precision and digital luxury.
              </p>
            </div>
          </div>

          {/* Bottom: Social proof */}
          <div className="relative z-10 flex items-center gap-sm">
            <div className="flex -space-x-3">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDVmMB1PQ1IdmxxEhJa9uAl8UaNaOyW8qJAk0WhZlN_8IoS9RE4-2wt4XedjZ6Er9-4WQ9h0zqiXjG3xLGvzsXn5TUT3h-cGL0657oWzV0t4IzEYH40f8D8mthZfqWiP5upFMTwSKmn0PjGF3G7nRDrHxL1nCspQMEYnipDqcF3pWFQEl8fUglq9-Co7Fsj6NUOXPAWVZY8nYnK5ct-Miu7MjDX1dfBMDohURMmjxt9ZF2z9Uk8dj9isv9Cwa7MrFWTvNBQ8br7vQ",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA5bqF5-BOcn6aGDO5w60NrCrjaGSTyME_ZyT0kCOVJKe0XFZOIt-dh2go4tVBzY4hDUyAazkWMFew0qZLc1OGrx9WCclBlso25jBxQq26hDEWTh-yAmqacF7nYOpVF2JAnmeQQnr4rrGiEIBeka4DjRXS4TEAC2lTKXmaAP16q9ATUpaNsITcNVfzEyo9WhF5OaE9DNwG0jEqrhWRWW5QioOTAN85RyVVTI_kUnGUJgyYw1u63T6WI61OiRtY_mqCZaa8ZPV7wVg",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBISVSiCDs4fLFuTqnzYiS4Kc6Ix8gnrmA4tVN5O7wWwScpj416Qz2OHRuGi6U9E1jtau3a-Q-wBi0Z8NMIE3WSNgx-xi0w_S0c3aoOyC3XBbkdY9TS7IeYRuAp55TxSR57HmfY200ysyMdP1o-JHLd4Ps1bqVp1SLho0YC2A9LMgXAMggCB-oEmRZuxHKgo44o3V3osBtzDNbFZNagaz4-p1ykyt0PYZ1FUtmtH87aYWM2oHeuppjE5QwzuMyKvUbaChs7UkaLQw",
              ].map((src, i) => (
                <img
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-secondary object-cover"
                  src={src}
                  alt={`Trusted User ${i + 1}`}
                />
              ))}
            </div>
            <span className="font-label-md text-label-md text-white/60">
              Trusted by 2,000+ organizations
            </span>
          </div>
        </section>

        {/* ═══════════ RIGHT PANEL — Form ═══════════ */}
        <section className="flex w-full flex-col justify-center bg-white/40 py-10 px-xl md:w-1/2">
          <div className="mx-auto w-full max-w-md">

            {/* Heading */}
            <div className="mb-6">
              <h3 className="mb-xs font-headline-md text-headline-md font-bold text-secondary">
                Welcome Back
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Please enter your details to sign in.
              </p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>

              {/* Username */}
              <div className="space-y-xs">
                <label
                  htmlFor="username"
                  className="block font-label-md text-label-md text-secondary"
                >
                  Username
                </label>
                <div className="group relative">
                  <Icon
                    name="person"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-tertiary"
                  />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-lg border border-secondary/10 bg-white/50 py-3 pl-12 pr-4 font-body-md text-body-md text-secondary outline-none transition-all focus:border-tertiary focus:bg-white focus:ring-1 focus:ring-tertiary"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-xs">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block font-label-md text-label-md text-secondary"
                  >
                    Password
                  </label>
                  <span className="cursor-pointer font-label-md text-label-md text-tertiary hover:opacity-80 transition-opacity">
                    Forgot password?
                  </span>
                </div>
                <div className="group relative">
                  <Icon
                    name="lock"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-tertiary"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-secondary/10 bg-white/50 py-3 pl-12 pr-12 font-body-md text-body-md text-secondary outline-none transition-all focus:border-tertiary focus:bg-white focus:ring-1 focus:ring-tertiary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-on-surface-variant transition-colors hover:text-tertiary"
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} />
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-xs pt-xs">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-secondary/20 text-tertiary focus:ring-tertiary"
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer font-label-md text-label-md text-on-surface-variant"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* reCAPTCHA v2 checkbox widget — only rendered when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set */}
              {recaptchaEnabled && (
                <div className="flex flex-col gap-xs">
                  {/* Widget target: grecaptcha.render() injects the iframe here */}
                  <div
                    ref={recaptchaContainerRef}
                    id="recaptcha-container"
                    className="overflow-hidden rounded-lg"
                  />
                  {/* Subtle policy links below the checkbox */}
                  <p className="font-label-md text-label-md text-on-surface-variant/50">
                    Protected by reCAPTCHA ·{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Privacy
                    </a>
                    {" · "}
                    <a
                      href="https://policies.google.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Terms
                    </a>
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 font-label-md text-label-md text-error">
                  <Icon name="error" className="text-[18px]" />
                  {error}
                </div>
              )}

              {/* Submit — disabled until reCAPTCHA is completed (when enabled) */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={submitting || (recaptchaEnabled && !recaptchaToken)}
                className="flex w-full cursor-pointer items-center justify-center gap-xs rounded-lg bg-tertiary px-6 py-3 font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <Icon name="arrow_forward" />
                  </>
                )}
              </button>

              {/* Social section — only rendered when at least one OAuth provider is configured */}
              {showSocialSection && (
                <>
                  <div className="relative py-md">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-secondary/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white/40 px-md font-label-md text-label-md text-on-surface-variant">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-md" style={{ gridTemplateColumns: `repeat(${[googleEnabled, githubEnabled].filter(Boolean).length}, 1fr)` }}>
                    {googleEnabled && (
                      <button
                        type="button"
                        className="flex cursor-pointer items-center justify-center gap-xs rounded-lg border border-secondary/10 py-2 transition-colors hover:bg-white"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="font-label-md text-label-md text-secondary">Google</span>
                      </button>
                    )}
                    {githubEnabled && (
                      <button
                        type="button"
                        className="flex cursor-pointer items-center justify-center gap-xs rounded-lg border border-secondary/10 py-2 transition-colors hover:bg-white"
                      >
                        <Icon name="terminal" className="text-secondary" />
                        <span className="font-label-md text-label-md text-secondary">Github</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>

            {/* Sign-up link */}
            <div className="mt-5 text-center">
              <p className="font-label-md text-label-md text-on-surface-variant">
                Don&apos;t have an account?{" "}
                <a className="font-bold text-tertiary hover:underline" href="#">
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Demo credentials — collapsible below the card */}
      <div className="relative z-10 mt-sm text-center">
        <button
          type="button"
          onClick={() => setShowDemo((v) => !v)}
          className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <Icon name={showDemo ? "expand_less" : "expand_more"} className="text-[16px]" />
          Demo credentials
        </button>
        {showDemo && (
          <div className="mx-auto mt-xs w-fit rounded-lg border border-secondary/10 bg-white/70 px-md py-sm text-left backdrop-blur-sm">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Manager — <span className="font-bold text-secondary">manager</span> / Manager@123
              &nbsp;·&nbsp;
              Client — <span className="font-bold text-secondary">client</span> / Client@123
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full py-sm text-center">
        <p className="font-label-md text-label-md text-on-surface-variant/40">
          © 2024 IssueTracker SaaS Platform. All rights reserved. Precision engineered for performance.
        </p>
      </footer>
    </div>
  );
}
