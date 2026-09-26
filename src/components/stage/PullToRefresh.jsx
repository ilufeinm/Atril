import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const tracking = useRef(false);
  const dist = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY <= 0 && !busy.current) {
        startY.current = e.touches[0].clientY;
        tracking.current = true;
      }
    };
    const onMove = (e) => {
      if (!tracking.current || busy.current) return;
      const d = e.touches[0].clientY - startY.current;
      if (d > 0) {
        dist.current = d;
        setPull(Math.min(d * 0.5, 90));
      }
    };
    const onEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      if (dist.current > THRESHOLD && !busy.current) {
        busy.current = true;
        setRefreshing(true);
        setPull(0);
        try { await onRefresh(); } finally { busy.current = false; setRefreshing(false); }
      } else {
        setPull(0);
      }
      dist.current = 0;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onRefresh]);

  const show = refreshing || pull > 0;
  return (
    <div className="relative">
      {show && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center text-[#c9ef72] overflow-hidden"
          style={{ height: refreshing ? 44 : pull, transition: 'height .15s ease' }}
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </div>
      )}
      {children}
    </div>
  );
}