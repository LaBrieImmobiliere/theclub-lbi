"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { haptic } from "@/lib/haptic";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 70;

  const isAtTop = useCallback(() => {
    // Check both window scroll and any scrollable parent
    if (window.scrollY > 0) return false;
    // Also check if any parent is scrolled
    let el = containerRef.current?.parentElement;
    while (el) {
      if (el.scrollTop > 0) return false;
      el = el.parentElement;
    }
    return true;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (isAtTop()) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && isAtTop()) {
        // Prevent native scroll while pulling
        e.preventDefault();
        const distance = Math.min(diff * 0.4, 100);
        setPullDistance(distance);
      } else {
        // User scrolled up or page is not at top anymore
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance >= threshold) {
        setRefreshing(true);
        setPullDistance(40);
        try {
          await onRefresh();
          haptic("success");
        } catch (err) {
          console.error("Refresh failed:", err);
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    // Use document-level listeners to catch all touches
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing, pullDistance, threshold, onRefresh, isAtTop]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all duration-150"
          style={{ height: pullDistance }}
        >
          <div
            className={refreshing ? "animate-spin" : ""}
            style={{
              opacity: Math.min(pullDistance / threshold, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          >
            <svg className="w-6 h-6 text-[#D1B280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </div>
          {pullDistance >= threshold && !refreshing && (
            <span className="text-[10px] text-[#D1B280] ml-2">Relâchez</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
