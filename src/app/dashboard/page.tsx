import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/interview?tab=dashboard");
}
