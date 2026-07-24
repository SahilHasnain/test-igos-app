import { ID, Query, type Databases } from "node-appwrite";
import type { NotificationReceipt, NotificationReceiptStore } from "@/src/services/notification-service";

function toReceipt(document: Record<string, unknown>): NotificationReceipt {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    provider: document.provider as string,
    externalId: document.externalId as string,
    purpose: document.purpose as NotificationReceipt["purpose"],
    recipients: (document.recipients as string[]) || [],
    sentAt: document.sentAt as string,
    matterId: (document.matterId as string) || undefined,
    idempotencyKey: document.idempotencyKey as string,
  };
}

export class AppwriteNotificationReceiptStore implements NotificationReceiptStore {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async findByIdempotencyKey(matId: string, idempotencyKey: string): Promise<NotificationReceipt | null> {
    try {
      const result = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("matId", matId),
          Query.equal("idempotencyKey", idempotencyKey),
          Query.limit(1),
        ]
      );
      if (result.documents.length === 0) return null;
      return toReceipt(result.documents[0] as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async save(receipt: NotificationReceipt): Promise<NotificationReceipt> {
    const document = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      {
        matId: receipt.matId,
        academyId: null,
        matterId: receipt.matterId ?? null,
        provider: receipt.provider,
        externalId: receipt.externalId,
        purpose: receipt.purpose,
        recipients: JSON.stringify(receipt.recipients),
        sentAt: receipt.sentAt,
        idempotencyKey: receipt.idempotencyKey,
      }
    );
    return toReceipt(document as Record<string, unknown>);
  }
}
