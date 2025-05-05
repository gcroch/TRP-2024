import { type NextPage } from "next";
import Link from "next/link";
import { GlobeSvg } from "~/components/Svgs";
import React from "react";
import { LanguageHeader } from "~/components/LanguageHeader";
import { useLoginScreen, LoginScreen } from "~/components/LoginScreen";
import _bgSnow from "../../public/bg-snow.svg";
import type { StaticImageData } from "next/image";
import { useLeaderboardUsers } from "~/hooks/useLeaderboard";
import { LeaderboardProfile } from "~/components/LeaderboardProfile";

const bgSnow = _bgSnow as StaticImageData;

const Home: NextPage = () => {
  const { loginScreenState, setLoginScreenState } = useLoginScreen();
  const leaderboardUsers = useLeaderboardUsers();
  const top10 = leaderboardUsers.slice(0, 10);
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#235390] text-white"
      style={{ backgroundImage: `url(${bgSnow.src})` }}
    >
      <LanguageHeader />
      <div className="flex w-full flex-col items-center justify-center gap-3 px-4 py-16 md:flex-row md:gap-36">
        <GlobeSvg className="h-fit w-7/12 md:w-[360px]" />
        <div>
          <p className="mb-6 max-w-[600px] text-center text-3xl font-bold md:mb-12">
            Taller de resolución de problemas, Licenciatura en sistemas de información
          </p>
          <div className="mx-auto mt-4 flex w-fit flex-col items-center gap-3">
            
            <button
              className="w-full rounded-2xl border-2 border-b-4 border-[#042c60] bg-[#235390] px-8 py-3 font-bold uppercase transition hover:bg-[#204b82] md:min-w-[320px]"
              onClick={() => setLoginScreenState("LOGIN")}
            >
              Iniciar sesion
            </button>
          </div>
        </div>
      </div>
      {/* Pre‑vista del Top 10 */}
      <section className="w-full max-w-md bg-white text-black rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Top 10 jugadores</h2>
        {top10.length > 0 ? (
          top10.map((u, i) => (
            <LeaderboardProfile
              key={u.DNI}
              place={i + 1}
              name={u.name}
              lastname={u.lastname}
              xp={u.xp}
              isCurrentUser={u.isCurrentUser}
            />
          ))
        ) : (
          <p className="text-gray-500">Cargando ranking…</p>
        )}
      </section>
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </main>
  );
};

export default Home;
