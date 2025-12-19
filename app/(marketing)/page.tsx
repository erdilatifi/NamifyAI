"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

/* ---------------- animation presets ---------------- */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-zinc-200">
      <Check className="mt-0.5 h-4 w-4 text-indigo-300" />
      <span className="leading-6">{children}</span>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060606] pt-24 text-zinc-50">
      {/* ---------- premium background ---------- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute top-1/3 left-0 h-[420px] w-[420px] bg-violet-500/10 blur-[140px]" />
        <div className="absolute top-1/4 right-0 h-[420px] w-[420px] bg-blue-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

        {/* AuthKit-inspired grid + vignette */}
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:256px_256px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.78)_100%)]" />

        {/* faint crosshair lines */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />
        <div className="absolute top-1/3 left-0 h-px w-full bg-white/5" />
      </div>

      <main className="relative">
        {/* ================= HERO ================= */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-20">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mx-auto max-w-3xl text-center"
            >
              <motion.h1
                variants={item}
                className="mt-8 text-balance text-5xl font-semibold tracking-[-0.03em] sm:text-7xl"
              >
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
                  Brandable business names
                </span>{" "}
                in seconds.
              </motion.h1>

              <motion.p
                variants={item}
                className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg"
              >
                Describe your idea and instantly generate clean, memorable names with
                domain hints — built for fast naming sprints.
              </motion.p>

              <motion.div
                variants={item}
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 px-7 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_20px_60px_-30px_rgba(99,102,241,0.8)] transition hover:brightness-110"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="#pricing"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/5 px-7 text-sm font-medium text-zinc-100 backdrop-blur transition hover:bg-white/10"
                >
                  View pricing
                </Link>
              </motion.div>

              <motion.div
                variants={item}
                className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400"
              >
                <span>1,000+ founders</span>
                <span className="h-1 w-1 rounded-full bg-zinc-500" />
                <span>10,000+ names generated</span>
                <span className="h-1 w-1 rounded-full bg-zinc-500" />
                <span>Results in under 3s</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-sm text-indigo-200">Built for clarity</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to pick a name confidently
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                No clutter. No distractions. Just fast, focused naming.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Brandable by default",
                  desc: "Short, pronounceable names tuned for modern startups.",
                },
                {
                  title: "Save & shortlist",
                  desc: "Favorite the best ideas and compare them clearly.",
                },
                {
                  title: "Domain guidance",
                  desc: "See likely available domains and next steps instantly.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] transition hover:bg-white/[0.08]"
                >
                  <div className="text-sm font-semibold tracking-tight">
                    {f.title}
                  </div>
                  <div className="mt-3 text-sm leading-6 text-zinc-300">
                    {f.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PRICING ================= */}
        <section id="pricing" className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-sm text-indigo-200">Pricing</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Simple plans. Clear limits.</h2>
              <p className="mt-4 text-sm text-zinc-300">Start free, upgrade when you need more generations.</p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Free</div>
                  <div className="text-xs text-zinc-400">For exploration</div>
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <div className="text-4xl font-semibold tracking-tight">$0</div>
                  <div className="pb-1 text-sm text-zinc-400">/ month</div>
                </div>
                <div className="mt-6 grid gap-3">
                  <Bullet>20 generations / month</Bullet>
                  <Bullet>Save & favorite</Bullet>
                  <Bullet>Domain hints</Bullet>
                </div>
                <Link
                  href="/register"
                  className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md border border-white/12 bg-white/5 text-sm transition hover:bg-white/10"
                >
                  Get started
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#6b2a8f]/45 bg-white/[0.06] p-8 shadow-[0_0_0_1px_rgba(107,42,143,0.25),0_30px_120px_-70px_rgba(107,42,143,0.85)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#6b2a8f]/30 blur-[140px]" />
                  <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:96px_96px]" />
                </div>

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-200">
                    Most popular
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">Pro</div>
                    <div className="text-xs text-zinc-300">Best value</div>
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-4xl font-semibold tracking-tight">$19</div>
                    <div className="pb-1 text-sm text-zinc-300">/ month</div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-300">Upgrade for higher limits and faster iterations.</div>

                  <div className="mt-6 grid gap-3">
                    <Bullet>200 generations / month</Bullet>
                    <Bullet>Priority generation</Bullet>
                    <Bullet>Domain checks</Bullet>
                    <Bullet>Billing portal</Bullet>
                  </div>

                  <Link
                    href="/register"
                    className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#6b2a8f] text-sm font-medium text-white shadow-lg shadow-[#2b0a3d]/40 transition hover:bg-[#7b34a5]"
                  >
                    Start free trial
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Enterprise</div>
                  <div className="text-xs text-zinc-400">Custom</div>
                </div>
                <div className="mt-5 text-4xl font-semibold tracking-tight">Let’s talk</div>
                <div className="mt-2 text-sm text-zinc-300">For teams running high-volume naming sprints.</div>
                <div className="mt-6 grid gap-3">
                  <Bullet>High-volume usage</Bullet>
                  <Bullet>Team workflows</Bullet>
                  <Bullet>Dedicated support</Bullet>
                </div>
                <Link
                  href=""
                  className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md border border-white/12 bg-white/5 text-sm transition hover:bg-white/10"
                >
                  Contact sales
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-10 max-w-3xl text-center text-xs text-zinc-400">
              Plans are billed monthly. You can cancel anytime.
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
              <div>
                <div className="text-sm font-semibold">NamifyAI</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Premium AI business name generation.
                </div>
                <div className="mt-4 text-xs text-zinc-500">
                  © {new Date().getFullYear()} NamifyAI
                </div>
              </div>

              <div className="flex gap-10 text-sm">
                <Link href="#pricing" className="text-zinc-400 hover:text-white">
                  Pricing
                </Link>
                <Link href="/login" className="text-zinc-400 hover:text-white">
                  Log in
                </Link>
                <Link href="/register" className="text-zinc-400 hover:text-white">
                  Start free
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
