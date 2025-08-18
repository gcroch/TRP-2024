import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface User {
  _id: string;
  DNI: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
}

const EditUser: NextPage = () => {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [DNI, setDNI] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user"|"docente"|"admin">("user");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const queryId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
    if (!queryId) return;

    setId(queryId);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${queryId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(r => r.json())
      .then((u: User) => {
        setDNI(u.DNI);
        setName(u.name);
        setLastname(u.lastname);
        setEmail(u.email);
        setRole(u.role as any);
      })
      .catch(err => console.error("Error al traer usuario:", err));
  }, [router.isReady]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;

    const payload: any = { DNI, name, lastname, email, role };
    if (password) payload.password = password;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify(payload)
    });
    router.push("/admin/users");
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = confirm("¿Estás seguro de que deseas eliminar este usuario?");
    if (!confirmed) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    router.push("/admin/users");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Usuario</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          placeholder="DNI" value={DNI} onChange={e=>setDNI(e.target.value)}
          className="border px-2 py-1 w-full" required
        />
        <input
          placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}
          className="border px-2 py-1 w-full" required
        />
        <input
          placeholder="Apellido" value={lastname} onChange={e=>setLastname(e.target.value)}
          className="border px-2 py-1 w-full"
        />
        <input
          placeholder="Email" type="email" value={email}
          onChange={e=>setEmail(e.target.value)}
          className="border px-2 py-1 w-full" required
        />
        <div>
          <label>Rol</label>
          <select
            value={role}
            onChange={e=>setRole(e.target.value as any)}
            className="border px-2 py-1 w-full"
          >
            <option value="user">Usuario</option>
            <option value="docente">Docente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <input
          placeholder="Nueva contraseña" type="password" value={password}
          onChange={e=>setPassword(e.target.value)}
          className="border px-2 py-1 w-full" 
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Guardar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
        >
          Eliminar Usuario
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("ID antes del push:", id);
            router.push(`/admin/users/${id}/report`);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded mt-4"
        >
          Ver Respuestas del Usuario
        </button>
      </form>

      <div className="mb-4">
        <button
          onClick={() => router.push("/admin/users")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a adm usuarios
        </button>
      </div>
    </div>
  );
};

export default withAuth(EditUser);
