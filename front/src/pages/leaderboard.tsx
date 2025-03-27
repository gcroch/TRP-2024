import type { NextPage } from "next";
import React, { useEffect } from "react";
import { LeftBar } from "~/components/LeftBar";
import { BottomBar } from "~/components/BottomBar";
import { useBoundStore } from "~/hooks/useBoundStore";
import {
  FirstPlaceSvg,
  LeaderboardBannerSvg,
  LockedLeaderboardSvg,
  SecondPlaceSvg,
  ThirdPlaceSvg,
} from "~/components/Svgs";
import { useRouter } from "next/router";
import { useLeaderboardUsers } from "~/hooks/useLeaderboard";
import Image from "next/image";

const LeaderboardExplanationSection = () => {
  return (
    <article className="relative hidden h-fit w-96 shrink-0 gap-5 rounded-2xl border-2 border-gray-200 p-6 xl:flex">
      <div className="flex flex-col gap-5">
        <h2 className="font-bold uppercase text-gray-400">
          Que es el ranking?
        </h2>
        <p className="font-bold text-gray-700">Responde preguntas. Gana XP. Competí.</p>
        <p className="text-gray-400">
          Gana exp cuando respondes preguntas, Entonces competi con otros jugadores en el ranking
        </p>
      </div>

      <div className="w-10 shrink-0"></div>

    </article>
  );
};

type TimeLeftUnit = "days" | "hours" | "minutes";



const LeaderboardProfile = ({
  place,
  name,
  xp,
  isCurrentUser,
}: {
  place: number;
  name: string;
  xp: number;
  isCurrentUser: boolean;
}) => {
  return (
    <div
      className={[
        "flex items-center gap-5 rounded-2xl px-5 py-2 hover:bg-gray-100 md:mx-0",
        isCurrentUser ? "bg-gray-200" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        {place === 1 ? (
          <FirstPlaceSvg />
        ) : place === 2 ? (
          <SecondPlaceSvg />
        ) : place === 3 ? (
          <ThirdPlaceSvg />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center font-bold text-green-700">
            {place}
          </div>
        )}
        
      </div>
      <div className="grow overflow-hidden overflow-ellipsis font-bold">
        {name}
      </div>
      <div className="shrink-0 text-gray-500">{`${xp} XP`}</div>
    </div>
  );
};

const Leaderboard: NextPage = () => {
  const router = useRouter();
  const loggedIn = useBoundStore((x) => x.loggedIn);

  const lessonsCompleted = useBoundStore((x) => x.lessonsCompleted);

  useEffect(() => {
    if (!loggedIn) {
      void router.push("/");
    }
  }, [loggedIn, router]);

  const lessonsToUnlockLeaderboard = 1;
  const lessonsRemainingToUnlockLeaderboard =
    lessonsToUnlockLeaderboard - lessonsCompleted;
  const leaderboardIsUnlocked = lessonsCompleted >= lessonsToUnlockLeaderboard;

  const leaderboardLeague = "Bronze League";

  const leaderboardUsers = useLeaderboardUsers();

  return (
    <div>
      <LeftBar selectedTab="Leaderboards" />
      <div className="flex justify-center gap-3 pt-14 md:ml-24 md:p-6 md:pt-10 lg:ml-64 lg:gap-12">
        <div className="flex w-full max-w-xl flex-col items-center gap-5 pb-28 md:px-5">
          {!leaderboardIsUnlocked && (
            <>
              <LeaderboardBannerSvg />
              <h1 className="text-center text-2xl font-bold text-gray-700">
                Desbloquea el ranking!
              </h1>
              <p className="text-center text-lg text-gray-500">
                Completa {lessonsRemainingToUnlockLeaderboard} pregunta
                {lessonsRemainingToUnlockLeaderboard === 1 ? "" : "s"} para empezar a competir
              </p>
              <div className="h-5"></div>
              <LockedLeaderboardSvg />
            </>
          )}
          {leaderboardIsUnlocked && (
            <>
              <div className="sticky top-0 -mt-14 flex w-full flex-col items-center gap-5 bg-white pt-14">
                <h1 className="text-2xl font-bold">Ranking</h1>
                <div className="flex w-full flex-col items-center gap-1 pb-5">
                </div>
                <div className="w-full border-b-2 border-gray-200"></div>
              </div>
              <div className="w-full">
                {leaderboardUsers.map((user, i) => {
                  return (
                    <LeaderboardProfile
                      key={user.name}
                      place={i + 1}
                      name={user.name}
                      xp={user.xp}
                      isCurrentUser={user.isCurrentUser}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
        {!leaderboardIsUnlocked && <LeaderboardExplanationSection />}
      </div>
      <BottomBar selectedTab="Leaderboards" />
    </div>
  );
};

export default Leaderboard;
