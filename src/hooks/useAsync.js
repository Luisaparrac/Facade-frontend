import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async function when its dependencies change.
 * If the function returns null/undefined, the request is skipped.
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const promise = asyncFn();

    if (!promise) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }

    setState((previous) => ({ ...previous, error: null, loading: true }));
    promise
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState((previous) => ({ ...previous, error, loading: false })));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}
