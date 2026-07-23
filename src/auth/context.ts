import type { Membership } from "@/src/domain/model";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export interface RequestContext {
  user: AuthenticatedUser;
  membership: Membership;
  correlationId: string;
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationRequiredError";
  }
}

export class TenantContextError extends Error {
  constructor(message = "A valid MAT membership is required") {
    super(message);
    this.name = "TenantContextError";
  }
}

export function requireContext(context: RequestContext | null | undefined): RequestContext {
  if (!context?.user?.id) throw new AuthenticationRequiredError();
  if (!context.membership?.matId || context.membership.userId !== context.user.id) {
    throw new TenantContextError();
  }
  if (!context.correlationId) throw new TenantContextError("A correlation identifier is required");
  return context;
}
