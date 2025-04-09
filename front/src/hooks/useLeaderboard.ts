import { useEffect, useState } from "react";
import { useBoundStore } from "~/hooks/useBoundStore";

type User = {
  name: string;
  lastname: string;
  xp: number;
  isCurrentUser: boolean;
};
 
export const useLeaderboardUsers = (): User[] => {
  const [users, setUsers] = useState<User[]>([]);

  // Se supone que estas funciones retornan valores estables desde el store.
  const xpThisWeek = useBoundStore((x) => x.xpThisWeek());
  const name = useBoundStore((x) => x.name);
  const lastname = useBoundStore((x) => x.lastname) || ""; // Aseguramos un string

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/users");
        const data = (await res.json()) as any[];

        // Procesamos los usuarios que vienen del backend asignando isCurrentUser: false
        const processedUsers: User[] = data.map((u) => ({
          name: u.name,
          lastname: u.lastname || "",
          xp: u.exp || 0,
          isCurrentUser: false,
        }));

        // Preparamos al usuario actual con xp de xpThisWeek
        const currentUser: User = {
          name,
          lastname,
          xp: xpThisWeek,
          isCurrentUser: true,
        };

        // Si el usuario actual ya viene en la lista, lo removemos (comparamos nombre y lastname)
        const uniqueUsers = processedUsers.filter((u) => !(u.name === name && u.lastname === lastname));

        // Ordenamos a los usuarios en orden descendente por xp
        const sortedUsers = [...uniqueUsers, currentUser].sort((a, b) => b.xp - a.xp);
        setUsers(sortedUsers);
      } catch (err) {
        console.error("Error fetching leaderboard users:", err);
      }
    };

    fetchUsers();
  }, [name, lastname, xpThisWeek]);

  return users;
};

export const useLeaderboardRank = (): number | null => {
  const users = useLeaderboardUsers();
  const index = users.findIndex((user) => user.isCurrentUser);
  return index === -1 ? null : index + 1;
};
