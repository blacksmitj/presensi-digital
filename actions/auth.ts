"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";

export const logout = async () => {
  await signOut();
  console.log("keluar");

  redirect("/login");
};
