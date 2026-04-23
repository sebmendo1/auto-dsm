import { redirect } from "next/navigation";

/**
 * App entry: marketing landing removed — send users to sign-in.
 */
export default function HomePage() {
  redirect("/login");
}
