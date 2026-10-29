import type { OperationOptions } from "@azure/core-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RawResponseCallback } from "@azure/core-client";

export interface ApiError {
  status: number;
  message: string;
}

interface UseApiOptions<TData, TParams extends any[]> {
  immediate?: boolean;
  initialParams?: TParams;
  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (error: ApiError | Error) => void;
  checkData?: (data: TData) => boolean;
  deps?: any[];
}

export type OperationParams<T> = Partial<OperationOptions> & T;

const useApi = <TData, TParams extends any[] = []>(
  fn: (rawResponse?: RawResponseCallback, ...params: TParams) => Promise<TData>,
  options: UseApiOptions<TData, TParams> = {}
) => {
  const { initialParams = [] as TParams, onSuccess, onError, checkData = () => true, immediate = true, deps = [] } = options;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);

  // prevent state updates on unmounted component
  useEffect(() => {
    mountedRef.current = true;
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
        if(checkData(result)) {
          setData(result);
          onSuccess?.(result, params);
        } else {
          const error = { status: 0, message: 'Data check failed' };
          setError(error);
          onError?.(error);
        }
      }
    } catch (err) {
      const error = err as ApiError;
      if (mountedRef.current) {
        setError(error);
        onError?.(err);
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
  }, [execute, immediate, ...deps]);

  return {
    data,
    error,
    loading,
    refetch: execute
  };
};

export default useApi;