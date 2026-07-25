"use client";

import { useMemo } from "react";
import { useAuth } from "./auth-context";
import { createApiClient, type ApiClient } from "./api-client";

export function useApi(): ApiClient {
  const { headers, refreshJwt } = useAuth();
  return useMemo(() => createApiClient(headers, refreshJwt), [headers, refreshJwt]);
}
