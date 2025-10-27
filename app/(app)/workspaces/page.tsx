import { getWorkspaces } from "@/lib/api/workspace";

const WorkspacesPage = async () => {
  const data = await getWorkspaces();
  console.log(data);
  return <div>WorkspacesPage</div>;
};

export default WorkspacesPage;
