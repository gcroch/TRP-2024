import { useState, useEffect } from "react";

export const useQuestions = () => {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/questions");
        if (!res.ok) {
          throw new Error("Error al obtener preguntas");
        }
        const data = await res.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  return questions;
};
