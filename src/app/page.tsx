import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirigir automáticamente al dashboard o al login
  redirect("/dashboard");
}
