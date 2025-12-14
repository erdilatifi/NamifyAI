import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            NamifyAI
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="hidden text-zinc-600 hover:text-zinc-950 sm:block" href="#pricing">
              Pricing
            </Link>
            <Link className="hidden text-zinc-600 hover:text-zinc-950 sm:block" href="#faq">
              FAQ
            </Link>
            <Link className="rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50" href="/login">
              Log in
            </Link>
            <Link className="rounded-md bg-black px-3 py-2 text-white hover:bg-zinc-900" href="/register">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
                  AI business name generator for founders
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Brandable business names in seconds.
                </h1>
                <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg">
                  Describe your idea, pick a tone, add keywords — NamifyAI generates 10–20 startup-ready names you can save and revisit.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link className="h-11 rounded-md bg-black px-5 text-sm font-medium text-white hover:bg-zinc-900 inline-flex items-center justify-center" href="/register">
                    Generate names for free
                  </Link>
                  <Link className="h-11 rounded-md border border-zinc-200 px-5 text-sm font-medium hover:bg-zinc-50 inline-flex items-center justify-center" href="#how">
                    See how it works
                  </Link>
                </div>
                <div className="mt-6 text-xs text-zinc-500">
                  Free tier included. Upgrade any time.
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
                <div className="text-sm font-medium">Example output</div>
                <div className="mt-4 grid gap-3">
                  {[
                    { name: "Ledgerly", note: "Fintech • Professional" },
                    { name: "Sproutlane", note: "Food • Playful" },
                    { name: "ArcNimbus", note: "Cloud • Bold" },
                    { name: "LumenCraft", note: "Design • Minimal" },
                  ].map((x) => (
                    <div key={x.name} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                      <div>
                        <div className="font-semibold">{x.name}</div>
                        <div className="text-xs text-zinc-500">{x.note}</div>
                      </div>
                      <div className="text-xs text-zinc-400">.com hint</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-100 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Brandable by design",
                  desc: "Short, pronounceable, and memorable—optimized for modern startups.",
                },
                {
                  title: "Save & favorite",
                  desc: "Keep your best ideas, favorite the winners, and revisit later.",
                },
                {
                  title: "Usage controls",
                  desc: "Free tier with limits. Pro plan for serious naming sprints.",
                },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-600">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-zinc-100 bg-zinc-50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Describe your business",
                  desc: "Tell us what you do and who you serve.",
                },
                {
                  step: "2",
                  title: "Pick tone + keywords",
                  desc: "Professional, playful, bold—your brand voice matters.",
                },
                {
                  step: "3",
                  title: "Generate & shortlist",
                  desc: "Get 10–20 names, then save and favorite the best.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    {s.step}
                  </div>
                  <div className="mt-4 text-sm font-semibold">{s.title}</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-600">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-zinc-100 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
                <p className="mt-2 text-sm text-zinc-600">Start free. Upgrade when you need more generations.</p>
              </div>
              <Link className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-zinc-900 inline-flex items-center justify-center" href="/register">
                Start free
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-8">
                <div className="text-sm font-semibold">Free</div>
                <div className="mt-3 text-4xl font-semibold">$0</div>
                <div className="mt-1 text-sm text-zinc-500">For trying NamifyAI</div>
                <div className="mt-6 space-y-3 text-sm text-zinc-700">
                  <div>20 generations / month</div>
                  <div>Save names</div>
                  <div>Favorite names</div>
                </div>
                <Link className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-200 text-sm font-medium hover:bg-zinc-50" href="/register">
                  Create free account
                </Link>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-8 text-white">
                <div className="text-sm font-semibold">Pro</div>
                <div className="mt-3 text-4xl font-semibold">$19</div>
                <div className="mt-1 text-sm text-zinc-300">For founders naming fast</div>
                <div className="mt-6 space-y-3 text-sm text-zinc-200">
                  <div>200 generations / month</div>
                  <div>Priority generation</div>
                  <div>Billing & subscription management</div>
                </div>
                <Link className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-white text-sm font-medium text-zinc-950 hover:bg-zinc-200" href="/register">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-100 bg-zinc-50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Loved by builders</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote: "We named our product in 10 minutes. The tone controls are perfect.",
                  name: "Asha, Indie Founder",
                },
                {
                  quote: "The results feel brandable, not generic. Huge time saver for client work.",
                  name: "Marco, Agency Owner",
                },
                {
                  quote: "Saving + favoriting made it easy to shortlist and share with my cofounder.",
                  name: "Leila, Startup Operator",
                },
              ].map((t) => (
                <div key={t.name} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="text-sm leading-6 text-zinc-700">“{t.quote}”</div>
                  <div className="mt-4 text-xs font-medium text-zinc-500">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-zinc-100 bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[
                {
                  q: "Does NamifyAI check domain availability?",
                  a: "Not yet. We provide a domain availability hint, but we don’t perform live lookups.",
                },
                {
                  q: "Are names guaranteed to be trademark-free?",
                  a: "No. We avoid famous brands and obvious trademarks, but you should run a legal/trademark check before launching.",
                },
                {
                  q: "Can I cancel Pro anytime?",
                  a: "Yes. You’ll keep Pro until the end of your billing period.",
                },
                {
                  q: "Do you store my prompts?",
                  a: "We store the inputs you use to generate names so you can revisit results and keep a history in your dashboard.",
                },
              ].map((f) => (
                <div key={f.q} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="text-sm font-semibold">{f.q}</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-600">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-600">© {new Date().getFullYear()} NamifyAI</div>
          <div className="flex gap-4 text-sm">
            <Link className="text-zinc-600 hover:text-zinc-950" href="/login">
              Log in
            </Link>
            <Link className="text-zinc-600 hover:text-zinc-950" href="/register">
              Start free
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
