import { AuthCard } from "@/components/layout/auth-card";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  return (
    <AuthCard title="Selamat Datang 👋">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Silakan masuk menggunakan akun Google Anda untuk melanjutkan.
        </p>
        <GoogleButton />
      </div>
    </AuthCard>
  );
}
