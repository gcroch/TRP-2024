import { NextPage } from "next";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface Question {
  _id: string;
  type: "Choice" | "OpenEntry";
  body: string;
  exp: number;
  unit_id: string;
}

interface Unit {
  _id: string;
  title: string;
}

const QuestionsAdmin: NextPage = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [type, setType] = useState<"Choice" | "OpenEntry">("Choice");
  const [body, setBody] = useState("");
  const [exp, setExp] = useState(0);
  const [unitId, setUnitId] = useState("");
  const [options, setOptions] = useState([{ body: "", isCorrect: false }]);
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    fetch("http://127.0.0.1:5000/questions", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setQuestions);

    fetch("http://127.0.0.1:5000/units", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setUnits);
  }, [token]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = { type, body, exp, unit_id: unitId };
    if (type === "Choice") {
      payload.options = options;
    } else {
      payload.expectedAnswer = expectedAnswer;
    }

    const res = await fetch("http://127.0.0.1:5000/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const updated = await fetch("http://127.0.0.1:5000/questions", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      setQuestions(updated);
      setBody("");
      setExp(0);
      setUnitId("");
      setOptions([{ body: "", isCorrect: false }]);
      setExpectedAnswer("");
    } else {
      const error = await res.json();
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ABM Preguntas</h1>

      <table className="w-full table-auto border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Tipo</th>
            <th className="border px-2 py-1">Texto</th>
            <th className="border px-2 py-1">XP</th>
            <th className="border px-2 py-1">Unidad</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {questions.map(q => (
            <tr key={q._id}>
              <td className="border px-2 py-1">{q.type}</td>
              <td className="border px-2 py-1">{q.body}</td>
              <td className="border px-2 py-1">{q.exp}</td>
              <td className="border px-2 py-1">{units.find(u => u._id === q.unit_id)?.title}</td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => router.push(`/admin/questions/${q._id}`)}
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
          <label className="block">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="border px-2 py-1"
          >
            <option value="Choice">Choice</option>
            <option value="OpenEntry">OpenEntry</option>
          </select>
        </div>
        <div>
          <label>Texto de la pregunta</label>
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label>XP</label>
          <input
            type="number"
            value={exp}
            onChange={e => setExp(Number(e.target.value))}
            className="border px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label>Unidad</label>
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            className="border px-2 py-1 w-full"
            required
          >
            <option value="">– Seleccione –</option>
            {units.map(u => (
              <option key={u._id} value={u._id}>{u.title}</option>
            ))}
          </select>
        </div>

        {type === "Choice" && (
          <div>
            <label className="block">Opciones</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-1">
                <input
                  value={opt.body}
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[idx].body = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`Opción ${idx + 1}`}
                  className="border px-2 py-1"
                  required
                />
                <label>
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
                  /> Correcta
                </label>
                {options.length > 1 && (
                  <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>❌</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setOptions([...options, { body: "", isCorrect: false }])}>
              + Agregar opción
            </button>
          </div>
        )}

        {type === "OpenEntry" && (
          <div>
            <label className="block">Respuesta esperada</label>
            <input
              type="text"
              value={expectedAnswer}
              onChange={e => setExpectedAnswer(e.target.value)}
              className="border px-2 py-1 w-full"
              required
            />
          </div>
        )}

        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Crear Pregunta
        </button>
      </form>
    </div>
  );
};

export default withAuth(QuestionsAdmin);
