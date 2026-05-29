import axios, { AxiosError, type AxiosRequestConfig } from "axios";

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

if (typeof window !== "undefined") {
  console.log(`[API] Base URL: ${BASE_URL}`);
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20_000
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("gradify_ai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log(`[API] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data ? { body: config.data } : "");
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ← ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? "ERR";
      const data = error.response?.data;
      console.error(`[API] ✗ ${status} ${error.config?.url}`, {
        message: error.message,
        response: data,
      });
    }
    return Promise.reject(error);
  }
);

export async function apiFetch<T>(input: string, init?: AxiosRequestConfig, retries = 1): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>({
      url: input,
      ...init
    });

    if (!response.data.ok) {
      throw new Error(response.data.error.message);
    }

    return response.data.data;
  } catch (error) {
    if (retries > 0 && error instanceof AxiosError && !error.response) {
      console.warn(`[API] Retrying ${input} (attempt ${2 - retries}/1)`);
      await new Promise((resolve) => setTimeout(resolve, 350));
      return apiFetch<T>(input, init, retries - 1);
    }

    if (error instanceof AxiosError) {
      const payload = error.response?.data as ApiFailure | undefined;
      let message = payload?.error?.message ?? error.message;
      if (payload?.error?.details && typeof payload.error.details === "object") {
        const details = payload.error.details as Record<string, unknown>;
        const fieldErrors = details.fieldErrors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          const msgs = Object.entries(fieldErrors)
            .filter(([, errs]) => errs?.length > 0)
            .map(([field, errs]) => `${field}: ${errs.join(", ")}`);
          if (msgs.length > 0) message = msgs.join("; ");
        }
      }
      console.error(`[API] Error: ${message}`);
      throw new Error(message);
    }

    throw error;
  }
}
