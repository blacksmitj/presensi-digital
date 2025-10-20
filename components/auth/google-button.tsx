"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export function GoogleButton({
  onClick,
  loading,
}: {
  onClick?: () => void;
  loading?: boolean;
}) {
  const route = useRouter();
  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={() => route.push("/dashboard")}
      disabled={loading}
    >
      <FcGoogle className="text-lg" />
      {loading ? "Memproses..." : "Masuk dengan Google"}
    </Button>
  );
}
