"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

type GenerateInput = {
  description: string;
  industry: string;
  tone: string;
  keywords?: string;
};

type Generated = {
  name: string;
  tagline?: string;
  domainHint?: string;
};

export default function GeneratePage() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState("");

  const [results, setResults] = useState<Generated[]>([]);
  const [savedIdsByName, setSavedIdsByName] = useState<Record<string, string>>({});
  const [favoritedByName, setFavoritedByName] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const generateMutation = useMutation({
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

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
      }

      return buf;
    },
    onSuccess: (raw) => {
      try {
        const parsed = JSON.parse(raw) as { suggestions: Generated[] };
        setResults(parsed.suggestions);
        setSavedIdsByName({});
        setFavoritedByName({});
      } catch {
        setResults([]);
        setSavedIdsByName({});
        setFavoritedByName({});
      }
    },
    onError: (err) => {
      if ((err as Error).message === "Usage limit reached") {
        setActionError("You reached your monthly generation limit.");
        return;
      }
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
    },
    onError: () => {
      setActionError("Unable to save name.");
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
    },
    onError: () => {
      setActionError("To favorite a name, save it first.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Generate business names</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Describe your business and get 10–20 brandable name ideas.
        </p>

        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            generateMutation.mutate({
              description,
              industry,
              tone,
              keywords: keywords.length ? keywords : undefined,
            });
          }}
        >
          <div className="grid gap-2">
            <label className="text-sm font-medium">Business description</label>
            <textarea
              className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Industry</label>
              <input
                className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tone</label>
              <select
                className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
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
            <label className="text-sm font-medium">Keywords (optional)</label>
            <input
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. rapid, cloud, finance"
            />
          </div>

          <button
            disabled={generateMutation.isPending}
            className="h-11 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
          >
            {generateMutation.isPending ? "Generating..." : "Generate"}
          </button>

          {generateMutation.isError ? (
            <p className="text-sm text-red-600">Unable to generate names right now.</p>
          ) : null}
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Suggestions</div>
        {actionError ? <p className="mt-2 text-sm text-red-600">{actionError}</p> : null}
        {limitReached ? (
          <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-medium">Upgrade to keep generating</div>
            <div className="mt-1 text-sm text-zinc-600">
              Upgrade to Pro to unlock a higher monthly generation limit.
            </div>
            <div className="mt-3">
              <Link
                className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white"
                href="/dashboard/billing"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        ) : null}
        {results.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No results yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {results.map((r) => (
              <div key={r.name} className="rounded-lg border border-zinc-100 p-4">
                <div className="font-semibold">{r.name}</div>
                {r.tagline ? <div className="mt-1 text-sm text-zinc-600">{r.tagline}</div> : null}
                {r.domainHint ? (
                  <div className="mt-1 text-xs text-zinc-500">{r.domainHint}</div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(r.name);
                    }}
                    type="button"
                  >
                    Copy
                  </button>
                  <button
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm"
                    disabled={saveMutation.isPending || Boolean(savedIdsByName[r.name])}
                    onClick={() => {
                      setActionError(null);
                      saveMutation.mutate({ name: r.name });
                    }}
                    type="button"
                  >
                    {savedIdsByName[r.name] ? "Saved" : "Save"}
                  </button>
                  <button
                    className="h-9 rounded-md border border-zinc-200 px-3 text-sm"
                    disabled={favoriteMutation.isPending}
                    onClick={() => {
                      setActionError(null);
                      const next = !(favoritedByName[r.name] ?? false);
                      favoriteMutation.mutate({ name: r.name, favorite: next });
                    }}
                    type="button"
                  >
                    {favoritedByName[r.name] ? "Unfavorite" : "Favorite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
