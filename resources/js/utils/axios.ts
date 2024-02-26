import axios, { AxiosError } from "axios";
import { ApiError } from "@/api";
import { useErrorStore } from "@/stores/useErrorStore";
import { CustomAxiosRequestConfig } from "@/types";

const axiosInstance = axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Request interceptor to set the CSRF token
axiosInstance.interceptors.request.use((config: CustomAxiosRequestConfig) => {
  const tokenElement = document.head.querySelector(
    'meta[name="csrf-token"]',
  ) as HTMLMetaElement | null;

  if (tokenElement) {
    config.headers = {
      ...config.headers,
      "X-CSRF-TOKEN": tokenElement.content,
    };
  } else {
    console.error(
      "CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token",
    );
  }

  return config;
});

// this interceptor is used to catch errors from the API
// convert them into API errors and store them in the error store
// so that they're displayed to the user
axiosInstance.interceptors.response.use(undefined, async (err: AxiosError) => {
  const customConfig = err.config as CustomAxiosRequestConfig;

  const errorStore = useErrorStore();
  let apiError: ApiError;

  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = (err.response.data as { message?: string }) ?? {};
    const message = data?.message ?? err.message;
    const statusCode = err.response.status;

    apiError = new ApiError(message, statusCode, data);
  } else {
    // Something happened in setting up the request that triggered an Error
    // This is likely a network error.
    apiError = new ApiError(err.message, 0); // Use 0 as the status code to signal a network error.
  }

  if (!customConfig.skipErrorNotifications) {
    // Add the ApiError to the errorStore
    errorStore.setError(apiError);
  }

  return Promise.reject(apiError);
});

declare global {
  interface Window {
    axios: typeof axiosInstance;
  }
}

window.axios = axiosInstance;

export default axiosInstance;
