"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export function GoogleButton({ loading }: { loading?: boolean }) {
  const onClick = () => {
    signIn("google", {
      callbackUrl: "/dashboard",
    });
  };
  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={() => onClick()}
      disabled={loading}
    >
      <FcGoogle className="text-lg" />
      {loading ? "Memproses..." : "Masuk dengan Google"}
    </Button>
  );
}
