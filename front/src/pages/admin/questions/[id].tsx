// src/pages/admin/questions/[id].tsx
import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface Option {
  body: string;
  isCorrect: boolean;
}

interface Question {
  _id: string;
  type: "Choice" | "OpenEntry";
  body: string;
  exp: number;
  unit_id: string;
  options?: Option[];
  expectedAnswer?: string;
}

interface Unit {
  _id: string;
  title: string;
}

const EditQuestion: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = localStorage.getItem("token")!;
  
  // estados del formulario
  const [type, setType] = useState<"Choice"|"OpenEntry">("Choice");
  const [body, setBody] = useState("");
  const [exp, setExp] = useState(0);
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  
  // para Choice
  const [options, setOptions] = useState<Option[]>([
    { body: "", isCorrect: false }
  ]);
  // para OpenEntry
  const [expectedAnswer, setExpectedAnswer] = useState("");

  // 1) cargar datos al montar
  useEffect(() => {
    if (!id) return;
    const headers = { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
    // pregunta
    fetch(`http://127.0.0.1:5000/questions/${id}`, { headers })
      .then(r => r.json())
      .then((q: Question) => {
        setType(q.type);
        setBody(q.body);
        setExp(q.exp);
        setUnitId(q.unit_id);
        if (q.type === "Choice" && q.options) {
          setOptions(q.options);
        }
        if (q.type === "OpenEntry") {
          setExpectedAnswer(q.expectedAnswer || "");
        }
      });
    // unidades para el select
    fetch("http://127.0.0.1:5000/units", { headers })
      .then(r => r.json())
      .then(setUnits);
  }, [id, token]);

  // 2) manejar submit (PUT)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = {
      type,
      body,
      exp,
      unit_id: unitId
    };
    if (type === "Choice") {
      payload.options = options;
    } else {
      payload.expectedAnswer = expectedAnswer;
    }
    await fetch(`http://127.0.0.1:5000/questions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    router.push("/admin/questions");
  };

  // 3) eliminar
  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar esta pregunta?")) return;
    await fetch(`http://127.0.0.1:5000/questions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    router.push("/admin/questions");
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Pregunta</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Tipo */}
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

        {/* Texto */}
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

        {/* XP */}
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

        {/* Unidad */}
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
              <option key={u._id} value={u._id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>

        {/* Campos según tipo */}
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
                    onChange={() => {
                      setOptions(options.map((o, i) => ({
                        ...o,
                        isCorrect: i === idx
                      })));
                    }}
                  />
                  Correcta
                </label>
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOptions(options.filter((_, i) => i !== idx))
                    }
                    className="text-red-500"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOptions([...options, { body: "", isCorrect: false }])}
              className="text-blue-600 hover:underline text-sm mt-1"
            >
              + Agregar otra opción
            </button>
          </div>
        ) : (
          <div>
            <label className="block mb-1">Respuesta esperada</label>
            <input
              value={expectedAnswer}
              onChange={e => setExpectedAnswer(e.target.value)}
              className="border px-2 py-1 w-full"
              required
            />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 pt-4">
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

export default withAuth(EditQuestion);
