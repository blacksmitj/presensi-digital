import { currentUser } from "@/lib/guard/auth";

const DashboardPage = async () => {
  const user = await currentUser();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <p className="text-muted-foreground">
        Ini contoh konten. Sidebar aktif mengikuti pathname.
      </p>
    </div>
  );
};

export default DashboardPage;
