export const getWorkspaces = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workspaces`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch workspaces");
  }

  return res.json();
};
