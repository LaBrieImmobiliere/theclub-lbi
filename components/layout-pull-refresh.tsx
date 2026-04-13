"use client";

import { useCallback } from "react";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useRouter } from "next/navigation";

/**
 * Wrap any layout's children with pull-to-refresh.
 * On refresh, it calls router.refresh() to re-fetch server data.
 */
export function LayoutPullRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    router.refresh();
    // Small delay to let the refresh complete visually
    await new Promise((r) => setTimeout(r, 500));
  }, [router]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}
