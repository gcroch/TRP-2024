import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface Option { body: string; isCorrect: boolean; }
interface Question {
  _id: string;
  type: "Choice" | "OpenEntry";
  body: string;
  exp: number;
  unit_id: string;
  options?: Option[];
  expectedAnswer?: string;
  imagePath?: string;
  hint1?: string;
  hint2?: string;
}
interface Unit { _id: string; title: string; }

const EditQuestion: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = typeof window !== "undefined" ? localStorage.getItem("token")! : "";

  // ── Estados de formulario ───────────────────────────────────────────────────
  const [type, setType] = useState<"Choice"|"OpenEntry">("Choice");
  const [body, setBody] = useState("");
  const [exp, setExp] = useState(0);
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);

  const [options, setOptions] = useState<Option[]>([{ body: "", isCorrect: false }]);
  const [expectedAnswer, setExpectedAnswer] = useState("");

  const [imagePath, setImagePath] = useState<string>("");           // ruta existente :contentReference[oaicite:2]{index=2}
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const [hint1Text, setHint1Text] = useState("");
  const [hint2Text, setHint2Text] = useState("");
  const [hint1Penalty, setHint1Penalty] = useState(0.5);
  const [hint2Penalty, setHint2Penalty] = useState(0.25);
  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const headers = { "Content-Type":"application/json", Authorization:`Bearer ${token}` };

    // Obtener pregunta
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, { headers })
      .then(r => r.json())
      .then((q: Question) => {
        setType(q.type);
        setBody(q.body);
        setExp(q.exp);
        setUnitId(q.unit_id);
        if (q.options) setOptions(q.options);
        if (q.expectedAnswer) setExpectedAnswer(q.expectedAnswer);
        if (q.imagePath) setImagePath(q.imagePath);                   // cargar imagePath
        
        if (q.hint1) {
          setHint1Text(q.hint1.text || "");
          setHint1Penalty(q.hint1.penalty || 0.5);
        }
        if (q.hint2) {
          setHint2Text(q.hint2.text || "");
          setHint2Penalty(q.hint2.penalty || 0.25);
        }
      })
      .catch(console.error);

    // Obtener unidades para el select
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`, { headers })
      .then(r => r.json())
      .then(setUnits)
      .catch(console.error);
  }, [id, token]);

  // ── Subir nueva imagen ───────────────────────────────────────────────────────
  const uploadImage = async (): Promise<string | null> => {
    if (!newImageFile || !id) return null;
    const formData = new FormData();
    formData.append("image", newImageFile);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/questions/${id}/image`,
      { method: "POST", body: formData, headers: { Authorization:`Bearer ${token}` } }
    );
    const data = await res.json();
    const parts = (data.imageUrl as string).split("/");
    return parts.pop()!; // Devuelve solo el nombre de archivo
  };

  // ── Guardar cambios ─────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    let updatedImagePath = imagePath;
    if (newImageFile) {
      const newPath = await uploadImage();
      if (newPath) updatedImagePath = newPath;
    }

    const payload: any = { type, body, exp, unit_id: unitId };
    if (type === "Choice") payload.options = options;
    else payload.expectedAnswer = expectedAnswer;
    if (updatedImagePath) payload.imagePath = updatedImagePath;                 // 2) asociar ruta
    payload.hint1 = { text: hint1Text, penalty: hint1Penalty };
    payload.hint2 = { text: hint2Text, penalty: hint2Penalty };

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    router.push("/admin/questions");
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar esta pregunta?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
      method: "DELETE", headers: { Authorization:`Bearer ${token}` }
    });
    router.push("/admin/questions");
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Pregunta</h1>

      {/* Imagen actual */}
      {imagePath && (
        <div className="mb-4">
          <label className="block mb-1">Imagen actual</label>
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/back/img/${imagePath}`}
            alt="Imagen de la Pregunta"
            className="border rounded max-w-full h-auto"
          />
        </div>
      )}

      {/* Input para nueva imagen */}
      <div className="mb-4">
        <label className="block mb-1">Subir nueva imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setNewImageFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Tipo, Texto, XP, Unidad, Opciones… */}
        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="border px-2 py-1 w-full"
          >
            <option value="Choice">Choice</option>
            <option value="OpenEntry">OpenEntry</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Texto de la pregunta</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="border px-2 py-1 w-full"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Exp (XP)</label>
          <input
            type="number"
            value={exp}
            onChange={e => setExp(Number(e.target.value))}
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Unidad</label>
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          >
            <option value="">– Seleccione unidad –</option>
            {units.map(u => (
              <option key={u._id} value={u._id}>{u.title}</option>
            ))}
          </select>
        </div>

        {type === "Choice" ? (
          <div className="space-y-2">
            <label className="block mb-1">Opciones (marcar la correcta)</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt.body}
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[idx].body = e.target.value;
                    setOptions(newOpts);
                  }}
                  className="border px-2 py-1 flex-grow"
                  placeholder={`Opción ${idx + 1}`}
                  required
                />
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() =>
                      setOptions(options.map((o,i)=>({ ...o, isCorrect: i===idx })))
                    }
                  />
                  Correcta
                </label>
                {options.length>1 && (
                  <button
                    type="button"
                    onClick={()=>setOptions(options.filter((_,i)=>i!==idx))}
                    className="text-red-500"
                  >×</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={()=>setOptions([...options,{body:"",isCorrect:false}])}
              className="text-blue-600 hover:underline text-sm mt-1"
            >+ Agregar otra opción</button>
          </div>
        ) : (
          <div>
            <label className="block mb-1">Respuesta esperada</label>
            <input
              value={expectedAnswer}
              onChange={e=>setExpectedAnswer(e.target.value)}
              className="border px-2 py-1 w-full"
              required
            />
          </div>
        )}
        <div>
          <label className="block mb-1">Ayuda 1</label>
          <input
            type="text"
            value={hint1Text}
            onChange={e => setHint1Text(e.target.value)}
            className="border px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Ayuda 2</label>
          <input
            type="text"
            value={hint2Text}
            onChange={e => setHint2Text(e.target.value)}
            className="border px-2 py-1 w-full"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Guardar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >Eliminar</button>
          <button
            type="button"
            onClick={()=>router.push(`/admin/questions/${id}/answers`)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >Ver respuestas</button>
        </div>
      </form>

      <div className="mb-4">
        <button
          onClick={() => router.push("/admin/questions")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a adm preguntas
        </button>
      </div>
    </div>
  );
};

export default withAuth(EditQuestion);
