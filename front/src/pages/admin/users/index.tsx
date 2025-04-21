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

const UsersAdmin: NextPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [DNI, setDNI] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/users", {
      headers: { Authorization:`Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const formatted = data.map((u: any) => ({
          ...u,
          _id: u.user_id?.$oid || "",  // 👈 agrega un _id string plano
        }));
        console.log("Usuarios transformados:", formatted);
        setUsers(formatted);
      });
  }, []);

  const handleCreate = async (e:FormEvent) => {
    e.preventDefault();
    await fetch("http://127.0.0.1:5000/register", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify({ DNI, name, lastname, email })
    });
    const updated = await fetch("http://127.0.0.1:5000/users", {
      headers:{ Authorization:`Bearer ${token}` }
    }).then(r=>r.json());
    setUsers(updated);
    setDNI(""); setName(""); setLastname(""); setEmail("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ABM Usuarios</h1>
      <table className="w-full table-auto border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">DNI</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Rol</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u=>(
            <tr key={u._id}>
              <td className="border px-2 py-1">{u.DNI}</td>
              <td className="border px-2 py-1">{u.name} {u.lastname}</td>
              <td className="border px-2 py-1">{u.email}</td>
              <td className="border px-2 py-1">{u.role}</td>
              <td className="border px-2 py-1">
                <button
                  onClick={()=>router.push(`/admin/users/${u._id}`)}
                  className="text-blue-600 hover:underline"
                >Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleCreate} className="space-y-3">
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
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Crear Usuario
        </button>
        <button
          onClick={() => router.push("/admin/users/report")}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Ver Reporte Global
        </button>
      </form>
    </div>
  );
};

export default withAuth(UsersAdmin);
