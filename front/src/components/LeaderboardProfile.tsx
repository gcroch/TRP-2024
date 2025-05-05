// components/LeaderboardProfile.tsx
import React from "react";
import {
  FirstPlaceSvg,
  SecondPlaceSvg,
  ThirdPlaceSvg,
} from "~/components/Svgs";

export type LeaderboardProfileProps = {
  place: number;
  name: string;
  lastname: string;
  xp: number;
  isCurrentUser: boolean;
};

export const LeaderboardProfile: React.FC<LeaderboardProfileProps> = ({
  place,
  name,
  lastname,
  xp,
  isCurrentUser,
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
