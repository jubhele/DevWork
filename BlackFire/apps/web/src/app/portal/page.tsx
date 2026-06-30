import { redirect } from "next/navigation";

export default function LegacyPortalEntryPage() {
  // Preserve legacy entrypoint parity with the PHP portal URL shape.
  redirect("/dashboard");
}
