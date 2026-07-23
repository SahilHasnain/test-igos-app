import { Account, Client, Query } from "node-appwrite";
import { randomUUID } from "node:crypto";
import type { RequestContext } from "./context";
import type { Membership, Role } from "@/src/domain/model";
import { createAppwriteAdmin } from "@/src/appwrite/server";
import { readServerEnvironment } from "@/src/config/env";

function bearer(request: Request): string {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new Error("A valid Appwrite JWT is required");
  return value.slice(7);
}

export async function resolveRequestContext(request: Request, matId: string): Promise<RequestContext> {
  const env = readServerEnvironment();
  const client = new Client().setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setJWT(bearer(request));
  const account = await new Account(client).get();

  const admin = createAppwriteAdmin();
  const result = await admin.databases.listDocuments(env.APPWRITE_DATABASE_ID, env.APPWRITE_MEMBERSHIPS_TABLE_ID, [
    Query.equal("matId", matId),
    Query.equal("userId", account.$id),
    Query.equal("status", "active"),
    Query.limit(1)
  ]);
  const document = result.documents[0] as typeof result.documents[number] & { academyIds?: string[]; roles: Role[] };
  if (!document) throw new Error("No active MAT membership was found");

  const membership: Membership = { userId: account.$id, matId, academyIds: document.academyIds ?? [], roles: document.roles };
  return {
    user: { id: account.$id, email: account.email, name: account.name },
    membership,
    correlationId: request.headers.get("x-correlation-id") ?? randomUUID()
  };
}
