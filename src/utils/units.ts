export type Unit = {
  unitNumber: number;
  description: string;
  backgroundColor: `bg-${string}`;
  textColor: `text-${string}`;
  borderColor: `border-${string}`;
  tiles: Tile[];
};

export type Tile =
  | {
      type: "star" | "dumbbell" | "book" | "trophy" | "fast-forward";
      description: string;
    }
  | { type: "treasure" };

export type TileType = Tile["type"];

/** Fetches the units from the API */
export async function getUnits(): Promise<Unit[]> {
  let data = await fetch(process.env["NEXT_PUBLIC_BACKEND_HOST"] + '/api/v1/units');
  let units = await data.json();

  return units["data"];
}