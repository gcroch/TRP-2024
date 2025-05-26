import { type NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { withAuth } from "~/components/withAuth";
import { useBoundStore } from "~/hooks/useBoundStore";

// Interfaz según tu backend
interface Question {
  _id: string;
  type: "Choice" | "OpenEntry";
  body: string;
  exp: number;
  unit_id: string;
  options?: Array<{
    body: string;
    isCorrect: boolean;
  }>;
  expectedAnswer?: string;
  imagePath?: string;
}

interface AnswerRequest {
  question_id: object;
  user_id: object;
  selectedOption?: string;
  body?: string;
}

const Lesson: NextPage = () => {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  // Obtenemos userId y el método para aumentar las lecciones completadas desde la store
  const userId = useBoundStore((x) => x.userId);
  const increaseLessonsCompleted = useBoundStore((x) => x.increaseLessonsCompleted);

  // Al montar el componente, extraemos la query ?questionId=... y consultamos el backend
  useEffect(() => {
    const questionId = router.query["questionId"];
    if (!questionId || typeof questionId !== "string") {
      setLoading(false);
      return;
    }

    const fetchQuestion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`);
        if (!res.ok) {
          throw new Error("Error fetching question data");
        }
        const data = await res.json();
        setQuestion(data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [router.query]);

  // Función para manejar la confirmación de respuesta
  const handleConfirm = async () => {
    if (!question) return;

    let correct = false;
    if (question.type === "Choice" && question.options) {
      const correctIndex = question.options.findIndex((opt) => opt.isCorrect);
      correct = selectedOption === correctIndex;
      setFeedback(correct ? "¡Correcto!" : "Respuesta incorrecta");
      await submitAnswer(question._id, question.type, selectedOption?.toString() || "");
    } else if (question.type === "OpenEntry" && question.expectedAnswer) {
      correct = userAnswer.trim().toLowerCase() === question.expectedAnswer.trim().toLowerCase();
      setFeedback(correct ? "¡Correcto!" : `Respuesta incorrecta.`);
      await submitAnswer(question._id, question.type, userAnswer);
    }

    // Si la respuesta fue correcta, incrementamos las lecciones completadas
    if (correct) {
      increaseLessonsCompleted(1);
    }

    // Espera un momento para mostrar el feedback y redirige a Learn
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/learn");
  };

  // Función auxiliar para enviar la respuesta al backend
  const submitAnswer = async (questionId: string, questionType: string, userResponse: string) => {
    try {
      const payload: Record<string, unknown> = {
        question_id: { $oid: questionId },
        user_id: { $oid: userId },
      };

      if (questionType === "Choice") {
        payload.selectedOption = userResponse;
      } else if (questionType === "OpenEntry") {
        payload.body = userResponse;
      }
      console.log("Enviando payload:", payload);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Error posting answer: " + errorText);
      }

      console.log("Respuesta enviada correctamente");
    } catch (err) {
      console.error("Error submitAnswer:", err);
    }
  };

  if (loading) {
    return <div className="p-5">Cargando...</div>;
  }

  if (!question) {
    return <div className="p-5">No se encontró la pregunta.</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">Pregunta</h1>
  
      {question.imagePath && (
        <div className="mb-6 flex justify-center">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/back/img/${question.imagePath}`}
            alt={question.imagePath}
            className="max-w-sm w-full h-auto rounded shadow border border-gray-200"
          />
        </div>
      )}
  
      <p className="mb-8 text-lg font-semibold">{question.body}</p>
  
      {question.type === "Choice" && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {question.options.map((opt, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(index)}
              className={[
                "p-4 border rounded-lg shadow-sm transition-all",
                selectedOption === index
                  ? "border-blue-400 bg-blue-100"
                  : "border-gray-300 bg-white hover:bg-gray-50",
              ].join(" ")}
            >
              {opt.body}
            </button>
          ))}
        </div>
      )}
  
      {question.type === "OpenEntry" && (
        <div className="mb-6">
          <input
            type="text"
            className="border px-4 py-3 w-full rounded-md text-center shadow-sm"
            placeholder="Escribe tu respuesta aquí"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
        </div>
      )}
  
      <button
        onClick={handleConfirm}
        className="rounded bg-green-500 hover:bg-green-600 px-6 py-3 font-bold text-white transition"
      >
        Confirmar
      </button>
  
      {feedback && (
        <div className="mt-6 p-4 bg-gray-100 border-l-4 border-green-400 text-green-700 text-center">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default withAuth(Lesson);
