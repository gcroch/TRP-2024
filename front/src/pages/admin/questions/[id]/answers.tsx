
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface Answer {
  _id: string;
  question_id: string;
  user_id: string;
  selectedOption?: string;
  body?: string;
}

interface User {
  _id: string;
  name: string;
  last_name: string;
  dni: string;
}

const QuestionAnswers = () => {
  const router = useRouter();
  const { id } = router.query;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!router.isReady || !id) return;

    // Fetch answers `${process.env.NEXT_PUBLIC_API_URL}`
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/answers?question_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(async (data: Answer[]) => {
        setAnswers(data);

        // Get unique user IDs
        const userIds = [...new Set(data.map(a => a.user_id))];

        // Fetch all users in parallel
        const userFetches = userIds.map(userId =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json())
        );

        const userData = await Promise.all(userFetches);
        const userMap: Record<string, User> = {};
        userData.forEach((u: User) => {
          userMap[u._id] = u;
        });
        setUsers(userMap);
      });

    // Fetch question data (to get options)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.options) {
          const opts = data.options.map((opt: any) => opt.body ?? "Opción vacía");
          setQuestionOptions(opts);
        }
      });
  }, [router.isReady, id]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Respuestas a la Pregunta</h1>

      <div className="space-y-4">
        {answers.map((answer, idx) => {
          const user = users[answer.user_id];
          const optionIndex = parseInt(answer.selectedOption || "");
          const optionText =
            !isNaN(optionIndex) && questionOptions[optionIndex]
              ? questionOptions[optionIndex]
              : answer.body ?? "Respuesta no disponible";

          return (
            <div
              key={answer._id}
              className="bg-white shadow rounded-lg p-4 border border-gray-200"
            >
              <div className="text-sm text-gray-500 mb-1">Respuesta #{idx + 1}</div>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Usuario:</span>{" "}
                {user ? `${user.name} ${user.lastname} (DNI: ${user.DNI})` : "Cargando..."}
              </p>
              <p>
                <span className="font-semibold">Respuesta:</span> {optionText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default withAuth(QuestionAnswers);