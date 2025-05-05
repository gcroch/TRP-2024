// pages/admin/units/[id].tsx
import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

const EditUnit: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // 1) Cargar datos de la unidad
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/units/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unidad no encontrada");
        return r.json();
      })
      .then((data) => {
        // si tu API envía { unit: {...} }
        const u = data.unit ?? data;
        setTitle(u.title);
        setLevel(u.level);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== "string") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, level }),
    });
    router.push("/admin/units");
  };

  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const warning =
      "⚠️ Al borrar esta unidad, todas las preguntas asociadas perderán su vínculo.\n\n¿Continuar?";
    if (!confirm(warning)) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    router.push("/admin/units");
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Unidad</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block mb-1">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Nivel</label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Eliminar
          </button>
        </div>
      </form>
      <div className="mt-4">
        <button
          onClick={() => router.push("/admin/units")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Volver a adm unidades
        </button>
      </div>
    </div>
  );
};

export default withAuth(EditUnit);
