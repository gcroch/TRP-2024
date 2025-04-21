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
  const token = localStorage.getItem("token");

  // 1) Cargar datos de la unidad
  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:5000/units/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => {
        setTitle(u.title);
        setLevel(u.level);
      })
      .catch(console.error);
  }, [id]);

  // 2) Guardar cambios
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await fetch(`http://127.0.0.1:5000/units/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, level }),
    });
    router.push("/admin/units");
  };

  // 3) Eliminar
  const handleDelete = async () => {
    const warning =
      "⚠️ Al borrar esta unidad, todas las preguntas asociadas perderán su vínculo y dejarán de mostrarse.\n\n" +
      "¿Seguro que quieres continuar?";
    if (!confirm(warning)) return;
  
    await fetch(`http://127.0.0.1:5000/units/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    router.push("/admin/units");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Unidad</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label>Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label>Nivel</label>
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
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Eliminar
          </button>
        </div>
      </form>
    </div>
  );
};

export default withAuth(EditUnit);
