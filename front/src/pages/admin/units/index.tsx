// pages/admin/units/index.tsx
import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface Unit {
  _id: string;
  title: string;
  level: number;
}

const UnitsAdmin: NextPage = () => {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<number>(1);
  const token = localStorage.getItem("token");

  // 1) Carga inicial
  useEffect(() => {
    fetch("http://127.0.0.1:5000/units", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setUnits)
      .catch(console.error);
  }, []);

  // 2) Crear unidad
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("http://127.0.0.1:5000/units", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, level }),
    });
    // Recarga la lista
    const refreshed = await fetch("http://127.0.0.1:5000/units", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
    setUnits(refreshed);
    setTitle("");
    setLevel(1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ABM Unidades</h1>

      {/* Listado */}
      <table className="w-full table-auto border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Level</th>
            <th className="border px-2 py-1">Title</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u._id}>
              <td className="border px-2 py-1">{u.level}</td>
              <td className="border px-2 py-1">{u.title}</td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => router.push(`/admin/units/${u._id}`)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario de creación */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label className="block">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block">Nivel</label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Crear Unidad
        </button>
      </form>
    </div>
  );
};

export default withAuth(UnitsAdmin);
