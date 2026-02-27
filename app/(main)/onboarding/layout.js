import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }) {
  // Ensure user is created in database when they first sign up
  const user = await checkUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
