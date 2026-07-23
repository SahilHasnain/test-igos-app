import { describe, expect, it } from "vitest";
import { scanDeadlines } from "../src/jobs/deadline-scan";
import type { Matter } from "../src/domain/model";

const matter = (id:string,due:string,status:Matter["status"]="open"):Matter => ({id,reference:id,type:"sar",status,title:id,ownerUserId:"u1",matId:"m1",academyId:"a1",statutoryDueAt:due,createdAt:"2026-07-01",updatedAt:"2026-07-01",version:1});

describe("deadline scanner", () => {
  it("sorts overdue and critical cases first", () => {
    const result=scanDeadlines(new Date("2026-07-23T12:00:00Z"),[matter("later","2026-08-10T12:00:00Z"),matter("overdue","2026-07-20T12:00:00Z"),matter("critical","2026-07-25T12:00:00Z")]);
    expect(result.map(x=>x.reference)).toEqual(["overdue","critical","later"]);
    expect(result[0].level).toBe("overdue");
  });
  it("excludes closed cases",()=>expect(scanDeadlines(new Date("2026-07-23"),[matter("closed","2026-07-20","closed")])).toHaveLength(0));
});
