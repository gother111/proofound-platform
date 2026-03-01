import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setValue(false);
      return;
    }

    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    if (typeof result.addEventListener === 'function') {
      result.addEventListener('change', onChange);
    } else {
      result.addListener(onChange);
    }
    setValue(result.matches);

    return () => {
      if (typeof result.removeEventListener === 'function') {
        result.removeEventListener('change', onChange);
      } else {
        result.removeListener(onChange);
      }
    };
  }, [query]);

  return value;
}
