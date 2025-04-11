import { useEffect, useState } from "react";
import { useBoundStore } from "~/hooks/useBoundStore";

type User = {
  DNI: string;
  name: string;
  lastname: string;
  xp: number;
  isCurrentUser: boolean;
};

export const useLeaderboardUsers = (): User[] => {
  const [users, setUsers] = useState<User[]>([]);

  // Obtenemos datos desde el store:
  const currentDNI = useBoundStore((x) => x.DNI);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/users");
        const data = (await res.json()) as any[];

        // Procesamos los usuarios del backend:
        const processedUsers: User[] = data.map((u) => ({
          DNI: u.DNI,
          name: u.name,
          lastname: u.lastname || "",
          xp: u.exp || 0,
          isCurrentUser: u.DNI === currentDNI,
        }));

        // Ordenamos en forma descendente por experiencia:
        const sortedUsers = processedUsers.sort((a, b) => b.xp - a.xp);
        setUsers(sortedUsers);
      } catch (err) {
        console.error("Error fetching leaderboard users:", err);
      }
    };

    fetchUsers();
  }, [currentDNI]);

  return users;
};

export const useLeaderboardRank = (): number | null => {
  const users = useLeaderboardUsers();
  const index = users.findIndex((user) => user.isCurrentUser);
  return index === -1 ? null : index + 1;
};
