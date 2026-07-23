import { createHash } from "node:crypto";
import { can } from "@/src/domain/authorisation";
import { requireContext, type RequestContext } from "@/src/auth/context";
import type { TenantScope } from "@/src/domain/model";
import { ForbiddenError } from "./matter-service";

export interface UploadDocumentInput extends TenantScope {
  matterId: string;
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  retentionClass: string;
}

export interface StoredDocument {
  id: string;
  matterId: string;
  name: string;
  mimeType: string;
  size: number;
  checksum: string;
  retentionClass: string;
}

export interface DocumentStore {
  put(input: UploadDocumentInput & { checksum: string }): Promise<StoredDocument>;
}

const allowedTypes = new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/png","image/jpeg","text/plain","message/rfc822"]);

export class DocumentService {
  constructor(private readonly store: DocumentStore, private readonly maxBytes = 25 * 1024 * 1024) {}

  async upload(rawContext: RequestContext, input: UploadDocumentInput) {
    const context = requireContext(rawContext);
    if (!can(context.membership, input, "document:upload")) throw new ForbiddenError();
    if (!allowedTypes.has(input.mimeType)) throw new Error("Unsupported document type");
    if (!input.bytes.length || input.bytes.length > this.maxBytes) throw new Error("Document size is invalid");
    const checksum = createHash("sha256").update(input.bytes).digest("hex");
    return this.store.put({ ...input, checksum });
  }
}
