import React from 'react';

// Returns true when the viewport is at/below `breakpoint` (default 768px),
// kept in sync via matchMedia. Mirrors the CSS breakpoint used in index.css
// for the sidebar -> bottom-tab-bar switch.
export function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint}px)`;
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [isMobile, setIsMobile] = React.useState(get);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    // addEventListener('change') is supported in all modern browsers
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}
