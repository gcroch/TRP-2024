// src/hooks/useCompletedQuestions.ts
import { useEffect, useState } from "react";

export const useCompletedQuestions = () => {
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        // data viene como { unitId: [qId, ...], ... }
        // Aplanamos todos los IDs de pregunta en un solo array:
        const all = Object.values(data).flat() as string[];
        setCompletedQuestionIds(all);
      } catch (err) {
        console.error("Error fetching completed questions", err);
      }
    };
    fetchCompleted();
  }, []);

  return completedQuestionIds;
};
