// lib/api.js
import { useAuth } from "@/context/AuthContext";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000"; // fallback

export async function apiCall({
  endpoint,
  method = "GET",
  data = null,
  token = null,
  params = null,
}) {
  // Construct full URL with query params
  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  if (params && typeof params === "object") {
    const query = new URLSearchParams(params).toString();
    if (query) url += `?${query}`;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  // Only attach body for methods that support it
  if (data && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);

    const contentType = res.headers.get("Content-Type");
    const isJson = contentType && contentType.includes("application/json");
    const result = isJson ? await res.json() : null;

    if (!res.ok) {
      throw new Error(result?.message || `API Error: ${res.status}`);
    }

    return result;
  } catch (err) {
    console.error("API Call Error:", err);
    throw err;
  }
}

// React hook for calling API with token auto-injected
export function useApi() {
  const { auth } = useAuth();

  return async function (args) {
    return apiCall({ ...args, token: auth?.token });
  };
}
