"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type GenerateInput = {
  description: string;
  industry: string;
  tone: string;
  keywords?: string;
  count?: 2 | 4 | 6;
};

function getErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  if ("error" in body) {
    const err = (body as { error?: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
      return (err as { message: string }).message;
    }
  }
  return undefined;
}

type Generated = {
  name: string;
  originalName?: string;
  replacedBecauseTaken?: boolean;
  isExistingBusinessName?: boolean;
  tagline?: string;
  domains?: Array<{ fqdn: string; status: "taken" | "likely_available" | "unknown" }>;
  availableDomains?: string[];
};

export default function GeneratePage() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState("");
  const [count, setCount] = useState<2 | 4 | 6>(4);

  const [progress, setProgress] = useState(0);

  const progressIntervalRef = useRef<number | null>(null);

  const [results, setResults] = useState<Generated[]>([]);
  const [savedIdsByName, setSavedIdsByName] = useState<Record<string, string>>({});
  const [favoritedByName, setFavoritedByName] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const generateMutation = useMutation({
    onMutate: () => {
      setProgress(8);
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 92) return p;
          const next = p + Math.max(1, Math.round((100 - p) * 0.06));
          return Math.min(92, next);
        });
      }, 350);
    },
    mutationFn: async (input: GenerateInput) => {
      setActionError(null);
      setLimitReached(false);
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (res.status === 402) {
        setLimitReached(true);
        throw new Error("Usage limit reached");
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as unknown;
        throw new Error(getErrorMessage(body) || "Failed to generate");
      }

      const body = (await res.json()) as { suggestions: Generated[] };
      return body;
    },
    onSuccess: (data) => {
      setResults(data.suggestions);
      setSavedIdsByName({});
      setFavoritedByName({});
      setProgress(100);
      window.setTimeout(() => setProgress(0), 500);
    },
    onSettled: (_, error) => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (error) setProgress(0);
    },
    onError: (err) => {
      if ((err as Error).message === "Usage limit reached") {
        setActionError("You reached your monthly generation limit.");
        return;
      }

      setActionError((err as Error).message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: { name: string }) => {
      const res = await fetch("/api/names/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          description,
          industry,
          tone,
          keywords: keywords.length ? keywords : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return (await res.json()) as { id: string };
    },
    onSuccess: (data, variables) => {
      setSavedIdsByName((prev) => ({ ...prev, [variables.name]: data.id }));
      toast.success("Saved", {
        description: `Saved ${variables.name}`,
      });
    },
    onError: (err) => {
      setActionError("Unable to save name.");
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : "Unable to save name.",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (input: { name: string; favorite: boolean }) => {
      const generatedNameId = savedIdsByName[input.name];
      if (!generatedNameId) {
        throw new Error("Not saved");
      }
      const res = await fetch("/api/names/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedNameId, favorite: input.favorite }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_, variables) => {
      setFavoritedByName((prev) => ({ ...prev, [variables.name]: variables.favorite }));
      toast.success(variables.favorite ? "Added to favorites" : "Removed from favorites", {
        description: variables.name,
      });
    },
    onError: (err) => {
      setActionError("To favorite a name, save it first.");
      toast.error("Favorite failed", {
        description: err instanceof Error ? err.message : "To favorite a name, save it first.",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Dialog open={generateMutation.isPending}>
        <DialogContent className="overflow-hidden p-0">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#2b0a3d]/40 blur-[120px]" />
              <div className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-[#0b2a3a]/25 blur-[140px]" />
              <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
            </div>

            <div className="relative p-6">
              <DialogHeader>
                <DialogTitle>Generating names…</DialogTitle>
                <DialogDescription>
                  We’re creating brandable options and checking for duplicates.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <Progress value={progress} className="bg-white/10" />
                <div className="mt-3 text-xs text-zinc-300">{Math.max(1, Math.round(progress))}%</div>
              </div>

              <div className="mt-5 text-xs text-zinc-400">This usually takes a few seconds.</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-50">Generate business names</CardTitle>
          <CardDescription>
            Describe your business and generate 2, 4, or 6 brandable name ideas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            generateMutation.mutate({
              description,
              industry,
              tone,
              keywords: keywords.length ? keywords : undefined,
              count,
            });
          }}
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-200">Business description</label>
              <Textarea
                className="border-white/10 bg-white/5 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-[#6b2a8f] focus-visible:ring-offset-0"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-200">Industry</label>
                <Input
                  className="border-white/10 bg-white/5 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-[#6b2a8f] focus-visible:ring-offset-0"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-200">Tone</label>
                <select
                  className="namify-tone-select h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-[#6b2a8f] focus-visible:ring-offset-0"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="playful">Playful</option>
                  <option value="bold">Bold</option>
                  <option value="luxury">Luxury</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-200">Keywords (optional)</label>
              <Input
                className="border-white/10 bg-white/5 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-[#6b2a8f] focus-visible:ring-offset-0"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. rapid, cloud, finance"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-200">Suggestions</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[2, 4, 6].map((v) => {
                  const value = v as 2 | 4 | 6;
                  const active = count === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={
                        active
                          ? "bg-[#6b2a8f] text-white hover:bg-[#7b34a5]"
                          : "border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                      }
                      onClick={() => setCount(value)}
                    >
                      {value}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                2 suggestions costs 1 credit. 4 costs 2 credits. 6 costs 3 credits.
              </div>
            </div>

            <Button
              disabled={generateMutation.isPending}
              className="bg-[#6b2a8f] text-white shadow-lg shadow-[#2b0a3d]/40 hover:bg-[#7b34a5]"
              type="submit"
            >
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>

            {generateMutation.isError ? (
              <p className="text-sm text-red-600">Unable to generate names right now.</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base text-zinc-50">Suggestions</CardTitle>
          <CardDescription>Save and favorite your best ideas.</CardDescription>
        </CardHeader>
        <CardContent>
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          {limitReached ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-medium text-zinc-50">Upgrade to keep generating</div>
              <div className="mt-1 text-sm text-zinc-300">
                Upgrade to Pro to unlock a higher monthly generation limit.
              </div>
              <div className="mt-3">
                <Button asChild className="bg-[#6b2a8f] text-white hover:bg-[#7b34a5]">
                  <Link href="/dashboard/billing">Upgrade to Pro</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {results.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">No results yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {results.map((r) => (
                <div key={r.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-semibold text-zinc-50">{r.name}</div>
                  {r.replacedBecauseTaken && r.originalName ? (
                    <div className="mt-1 text-xs text-zinc-400">
                      {r.originalName} was taken. Suggested alternative.
                    </div>
                  ) : null}
                  {r.tagline ? <div className="mt-1 text-sm text-zinc-300">{r.tagline}</div> : null}
                  {r.availableDomains && r.availableDomains.length ? (
                    <div className="mt-2 text-xs text-zinc-300">
                      <div className="font-medium text-zinc-200">Likely available domains</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.availableDomains.slice(0, 6).map((d) => (
                          <span key={d} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-200">
                            {d}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 text-zinc-400">Verify before purchase or registration.</div>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                      onClick={async () => {
                        await navigator.clipboard.writeText(r.name);
                      }}
                      type="button"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                      disabled={saveMutation.isPending || Boolean(savedIdsByName[r.name])}
                      onClick={() => {
                        setActionError(null);
                        saveMutation.mutate({ name: r.name });
                      }}
                      type="button"
                    >
                      {savedIdsByName[r.name] ? "Saved" : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                      disabled={favoriteMutation.isPending}
                      onClick={() => {
                        setActionError(null);
                        const next = !(favoritedByName[r.name] ?? false);
                        favoriteMutation.mutate({ name: r.name, favorite: next });
                      }}
                      type="button"
                    >
                      {favoritedByName[r.name] ? "Unfavorite" : "Favorite"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
