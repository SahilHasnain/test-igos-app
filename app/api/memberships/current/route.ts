import { NextResponse } from "next/server";
import { Account, Client, Query } from "node-appwrite";
import { createAppwriteAdmin } from "@/src/appwrite/server";
import { readServerEnvironment } from "@/src/config/env";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  try {
    const env = readServerEnvironment();
    const client = new Client()
      .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setJWT(jwt);

    const account = await new Account(client).get();
    const admin = createAppwriteAdmin();

    const result = await admin.databases.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MEMBERSHIPS_TABLE_ID,
      [
        Query.equal("userId", account.$id),
        Query.equal("status", "active"),
      ]
    );

    if (result.documents.length === 0) {
      return NextResponse.json({ roles: ["read-only"], academyIds: [] });
    }

    const primary = result.documents[0] as typeof result.documents[number] & {
      academyIds?: string[];
      roles?: string[];
    };

    return NextResponse.json({
      roles: primary.roles ?? ["read-only"],
      academyIds: primary.academyIds ?? [],
      matId: primary.matId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve memberships";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
