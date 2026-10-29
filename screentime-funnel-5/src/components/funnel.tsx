"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

type Step = "splash" | "interstitial" | "congrats" | "age" | "loading" | "handoff";
type AgeView = "select" | "picker" | "confirm";

const CRIMSON = "#F2135B";
const TEAL = "#1FE0C0";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  TikTok webview anchor                                              */
/* ------------------------------------------------------------------ */

// snssdk1180 / snssdk1233 are TikTok's own iOS URL schemes (the Open SDK
// registers both). Fired from inside TikTok's in-app browser, navigating to
// the app's own scheme gets absorbed by TikTok itself — the navigation never
// reaches Safari, which re-anchors the session in the webview. The ping is
// gated on the UA on purpose: TikTok's webview always carries ByteDance
// markers, while desktop Chrome & co. would pop "Open TikTok?" dialogs and
// block the tab. Outside TikTok nothing fires at all. (?ping=1 forces the
// ping for testing.) The bare window.location = "snssdk1180://" variant
// would also dialog on desktop — always go through the hidden iframe.
const TIKTOK_SCHEMES = ["snssdk1180://", "snssdk1233://"];
const TIKTOK_UA = /TikTok|musical_ly|Bytedance|snssdk/i;

function inTikTokWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    TIKTOK_UA.test(navigator.userAgent) ||
    new URLSearchParams(window.location.search).has("ping")
  );
}

function pingTikTokScheme() {
  if (typeof document === "undefined" || !inTikTokWebView()) return;
  TIKTOK_SCHEMES.forEach((scheme, i) => {
    window.setTimeout(() => {
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.setAttribute("aria-hidden", "true");
      frame.src = scheme;
      document.body.appendChild(frame);
      window.setTimeout(() => frame.remove(), 1_500);
    }, i * 400);
  });
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (drawn from the recorded screens)                 */
/* ------------------------------------------------------------------ */

function AccentDashes() {
  // four small crimson dashes radiating around the icon
  const d = [
    "M30 34 L44 46",
    "M22 72 L40 72",
    "M30 110 L44 98",
    "M186 34 L172 46",
    "M194 72 L176 72",
    "M186 110 L172 98",
  ];
  return (
    <g stroke={CRIMSON} strokeWidth="9" strokeLinecap="round">
      {d.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </g>
  );
}

function DocCheckIcon() {
  return (
    <svg viewBox="0 0 216 144" className="h-[118px] w-auto" aria-hidden="true">
      <AccentDashes />
      {/* shadow sheet */}
      <rect x="66" y="14" width="86" height="118" rx="16" fill="#26272A" />
      {/* main document */}
      <rect x="60" y="20" width="86" height="118" rx="16" fill="#4A4B50" />
      <rect x="76" y="44" width="54" height="9" rx="4.5" fill="#9C9DA2" />
      <rect x="76" y="63" width="54" height="9" rx="4.5" fill="#9C9DA2" />
      <rect x="76" y="82" width="34" height="9" rx="4.5" fill="#9C9DA2" />
      {/* check badge */}
      <circle cx="150" cy="34" r="27" fill="#C4163F" />
      <path
        d="M137 34.5 L147 44 L164 25.5"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg viewBox="0 0 216 150" className="h-[124px] w-auto" aria-hidden="true">
      <AccentDashes />
      {/* shadow sheet */}
      <rect x="70" y="16" width="84" height="116" rx="18" fill="#26272A" />
      {/* white card */}
      <rect x="62" y="22" width="84" height="116" rx="18" fill="#F2F2F4" />
      {/* person */}
      <circle cx="92" cy="62" r="12" fill="#C4163F" />
      <path d="M73 96 a19 15 0 0 1 38 0 Z" fill="#C4163F" />
      {/* text lines */}
      <rect x="104" y="46" width="30" height="7" rx="3.5" fill="#C9C9CE" />
      <rect x="104" y="60" width="24" height="7" rx="3.5" fill="#C9C9CE" />
      <rect x="74" y="108" width="58" height="7" rx="3.5" fill="#C9C9CE" />
      <rect x="74" y="122" width="38" height="7" rx="3.5" fill="#C9C9CE" />
      {/* magnifier */}
      <circle cx="146" cy="92" r="21" fill="none" stroke="#C4163F" strokeWidth="9" />
      <line
        x1="161"
        y1="109"
        x2="177"
        y2="126"
        stroke="#C4163F"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function PrimaryButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-14 w-full rounded-full text-[17px] font-bold text-white transition",
        "bg-[linear-gradient(180deg,#F62260_0%,#E01149_100%)]",
        "shadow-[0_10px_28px_-10px_rgba(242,19,91,0.55)]",
        "hover:brightness-110 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-14 w-full rounded-full text-[17px] font-semibold transition",
        disabled
          ? "cursor-default bg-[#1A1B1E] text-[#6E7176]"
          : "bg-[#1E1F23] text-white/90 hover:bg-[#25262B] active:scale-[0.98]"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 0 — loading splash (white screen with the two dots)           */
/* ------------------------------------------------------------------ */

function Splash({ onDone }: { onDone: () => void }) {
  const [dimmed, setDimmed] = useState(false);

  useEffect(() => {
    // white → dark fade, matching the recorded splash → content transition
    const t1 = window.setTimeout(() => setDimmed(true), 1_100);
    const t2 = window.setTimeout(onDone, 1_550);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-colors duration-[450ms]",
        dimmed ? "bg-[#141518]" : "bg-white"
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <span
          className="anim-dot block h-[13px] w-[13px] rounded-full"
          style={{ backgroundColor: CRIMSON }}
        />
        <span
          className="anim-dot block h-[13px] w-[13px] rounded-full"
          style={{ backgroundColor: TEAL, animationDelay: "0.28s" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — offer popup (old demo feed act only behind ?intro=1)      */
/* ------------------------------------------------------------------ */

function Interstitial({
  onContinue,
  instantModal = false,
}: {
  onContinue: () => void;
  instantModal?: boolean;
}) {
  const [showToast, setShowToast] = useState(!instantModal);
  const [showModal, setShowModal] = useState(instantModal);

  useEffect(() => {
    // instant entries open with the popup already visible (initial state below)
    if (instantModal) return;
    const t1 = window.setTimeout(() => setShowToast(false), 10_000);
    const t2 = window.setTimeout(() => setShowModal(true), 10_250);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [instantModal]);

  return (
    <div className="absolute inset-0">
      {/* Real-user entry opens straight onto the popup over a plain dark
          screen — the "deleted page" act lives on TikTok's side (For You
          feed + ad creative). ?intro=1 replays the old demo act with the
          feed frame captured from the recording. */}
      {instantModal ? (
        <div className="absolute inset-0 bg-[radial-gradient(115%_85%_at_50%_0%,#202125_0%,#141518_60%)]" />
      ) : (
        <>
          <img
            src="/funnel/backdrop.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}

      {/* "This page has been deleted." toast */}
      {showToast && (
        <div className="absolute inset-x-0 top-[42%] flex justify-center">
          <div className="anim-toast rounded-lg bg-white px-6 py-3.5 shadow-xl">
            <p className="text-[15px] font-semibold text-black">
              This page has been deleted.
            </p>
          </div>
        </div>
      )}

      {/* interstitial modal */}
      {showModal && (
        <div className="anim-pop absolute inset-x-5 top-[13%] rounded-[28px] bg-white px-6 pb-7 pt-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <img
            src="/funnel/mascot.png"
            alt="Mascot holding a phone with coins and a heart"
            className="mx-auto w-[74%] max-w-[250px] select-none"
            draggable={false}
          />
          <h2 className="mt-4 text-center text-[26px] font-extrabold leading-[1.16] tracking-tight text-[#101114]">
            Turn Your Screentime Into Cash
          </h2>
          <p className="mt-3 text-center text-[15.5px] leading-relaxed text-[#6B7078]">
            Complete simple activities, explore new apps, and earn real rewards
            for the time you already spend on your phone.
          </p>
          <PrimaryButton className="mt-6" onClick={onContinue}>
            Continue
          </PrimaryButton>
        </div>
      )}

      {/* allow impatient users to skip straight to the modal */}
      {!showModal && (
        <button
          type="button"
          aria-label="Skip"
          className="absolute inset-0 cursor-default"
          onClick={() => {
            setShowToast(false);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Congratulations                                           */
/* ------------------------------------------------------------------ */

function Congrats({ onStart }: { onStart: () => void }) {
  return (
    <div className="anim-screen flex h-full flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mt-[10%] flex justify-center">
        <DocCheckIcon />
      </div>
      <h2 className="mx-auto mt-6 max-w-[320px] text-center text-[24px] font-bold leading-[1.32] text-white">
        Congratulations! You have been selected for our{" "}
        <span style={{ color: CRIMSON }}>Screentime To Cash program</span>
      </h2>

      <div className="mt-7 rounded-2xl bg-[#141518] p-5">
        <p className="text-[17px] font-semibold text-white">
          Complete setup to start earning
        </p>
        <ol className="mt-4 space-y-3">
          {[
            "Confirm your eligibility",
            "Download our partner app",
            "Claim your cash reward",
          ].map((item, i) => (
            <li key={item} className="flex items-center gap-3">
              <span
                className="w-4 text-[15px] font-extrabold"
                style={{ color: CRIMSON }}
              >
                {i + 1}.
              </span>
              <span className="text-[15.5px] text-[#C7C9CE]">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <PrimaryButton onClick={onStart}>Start Now</PrimaryButton>
        <GhostButton onClick={onStart}>Ask Me Later</GhostButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Age gate (select / picker / confirm)                      */
/* ------------------------------------------------------------------ */

const YEAR_START = 1940;
const YEAR_END = 2013;
const YEARS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, i) => YEAR_START + i
);
const ITEM_H = 64; // px per wheel row

function AgeGate({ onConfirmed }: { onConfirmed: () => void }) {
  const [view, setView] = useState<AgeView>("select");
  const [year, setYear] = useState<number | null>(null);
  const [wheelSel, setWheelSel] = useState(2002);

  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);

  /* scroll to the currently selected year when the picker opens */
  useEffect(() => {
    if (view === "picker" && listRef.current) {
      const idx = YEARS.indexOf(wheelSel);
      listRef.current.scrollTop = Math.max(0, idx * ITEM_H);
    }
  }, [view]);

  const opacityFor = useCallback((dist: number) => {
    if (dist === 0) return 1;
    if (dist === 1) return 0.5;
    if (dist === 2) return 0.26;
    return 0.12;
  }, []);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.min(
      YEARS.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM_H))
    );
    setWheelSel(YEARS[idx]);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 130);
  }, []);

  const scrollToYear = useCallback((y: number) => {
    const el = listRef.current;
    if (!el) return;
    const idx = YEARS.indexOf(y);
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }, []);

  const dimTop = view === "confirm";

  return (
    <div className="anim-screen flex h-full flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* header block — dims once the confirm section appears */}
      <div
        className={cn(
          "transition-opacity duration-300",
          dimTop ? "pointer-events-none opacity-30" : "opacity-100"
        )}
      >
        <div className="mt-[7%] flex justify-center">
          <IdCardIcon />
        </div>
        <h2 className="mt-5 text-center text-[27px] font-bold text-white">
          Confirm your age
        </h2>
        <p className="mx-auto mt-3 max-w-[330px] text-center text-[15.5px] leading-relaxed text-[#9DA0A6]">
          Verify your age so we can match you with the highest-paying offers
          available in your area.
        </p>
      </div>

      {/* middle: divider dash */}
      <div className="mx-auto my-6 h-[3px] w-10 rounded-full bg-white/15" />

      {view === "select" && (
        <div className="anim-screen flex flex-1 flex-col">
          <label className="mb-3 block text-[13px] font-bold tracking-[0.18em] text-[#B9BCC2]">
            BIRTH YEAR
          </label>
          <button
            type="button"
            onClick={() => setView("picker")}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#1B1C1F] px-5 transition hover:bg-[#222327]"
          >
            <span className="text-[18px] font-medium text-[#8A8D93]">
              Select your birth year
            </span>
            <svg
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke={CRIMSON}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 8 L10 13 L15 8" />
            </svg>
          </button>

          <div className="mt-auto pt-8">
            <GhostButton disabled>Unlock My Offers</GhostButton>
          </div>
        </div>
      )}

      {view === "picker" && (
        <div className="anim-screen flex flex-1 flex-col">
          <p className="text-center text-[23px] font-bold text-white">
            Birth year
          </p>

          {/* wheel */}
          <div className="relative mx-auto mt-3 w-full max-w-[340px] flex-1">
            {/* center highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 rounded-2xl bg-[#1B1C1F]" />
            <div
              ref={listRef}
              role="listbox"
              aria-label="Birth year"
              tabIndex={0}
              onScroll={handleScroll}
              className="no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-scroll overscroll-contain"
              style={{ scrollPaddingBlock: `${(ITEM_H * 5) / 2 - ITEM_H / 2}px` }}
            >
              <div style={{ height: `${2 * ITEM_H}px` }} />
              {YEARS.map((y) => {
                const dist = Math.abs(y - wheelSel);
                return (
                  <div
                    key={y}
                    role="option"
                    aria-selected={y === wheelSel}
                    onClick={() => scrollToYear(y)}
                    style={{
                      height: `${ITEM_H}px`,
                      opacity: opacityFor(dist),
                    }}
                    className={cn(
                      "flex snap-center cursor-pointer items-center justify-center text-[25px] font-semibold text-white select-none",
                      dist === 0 && "font-bold"
                    )}
                  >
                    {y}
                  </div>
                );
              })}
              <div style={{ height: `${2 * ITEM_H}px` }} />
            </div>
          </div>

          <div className="pt-5">
            <PrimaryButton
              onClick={() => {
                setYear(wheelSel);
                setView("confirm");
              }}
            >
              Confirm
            </PrimaryButton>
          </div>
        </div>
      )}

      {view === "confirm" && year !== null && (
        <div className="anim-screen flex flex-1 flex-col">
          <h2 className="text-center text-[26px] font-extrabold text-white">
            Confirm to Continue
          </h2>
          <p className="mx-auto mt-3 max-w-[330px] text-center text-[15.5px] leading-relaxed text-[#9DA0A6]">
            We need this to be accurate so we can match you with the{" "}
            <span className="font-semibold" style={{ color: CRIMSON }}>
              best-paying offers
            </span>{" "}
            for your age group.
          </p>

          <div className="mt-7 rounded-2xl bg-[#1B1C1F] py-5 text-center">
            <p className="text-[13px] font-semibold tracking-[0.22em] text-[#9DA0A6]">
              SELECTED BIRTH YEAR
            </p>
            <p className="mt-1.5 text-[34px] font-extrabold leading-none text-white">
              {year}
            </p>
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <PrimaryButton onClick={onConfirmed}>
              Confirm &amp; See My Offers
            </PrimaryButton>
            <GhostButton onClick={() => setView("select")}>Edit Age</GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Finding offers loader                                     */
/* ------------------------------------------------------------------ */

function LoadingOffers({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const started = performance.now();
    const DURATION = 4200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION);
      // ease-in-out so it feels organic
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(Math.max(4, Math.round(eased * 100)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(onDone, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="anim-screen flex h-full flex-col items-center justify-center px-6">
      {/* bouncing dots */}
      <div className="flex items-center gap-3.5">
        <span
          className="anim-dot block h-[13px] w-[13px] rounded-full"
          style={{ backgroundColor: TEAL }}
        />
        <span
          className="anim-dot block h-[13px] w-[13px] rounded-full"
          style={{ backgroundColor: CRIMSON, animationDelay: "0.28s" }}
        />
      </div>

      <h2 className="mt-7 text-center text-[26px] font-extrabold text-white">
        Finding your best offers…
      </h2>
      <p className="mt-2.5 text-center text-[16.5px] text-[#9DA0A6]">
        Matching based on your profile
      </p>

      <div className="mt-9 h-2 w-[76%] max-w-[336px] overflow-hidden rounded-full bg-[#232427]">
        <div
          className="h-full rounded-full transition-[width] duration-150 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: CRIMSON,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5 — Playful Rewards handoff                                   */
/* ------------------------------------------------------------------ */

function Handoff() {
  const OFFER_URL = "https://www.fkn8s74mztrk.com/F3LJ3N8X/GS3NQC1D/";

  // re-anchor the session right before the store handoff
  useEffect(() => {
    pingTikTokScheme();
  }, []);

  return (
    <div className="anim-screen font-ios relative flex h-full flex-col bg-[#F4F4F6]">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <img
          src="/funnel/playful.png"
          alt="Playful Rewards app icon"
          className="h-24 w-24 select-none rounded-[22px] shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
          draggable={false}
        />
        <p className="mt-4 text-[21px] font-semibold text-[#54565B]">
          Playful Rewards
        </p>
      </div>

      <div className="flex justify-center pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <a
          href={OFFER_URL}
          rel="nofollow sponsored noopener"
          onClick={pingTikTokScheme}
          className="flex items-center gap-2.5 rounded-[10px] bg-black px-4 py-2 transition hover:opacity-90 active:scale-[0.98]"
          aria-label="Download Playful Rewards on the App Store"
        >
          <AppleLogo className="h-7 w-7 text-white" />
          <span className="flex flex-col items-start leading-none text-white">
            <span className="text-[10px] font-normal tracking-wide">
              Download on the
            </span>
            <span className="mt-0.5 text-[21px] font-semibold tracking-tight">
              App Store
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Funnel root                                                        */
/* ------------------------------------------------------------------ */

// Entry modes (the funnel is client-only rendered — see page.tsx — so
// window.location is safe to read during the initial render):
//   (no params) → splash → mascot popup immediately. Real-user flow: the
//                 "This page has been deleted." act happens on TikTok's side
//                 (For You feed + ad creative), NOT on the site.
//   ?fast=1     → same as the default (kept so existing Instant Page
//                 buttons keep working).
//   ?fast=2     → splash → congrats screen.
//   ?intro=1    → demo mode: replays the full old act (fake For You feed +
//                 10s "deleted" toast) before the popup. Preview/testing only.
function readParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function Funnel() {
  const fast = readParam("fast");
  const intro = readParam("intro");
  const fullIntro = intro !== null;
  const entry: Step = fast === "2" && !fullIntro ? "congrats" : "interstitial";
  const [step, setStep] = useState<Step>("splash");

  const go = useCallback((s: Step) => setStep(s), []);

  // anchor the session inside TikTok's in-app browser as early as possible
  useEffect(() => {
    pingTikTokScheme();
  }, []);

  const screen = useMemo(() => {
    switch (step) {
      case "splash":
        return <Splash key="s" onDone={() => go(entry)} />;
      case "interstitial":
        return (
          <Interstitial
            key="i"
            onContinue={() => go("congrats")}
            instantModal={!fullIntro}
          />
        );
      case "congrats":
        return <Congrats key="c" onStart={() => go("age")} />;
      case "age":
        return <AgeGate key="a" onConfirmed={() => go("loading")} />;
      case "loading":
        return <LoadingOffers key="l" onDone={() => go("handoff")} />;
      case "handoff":
        return <Handoff key="h" />;
    }
  }, [step, go, entry, fullIntro]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#141518] sm:p-6">
      {/* phone viewport: full-bleed on mobile, framed on desktop */}
      <div className="font-funnel relative h-dvh w-full overflow-hidden bg-black sm:h-[min(92dvh,860px)] sm:max-w-[400px] sm:rounded-[2.4rem] sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:ring-1 sm:ring-white/10">
        {screen}
      </div>
    </main>
  );
}
