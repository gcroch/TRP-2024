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

  // 1) Carga inicial
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando unidades");
        return res.json();
      })
      .then((data) => {
        // si tu API devuelve { units: [...] } haz setUnits(data.units)
        setUnits(data);
      })
      .catch(console.error);
  }, []);

  // 2) Crear unidad
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, level }),
    });

    // recarga
    const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    setUnits(refreshed);
    setTitle("");
    setLevel(1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ABM Unidades</h1>

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

      <div className="mt-4">
        <button
          onClick={() => router.push("/profile")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a Mi Perfil
        </button>
      </div>
    </div>
  );
};

export default withAuth(UnitsAdmin);
