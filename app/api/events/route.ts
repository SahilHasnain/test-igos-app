import { z } from "zod";
import { apiOk, apiError } from "@/src/lib/api-handler";
import { readServerEnvironment } from "@/src/config/env";

export async function GET(request: Request) {
  const method = "GET";
  const path = "/api/events";
  try {
    const url = new URL(request.url);
    const matId = z.string().min(1).parse(url.searchParams.get("matId"));
    const matterId = url.searchParams.get("matterId") ?? undefined;
    const env = readServerEnvironment();

    if (env.IGOS_DATA_MODE === "appwrite") {
      const { Client, Databases, Query } = await import("node-appwrite");
      const client = new Client();
      client
        .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(env.APPWRITE_API_KEY);
      const databases = new Databases(client);

      const queries = [Query.equal("matId", matId), Query.orderDesc("occurredAt"), Query.limit(200)];
      if (matterId) queries.push(Query.equal("matterId", matterId));

      const result = await databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_AUDIT_TABLE_ID,
        queries,
      );

      const events = result.documents.map((doc) => ({
        id: doc.$id,
        matterId: doc.matterId ?? null,
        actorUserId: doc.actorUserId,
        action: doc.action,
        occurredAt: doc.occurredAt,
        correlationId: doc.correlationId,
        payloadHash: doc.payloadHash,
        metadata: typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata,
      }));

      return apiOk({ events });
    }

    return apiOk({ events: [] });
  } catch (cause) {
    return apiError(method, path, cause);
  }
}
