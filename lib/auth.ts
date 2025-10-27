import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};

export const requireSession = async () => {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      statusText: "Unauthorized",
    });
  }
  return session;
};
