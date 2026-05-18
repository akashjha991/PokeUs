import { redirect } from "next/navigation";

export default function InvitePage() {
  // Redirect to the dashboard where the pending invite banner will be shown.
  // If the user is not logged in, the middleware will automatically intercept
  // this and redirect them to /login first.
  redirect("/dashboard");
}
