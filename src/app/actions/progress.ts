"use server";

import { auth } from "@/auth";
import { snapshotProgress } from "@/lib/progress";

export async function saveProgressSnapshotAction() {
  const s = await auth();
  if (!s?.user?.id) return;
  await snapshotProgress(s.user.id, "manual");
}
