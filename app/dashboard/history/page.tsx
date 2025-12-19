"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type NamesHistoryResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string;
    name: string;
    description: string;
    industry: string;
    tone: string;
    keywords: string | null;
    createdAt: string;
    isFavorite: boolean;
  }>;
};

export default function HistoryPage() {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ["names", "history", page], [page]);

  const removeMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      const res = await fetch("/api/names/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedNameId: input.id }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["names", "history"] });
      await queryClient.invalidateQueries({ queryKey: ["names"] });
    },
  });

  const namesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<NamesHistoryResponse> => {
      const res = await fetch(`/api/names?page=${page}&limit=${pageSize}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const total = namesQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_70px_-50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-zinc-50">History</CardTitle>
          <CardDescription>All your saved generated names.</CardDescription>
        </CardHeader>
        <CardContent>
          {namesQuery.isError ? (
            <p className="text-sm text-zinc-400">Unable to load history.</p>
          ) : namesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-72" />
                  <Skeleton className="mt-3 h-3 w-40" />
                </div>
              ))}
            </div>
          ) : namesQuery.data?.items?.length ? (
            <div className="space-y-3">
              {namesQuery.data.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-50">{item.name}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-zinc-300">{item.description}</div>
                      <div className="mt-2 text-xs text-zinc-400">
                        {new Date(item.createdAt).toLocaleString()} · {item.industry} · {item.tone}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-300">
                        {item.isFavorite ? "Favorite" : "Saved"}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate({ id: item.id })}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  Page {page} of {pageCount} · {total} total
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                    disabled={!canPrev || namesQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/15 bg-white/[0.04] text-zinc-50 hover:bg-white/10"
                    disabled={!canNext || namesQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-medium text-zinc-50">No history yet</div>
              <div className="mt-1 text-sm text-zinc-300">Generate names and save them to see them here.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
