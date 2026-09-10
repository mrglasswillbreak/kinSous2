import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import AdminPanel from "./panel";
export default async function AdminPage() {
  if (!(await getAdmin())) notFound();
  return <AdminPanel />;
}
