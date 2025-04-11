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
import { withAuth } from "~/components/withAuth";

const LeaderboardExplanationSection = () => {
  return (
    <article className="relative hidden h-fit w-96 shrink-0 gap-5 rounded-2xl border-2 border-gray-200 p-6 xl:flex">
      <div className="flex flex-col gap-5">
        <h2 className="font-bold uppercase text-gray-400">Que es el ranking?</h2>
        <p className="font-bold text-gray-700">Responde preguntas. Gana XP. Competí.</p>
        <p className="text-gray-400">
          Gana exp cuando respondes preguntas, entonces competí con otros jugadores en el ranking
        </p>
      </div>
      <div className="w-10 shrink-0"></div>
    </article>
  );
};

const LeaderboardProfile = ({
  place,
  name,
  lastname,
  xp,
  isCurrentUser,
}: {
  place: number;
  name: string;
  lastname: string;
  xp: number;
  isCurrentUser: boolean;
}) => {
  return (
    <div
      className={[
        "flex items-center gap-5 rounded-2xl px-5 py-2 hover:bg-gray-100 md:mx-0",
        isCurrentUser ? "bg-blue-100 border-2 border-blue-500" : "",
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
        {name} {lastname}
        {isCurrentUser && (
          <span className="ml-2 inline-block rounded bg-blue-500 px-2 py-1 text-xs text-white">
            Tú
          </span>
        )}
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

  const lessonsToUnlockLeaderboard = 0;
  const lessonsRemainingToUnlockLeaderboard =
    lessonsToUnlockLeaderboard - lessonsCompleted;
  const leaderboardIsUnlocked = lessonsCompleted >= lessonsToUnlockLeaderboard;

  const leaderboardUsers = useLeaderboardUsers();

  // Separamos el top 10 y buscamos al usuario actual
  const top10Users = leaderboardUsers.slice(0, 10);
  const currentUser = leaderboardUsers.find((u) => u.isCurrentUser);

  // Verificamos si el usuario actual ya está en el top 10
  const isCurrentInTop10 = top10Users.some((u) => u.DNI === currentUser?.DNI);

  return (
    <div>
      <LeftBar selectedTab="Leaderboards" />
      <div className="flex justify-center gap-3 pt-14 md:ml-24 md:p-6 md:pt-10 lg:ml-64 lg:gap-12">
        <div className="flex w-full max-w-xl flex-col items-center gap-5 pb-28 md:px-5">
          {!leaderboardIsUnlocked ? (
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
          ) : (
            <>
              <div className="sticky top-0 -mt-14 flex w-full flex-col items-center gap-5 bg-white pt-14">
                <h1 className="text-2xl font-bold">Ranking</h1>
                <div className="w-full border-b-2 border-gray-200"></div>
              </div>
              <div className="w-full">
                {top10Users.map((user, i) => (
                  <LeaderboardProfile
                    key={user.DNI}
                    place={i + 1}
                    name={user.name}
                    lastname={user.lastname}
                    xp={user.xp}
                    isCurrentUser={user.isCurrentUser}
                  />
                ))}
                {/* Si el usuario actual no está en el top10, lo mostramos aparte */}
                {currentUser && !isCurrentInTop10 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-center text-gray-500">
                      Tu posición: {leaderboardUsers.findIndex((u) => u.DNI === currentUser.DNI) + 1}
                    </p>
                    <LeaderboardProfile
                      key={currentUser.DNI}
                      place={leaderboardUsers.findIndex((u) => u.DNI === currentUser.DNI) + 1}
                      name={currentUser.name}
                      lastname={currentUser.lastname}
                      xp={currentUser.xp}
                      isCurrentUser={true}
                    />
                  </div>
                )}
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

export default withAuth(Leaderboard);
