"use client";

import { useMemo } from "react";
import { useAuth } from "./auth-context";
import { createApiClient, type ApiClient } from "./api-client";

export function useApi(): ApiClient {
  const { headers } = useAuth();
  return useMemo(() => createApiClient(headers), [headers]);
}
