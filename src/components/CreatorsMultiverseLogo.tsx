// src/components/CreatorsMultiverseLogo.tsx
import React, { useEffect, useRef } from 'react';

interface CreatorsMultiverseLogoProps {
  className?: string;
}

const CreatorsMultiverseLogo: React.FC<CreatorsMultiverseLogoProps> = ({ className }) => {
  const orbit1Ref = useRef<SVGGElement>(null);
  const orbit2Ref = useRef<SVGGElement>(null);
  const orbit3Ref = useRef<SVGGElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const orbit1 = orbit1Ref.current;
    const orbit2 = orbit2Ref.current;
    const orbit3 = orbit3Ref.current;

    if (!orbit1 || !orbit2 || !orbit3) {
      return;
    }

    const duration1 = 20000; // 20 seconds
    const duration2 = 15000; // 15 seconds (reverse)
    const duration3 = 25000; // 25 seconds

    let startTime = 0;

    function animate(timestamp: number) {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      const rot1 = (360 * (elapsed / duration1)) % 360;
      const rot2 = (-360 * (elapsed / duration2)) % 360; // Negative for reverse rotation
      const rot3 = (360 * (elapsed / duration3)) % 360;

      // Apply the transform directly to the SVG groups,
      // explicitly rotating around the (100, 100) point, which is the
      // center of the ellipses within these groups.
      // This replicates the behavior of transform-origin: center for this specific geometry.
      orbit1.setAttribute('transform', `rotate(${rot1} 100 100)`);
      orbit2.setAttribute('transform', `rotate(${rot2} 100 100)`);
      orbit3.setAttribute('transform', `rotate(${rot3} 100 100)`);
      
      animationFrameId.current = requestAnimationFrame(animate);
    }

    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

  // The SVG structure is kept as close as possible to the original HTML.
  // JSX requires camelCase for attributes like strokeWidth, strokeLinecap, strokeLinejoin.
  // IDs for gradients/filters are made unique to avoid conflicts if other SVGs exist.
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }} // Ensure glows aren't cut off
    >
      <defs>
        <linearGradient id="cm-electric-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00D4FF' }} />
          <stop offset="100%" style={{ stopColor: '#5B5FEE' }} />
        </linearGradient>
        <filter id="cm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit System 1 */}
      {/* The outer <g> provides the initial static tilt around (100,100) of the SVG canvas. */}
      {/* The inner <g> (with ref) is what gets animated. Its own transform will be rotate(angle 100 100) */}
      <g transform="rotate(25 100 100)" filter="url(#cm-glow)">
        {/* This 'g' element used to have class="orbit". We now control its transform directly via ref. */}
        <g ref={orbit1Ref}>
          <ellipse cx="100" cy="100" rx="90" ry="40" fill="none" stroke="url(#cm-electric-gradient)" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="100" cy="60" r="2.5" fill="#00D4FF" />
        </g>
      </g>

      {/* Orbit System 2 */}
      <g filter="url(#cm-glow)">
        <g ref={orbit2Ref}>
          <ellipse cx="100" cy="100" rx="70" ry="70" fill="none" stroke="url(#cm-electric-gradient)" strokeWidth="1" opacity="0.8" />
          <circle cx="100" cy="30" r="3.5" fill="#FFFFFF" />
        </g>
      </g>

      {/* Orbit System 3 */}
      <g transform="rotate(-35 100 100)" filter="url(#cm-glow)">
         <g ref={orbit3Ref}>
            <ellipse cx="100" cy="100" rx="55" ry="80" fill="none" stroke="#00D4FF" strokeWidth="0.75" opacity="0.5"/>
            <circle cx="45" cy="100" r="2" fill="#5B5FEE" />
        </g>
      </g>

      {/* Central Element: Abstract 'CM' monogram */}
      <g>
        <path d="M 125,70 A 45,45 0 1 0 125, 130" fill="none" stroke="url(#cm-electric-gradient)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 85,130 L 85,70 L 100,90 L 115,70 L 115,130" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
};

export default CreatorsMultiverseLogo;