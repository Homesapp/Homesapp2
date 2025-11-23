import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Custom error class that preserves HTTP status and parsed error data
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(text);
      // Throw ApiError with status and parsed data
      throw new ApiError(
        res.status,
        errorData.message || errorData.detail || `${res.status}: ${text}`,
        errorData
      );
    } catch (error) {
      // If error is already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }
      // Otherwise throw a generic ApiError
      throw new ApiError(res.status, `${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default (reasonable for most data)
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper function to invalidate related queries
export function invalidateRelatedQueries(baseUrl: string) {
  queryClient.invalidateQueries({ 
    predicate: (query) => 
      query.queryKey.some(key => 
        typeof key === 'string' && key.includes(baseUrl)
      )
  });
}
