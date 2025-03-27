import Link from "next/link";
import type { ComponentProps } from "react";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  EmptyFireSvg,
  FireSvg
} from "./Svgs";
import { Calendar } from "./Calendar";
import { useBoundStore } from "~/hooks/useBoundStore";
import type { LoginScreenState } from "./LoginScreen";
import { LoginScreen } from "./LoginScreen";

export const RightBar = () => {
  const streak = useBoundStore((x) => x.streak);
  const [streakShown, setStreakShown] = useState(false);
  const [now, setNow] = useState(dayjs());
  const [loginScreenState, setLoginScreenState] =
    useState<LoginScreenState>("HIDDEN");

  return (
    <>
      <aside className="sticky top-0 hidden flex-col gap-6 self-start sm:flex">
        <article className="my-6 flex justify-between gap-4">
          <span
            className="relative flex items-center gap-2 rounded-xl p-3 font-bold text-orange-500 hover:bg-gray-100"
            onMouseEnter={() => setStreakShown(true)}
            onMouseLeave={() => {
              setStreakShown(false);
              setNow(dayjs());
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              setStreakShown((x) => !x);
              setNow(dayjs());
            }}
            role="button"
            tabIndex={0}
          >
            <div className="pointer-events-none">
              {streak > 0 ? <FireSvg /> : <EmptyFireSvg />}
            </div>
            <span className={streak > 0 ? "text-orange-500" : "text-gray-300"}>
              {streak}
            </span>
            <div
              className="absolute top-full z-10 flex flex-col gap-5 rounded-2xl border-2 border-gray-300 bg-white p-5 text-black"
              style={{
                left: "-330%",
                display: streakShown ? "flex" : "none",
              }}
            >
              <h2 className="text-center text-lg font-bold">Racha</h2>
              <p className="text-center text-sm font-normal text-gray-400">
                {`Racha de dias consecutivos aprendiendo!`}
              </p>
              <Calendar now={now} setNow={setNow} />
            </div>
          </span>
          <span
            className="relative flex items-center gap-2 rounded-xl p-3 font-bold text-red-500 hover:bg-gray-100"
            role="button"
            tabIndex={0}
          > 
          </span>
        </article>
      </aside>
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </>
  );
};