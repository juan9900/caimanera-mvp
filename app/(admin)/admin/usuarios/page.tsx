import { getAllUsers } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui/page-header";
import { UsuariosTable } from "@/components/admin/usuarios-table";

export default async function AdminUsuariosPage() {
  const users = await getAllUsers();

  return (
    <div>
      <PageHeader title={`Usuarios (${users.length})`} />
      <UsuariosTable users={users} />
    </div>
  );
}
