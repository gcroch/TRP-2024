// hooks/useTransformedUnits.ts
import { useEffect, useState } from "react";
import { Unit, Tile, TileType } from "~/utils/units";

const colorSchemes = [
  { bg: "bg-green-500", border: "border-green-500", text: "text-green-500" },
  { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500" },
  { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-500" }
];

const getPredefinedTiles = (unitNumber: number): Tile[] => {
  const baseTiles = [
    { type: "star" as TileType, description: "Fundamentos" },
    { type: "book" as TileType, description: "Lección 1" },
    { type: "dumbbell" as TileType, description: "Práctica" },
    { type: "book" as TileType, description: "Lección 2" },
    { type: "trophy" as TileType, description: `Unidad ${unitNumber}` }
  ];
  
  return unitNumber % 2 === 0 
    ? [...baseTiles, { type: "treasure" as TileType, description: "Recompensa" }]
    : baseTiles;
};

export const useTransformedUnits = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/units`);
        const apiUnits = await res.json();
        
        const transformed = apiUnits.map((apiUnit: any, index: number) => ({
          unitNumber: index + 1,
          description: apiUnit.title,
          backgroundColor: colorSchemes[index % colorSchemes.length].bg,
          borderColor: colorSchemes[index % colorSchemes.length].border,
          textColor: colorSchemes[index % colorSchemes.length].text,
          tiles: getPredefinedTiles(index + 1)
        }));
        
        setUnits(transformed);
      } catch (error) {
        console.error("Error fetching units:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { units, loading };
};