import { redirect } from "next/navigation"

export default function StoreHomeLegacyRedirect() {
  redirect("/dashboard/settings/page-builder")
}
