import DashboardPage from "./page";
import { BarLoader } from "react-spinners";
import { Suspense } from "react";
import { Calendar } from "lucide-react";

export default function Layout() {
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  return (
    <div className="px-5">
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-6xl font-bold tracking-tight gradient-title">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">{monthYear}</span>
        </div>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
}
