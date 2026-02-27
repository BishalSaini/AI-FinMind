import React from "react";
import { checkUser } from "@/lib/checkUser";

const MainLayout = async ({ children }) => {
  // Ensure user is created in database (safety net)
  await checkUser();
  
  return <div className="container mx-auto my-32">{children}</div>;
};

export default MainLayout;
