import { useCallback, useEffect, useState } from "react";

/**
 * Menjalankan fungsi async (misalnya panggilan API) dan menyimpan
 * status loading / error / data. Mirip FutureBuilder di Flutter.
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(asyncFn, deps);

  const reload = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => active && setState({ loading: false, error: null, data }))
      .catch((error) => active && setState({ loading: false, error, data: null }));
    return () => {
      active = false;
    };
  }, [run]);

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}
