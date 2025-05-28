import { type NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { withAuth } from "~/components/withAuth";
import { useBoundStore } from "~/hooks/useBoundStore";

interface Question {
  _id: string;
  type: "Choice" | "OpenEntry";
  body: string;
  exp: number;
  unit_id: string;
  options?: Array<{ body: string; isCorrect: boolean }>;
  expectedAnswer?: string;
  imagePath?: string;
  hint1?: { text: string; penalty: number };
  hint2?: { text: string; penalty: number };
}

const positivePhrases = [
  "¡Bien hecho!",
  "¡Excelente trabajo!",
  "¡Muy bien!",
  "¡Sigue así!",
  "¡Fantástico!",
  "¡Impresionante!",
  "¡Estás en racha!",
  "¡Perfecto!",
  "¡Genial!",
  "¡Eso es todo!"
];

const Lesson: NextPage = () => {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Estados para los hints
  const [usedHint1, setUsedHint1] = useState(false);
  const [usedHint2, setUsedHint2] = useState(false);
  const [hint1Text, setHint1Text] = useState("");
  const [hint2Text, setHint2Text] = useState("");

  const userId = useBoundStore(x => x.userId);
  const increaseLessonsCompleted = useBoundStore(x => x.increaseLessonsCompleted);

  // 1) Cargo la pregunta
  useEffect(() => {
    const questionId = router.query["questionId"];
    if (!questionId || typeof questionId !== "string") {
      setLoading(false);
      return;
    }

    const fetchQuestion = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        const data: Question = await res.json();
        setQuestion(data);

        // Inicializo los estados de hints
        setHint1Text("");
        setHint2Text("");
        setUsedHint1(false);
        setUsedHint2(false);
      } catch (err) {
        console.error("Error fetching question:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [router.query]);

  // 2) Fetch de hints ya usados
  useEffect(() => {
    if (!question) return;
    if (!question.hint1 && !question.hint2) return;

    const fetchHelpStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions/${question._id}/help-status?user_id=${userId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        if (!res.ok) throw new Error("help-status failed");
        const { usedHelp1, usedHelp2 } = await res.json();

        if (usedHelp1 && question.hint1) {
          setUsedHint1(true);
          setHint1Text(question.hint1.text);
        }
        if (usedHelp2 && question.hint2) {
          setUsedHint2(true);
          setHint2Text(question.hint2.text);
        }
      } catch (err) {
        console.error("Error fetching help-status:", err);
      }
    };

    fetchHelpStatus();
  }, [question, userId]);

  // 3) Pedir hint
  const requestHint = async (n: 1 | 2) => {
    if (!question || submitted) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/questions/${question._id}/help`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ user_id: userId, helpNumber: n }),
        }
      );
      const { text } = await res.json();
      if (n === 1) {
        setUsedHint1(true);
        setHint1Text(text);
      } else {
        setUsedHint2(true);
        setHint2Text(text);
      }
    } catch (err) {
      console.error("Error requesting hint:", err);
    }
  };

  // 4) Confirmar respuesta
  const handleConfirm = async () => {
    if (!question || submitted) return;

    let correct = false;
    if (question.type === "Choice" && question.options) {
      const idx = question.options.findIndex(opt => opt.isCorrect);
      correct = selectedOption === idx;
      await submitAnswer(question._id, question.type, selectedOption?.toString() || "");
    } else if (question.type === "OpenEntry" && question.expectedAnswer) {
      correct =
        userAnswer.trim().toLowerCase() ===
        question.expectedAnswer.trim().toLowerCase();
      await submitAnswer(question._id, question.type, userAnswer);
    }

    // feedback dinámico
    if (correct) {
      const frase =
        positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
      setFeedback(frase);
      increaseLessonsCompleted(1);
    } else {
      setFeedback("Respuesta incorrecta");
    }

    setSubmitted(true);
  };

  // 5) Envío la respuesta al backend
  const submitAnswer = async (qid: string, type: string, resp: string) => {
    const payload: Record<string, unknown> = {
      question_id: { $oid: qid },
      user_id: { $oid: userId },
    };
    if (type === "Choice") payload.selectedOption = resp;
    else payload.body = resp;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
    }
  };

  if (loading) return <div className="p-5">Cargando...</div>;
  if (!question) return <div className="p-5">No se encontró la pregunta.</div>;

  return (
    <div className="p-5 max-w-4xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">Pregunta</h1>

      {question.imagePath && (
        <div className="mb-6 flex justify-center">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/back/img/${question.imagePath}`}
            alt=""
            className="max-w-sm w-full h-auto rounded shadow border"
          />
        </div>
      )}

      <p className="mb-8 text-lg font-semibold">{question.body}</p>

      {/* Choice */}
      {question.type === "Choice" && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !submitted && setSelectedOption(i)}
              disabled={submitted}
              className={`
                p-4 border rounded-lg shadow-sm transition-all
                ${
                  selectedOption === i
                    ? "border-blue-400 bg-blue-100"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }
                ${submitted ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {opt.body}
            </button>
          ))}
        </div>
      )}

      {/* OpenEntry */}
      {question.type === "OpenEntry" && (
        <div className="mb-6">
          <input
            type="text"
            disabled={submitted}
            className={`border px-4 py-3 w-full rounded-md shadow-sm text-center
              ${submitted ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="Escribe tu respuesta..."
            value={userAnswer}
            onChange={e => !submitted && setUserAnswer(e.target.value)}
          />
        </div>
      )}

      {/* Hints */}
      <div className="mb-6 space-y-4">
        {question.hint1 && (
          <div>
            <button
              onClick={() => requestHint(1)}
              disabled={usedHint1 || submitted}
              className={`
                px-4 py-2 rounded
                ${
                  usedHint1
                    ? "bg-gray-300 text-gray-600"
                    : "bg-yellow-400 hover:bg-yellow-500 text-white"
                }
                ${submitted ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {usedHint1 ? "Ayuda 1 mostrada" : "Pedir Ayuda 1"}
            </button>
            {hint1Text && <p className="italic mt-2">{hint1Text}</p>}
          </div>
        )}
        {question.hint2 && (
          <div>
            <button
              onClick={() => requestHint(2)}
              disabled={usedHint2 || submitted}
              className={`
                px-4 py-2 rounded
                ${
                  usedHint2
                    ? "bg-gray-300 text-gray-600"
                    : "bg-yellow-400 hover:bg-yellow-500 text-white"
                }
                ${submitted ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {usedHint2 ? "Ayuda 2 mostrada" : "Pedir Ayuda 2"}
            </button>
            {hint2Text && <p className="italic mt-2">{hint2Text}</p>}
          </div>
        )}
      </div>

      {/* Botones */}
      {!submitted ? (
        <button
          onClick={handleConfirm}
          className="rounded bg-green-500 hover:bg-green-600 px-6 py-3 font-bold text-white transition"
        >
          Confirmar
        </button>
      ) : (
        <>
          {feedback && (
            <div className="mt-6 p-4 bg-gray-100 border-l-4 border-green-400 text-green-700">
              {feedback}
            </div>
          )}
          <button
            onClick={() => router.push("/learn")}
            className="mt-4 rounded bg-blue-500 hover:bg-blue-600 px-6 py-3 font-bold text-white transition"
          >
            Aceptar
          </button>
        </>
      )}
    </div>
  );
};

export default withAuth(Lesson);
