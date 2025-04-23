import { useState, useEffect } from "react";

export const useUnits = () => {
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`);
        if (!res.ok) {
          throw new Error("Error al obtener unidades");
        }
        const data = await res.json();
        setUnits(data);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };

    fetchUnits();
  }, []);

  return units;
};
