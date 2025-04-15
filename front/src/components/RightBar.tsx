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
      
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </>
  );
};