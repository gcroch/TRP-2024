import dayjs from "dayjs";
import type { BoundStateCreator } from "~/hooks/useBoundStore";

export type UserSlice = {
  DNI: string;
  name: string;
  lastname: string;
  username: string;
  joinedAt: dayjs.Dayjs;
  xpThisWeek: number;
  loggedIn: boolean;
  setUser: (user: { DNI: string; name: string; lastname: string; username: string; xpThisWeek?: number }) => void;
  logIn: () => void;
  logOut: () => void;
};

export const createUserSlice: BoundStateCreator<UserSlice> = (set) => ({
  DNI: "",
  name: "",
  lastname: "",
  username: "",
  joinedAt: dayjs(),
  xpThisWeek: 0,
  loggedIn: false,

  setUser: (user) =>
    set(() => ({
      DNI: user.DNI,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      xpThisWeek: user.xpThisWeek ?? 0,
    })),
  logIn: () => set(() => ({ loggedIn: true })),
  logOut: () => set(() => ({ loggedIn: false })),
});
