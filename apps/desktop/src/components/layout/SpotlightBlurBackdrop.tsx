import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SpotlightBlurBackdropProps {
  children: React.ReactNode;
}

export const SpotlightBlurBackdrop: React.FC<SpotlightBlurBackdropProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [smoothPos, setSmoothPos] = useState({ x: 400, y: 300 });
  const [isHovered, setIsHovered] = useState(true);

  const posRef = useRef({
    targetX: 400,
    targetY: 300,
    currentX: 400,
    currentY: 300,
  });
  const rafIdRef = useRef<number | null>(null);

  // Initialize spotlight position to viewport center & listen to window resize
  useEffect(() => {
    const handleResize = () => {
      const cx = window.innerWidth / 2 || 400;
      const cy = window.innerHeight / 2 || 300;
      posRef.current.targetX = cx;
      posRef.current.targetY = cy;
      posRef.current.currentX = cx;
      posRef.current.currentY = cy;
      setSmoothPos({ x: Math.round(cx), y: Math.round(cy) });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth lerp tracking loop
  const animate = useCallback(() => {
    const { targetX, targetY, currentX, currentY } = posRef.current;
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      posRef.current.currentX += dx * 0.15;
      posRef.current.currentY += dy * 0.15;
      setSmoothPos({
        x: Math.round(posRef.current.currentX),
        y: Math.round(posRef.current.currentY),
      });
    }

    rafIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [animate]);

  // Window mouse move listener to smoothly follow cursor across entire screen
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      setIsHovered(true);
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, []);

  const spotlightMask = `radial-gradient(circle 220px at ${smoothPos.x}px ${smoothPos.y}px, transparent 0%, rgba(0,0,0,0.5) 70%, black 100%)`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center overflow-hidden"
      data-testid="spotlight-blur-backdrop"
    >
      {/* 1. Underlay Anchor Layer (Zero Duplicates, Native App Underneath) */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
        data-testid="spotlight-underlay-content"
      />

      {/* 2. Frosted Blur Overlay with Dynamic Radial Spotlight Mask Covering Entire Screen */}
      <div
        className="absolute inset-0 pointer-events-none backdrop-blur-xl bg-background/65 dark:bg-background/80 transition-opacity duration-300"
        style={{
          maskImage: spotlightMask,
          WebkitMaskImage: spotlightMask,
        }}
        data-testid="spotlight-blur-mask"
      />

      {/* 3. Invisible Spotlight Anchor & Motion State (No Visible Border Ring) */}
      <div
        className={`absolute pointer-events-none rounded-full transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: 440,
          height: 440,
          left: smoothPos.x - 220,
          top: smoothPos.y - 220,
        }}
        data-testid="spotlight-ring"
      />

      {/* 4. Foreground: Modal Window (Interactive) */}
      <div className="relative z-20 pointer-events-auto flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};
