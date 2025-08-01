import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollManager = () => {
  const { pathname, hash, key } = useLocation();
  const prevPathname = useRef<string>();

  useEffect(() => {
    // Don't scroll if only hash changed (for anchor links)
    if (prevPathname.current === pathname && hash) {
      // Let browser handle hash navigation
      return;
    }

    // Routes where we don't want to scroll to top
    const noScrollRoutes = [
      '/auth/callback', // Loading states
      // Add other routes as needed
    ];

    if (noScrollRoutes.includes(pathname)) {
      return;
    }

    // Slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (hash) {
        // Try to scroll to hash element
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);

    prevPathname.current = pathname;

    return () => clearTimeout(timeoutId);
  }, [pathname, hash]);

  return null;
};

export default ScrollManager;