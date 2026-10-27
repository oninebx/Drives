import { useCallback, useEffect, useRef, useState } from "react";

interface ApiError {
  status: number;
  message: string;
}

const useApi = <TData, TParams extends any[]>(
  fn: (...params: TParams) => Promise<TData>,
  options?: {
    immediate?: boolean;
    initialParams?: TParams;
    onSuccess?: (data: TData, params: TParams) => void;
    onError?: (error: ApiError) => void;
    deps?: any[];
  }
) => {
  const { initialParams, onSuccess, onError, immediate = true, deps = [] } = options || {};

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);

  // prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...params: TParams) => {
    try {
      setLoading(true);
      setData(null);
      setError(null);
      const result = await fn(...params);
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result, params);
      }
    } catch (err) {
      const error = err as ApiError;
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fn, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute(...((initialParams || []) as TParams));
    }
  }, deps);

  return {
    data,
    error,
    loading,
    refetch: execute
  };
};

export default useApi;