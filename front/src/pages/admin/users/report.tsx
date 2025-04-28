import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";

interface ReportEntry {
  question_text: string;
  answer: string;
}

interface UserReport {
  fullName: string;
  dni: string;
  entries: ReportEntry[];
}

const UserReportPage = () => {
  const router = useRouter();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    const fetchReports = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Received data:", data);

        if (!Array.isArray(data)) {
          setLoading(false);
          return;
        }

        const transformedReports: UserReport[] = data.map((userReport: any) => {
          const user = userReport.user ?? {};
          console.log(user);
          const fullName = `${user.name ?? "Nombre"} ${user.lastname ?? "Apellido"}`;
          const dni = `${user.DNI ?? "DNI"}`;

          const entries: ReportEntry[] = userReport.questions_answered.map((qa: any) => {
            const question = qa.question;
            const answer = qa.answer;

            let question_text = "Pregunta no disponible";
            let answer_text = "Respuesta no disponible";

            if (question) {
              question_text = question.body ?? "Sin texto de pregunta";

              if (question.type === "Choice" && answer?.selectedOption != null) {
                const index = parseInt(answer.selectedOption);
                const option = question.options?.[index];
                answer_text = option?.body ?? "Opción no encontrada";
              } else if (answer?.body) {
                answer_text = answer.body;
              }
            } else if (answer?.body) {
              answer_text = answer.body;
            }

            return { question_text, answer: answer_text };
          });

          return { fullName, dni, entries };
        });

        setReports(transformedReports);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Reporte de Respuestas de Todos los Usuarios</h1>
      <div className="mb-4">
        <button
          onClick={() => router.push("/admin/users")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a adm usuarios
        </button>
      </div>
      {loading ? (
        <p className="text-center text-gray-500">Cargando reporte...</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-gray-500">No hay respuestas para mostrar.</p>
      ) : (
        <div className="space-y-10">
          {reports.map((userReport, userIndex) => (
            <div key={userIndex}>
              <h2 className="text-2xl font-semibold text-blue-700 mb-1">
                Usuario: {userReport.fullName}
              </h2>
              <h3 className="text-md text-gray-600 mb-4">DNI: {userReport.dni}</h3>
              <div className="space-y-4">
                {userReport.entries.map((entry, i) => (
                  <div key={i} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Pregunta {i + 1}</div>
                    <p className="font-medium text-gray-800">{entry.question_text}</p>
                    <div className="mt-2">
                      <span className="text-sm font-semibold text-gray-600">Respuesta:</span>
                      <p className="text-gray-700 bg-gray-50 rounded p-2 mt-1">{entry.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default withAuth(UserReportPage);
