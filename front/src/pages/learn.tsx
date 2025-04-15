import type { NextPage } from "next";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActiveBookSvg,
  LockedBookSvg,
  CheckmarkSvg,
  LockedDumbbellSvg,
  FastForwardSvg,
  GoldenBookSvg,
  GoldenDumbbellSvg,
  GoldenTreasureSvg,
  GoldenTrophySvg,
  GuidebookSvg,
  LessonCompletionSvg0,
  LessonCompletionSvg1,
  LessonCompletionSvg2,
  LessonCompletionSvg3,
  LockSvg,
  StarSvg,
  LockedTreasureSvg,
  LockedTrophySvg,
  UpArrowSvg,
  ActiveTreasureSvg,
  ActiveTrophySvg,
  ActiveDumbbellSvg,
  PracticeExerciseSvg,
} from "~/components/Svgs";
import { TopBar } from "~/components/TopBar";
import { BottomBar } from "~/components/BottomBar";
import { RightBar } from "~/components/RightBar";
import { LeftBar } from "~/components/LeftBar";
import { useRouter } from "next/router";
import { LoginScreen, useLoginScreen } from "~/components/LoginScreen";
import { useBoundStore } from "~/hooks/useBoundStore";
import { withAuth } from "~/components/withAuth";

// IMPORTAMOS nuestros hooks para cargar datos dinámicos:
import { useUnits } from "~/hooks/useUnits";
import { useQuestions } from "~/hooks/useQuestions";

// INTERFACES para adaptar la data (ajustá según tu modelo)
interface Unit {
  _id: string;
  title: string;
  level: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  tiles: any[]; // Aquí se asignarán las preguntas transformadas (tiles)
}

interface Question {
  _id: string;
  type: string;
  body: string;
  exp: number;
  unit_id: string;
  description?: string;
}

// Función para transformar una pregunta en un objeto "tile"
const questionToTile = (q: Question) => {
  let tileType = "star"; // Valor por defecto
  if (q.type === "Choice") {
    tileType = "book";
  } else if (q.type === "OpenEntry") {
    tileType = "star";
  }
  return {
    type: tileType,
    description: q.body, // Usamos el body como descripción
    exp: q.exp,
    questionId: q._id,
  };
};

// Función para mapear las preguntas (transformadas a tiles) a cada unidad
const mapQuestionsToUnits = (units: Unit[], questions: Question[]): Unit[] => {
  return units.map((unit) => ({
    ...unit,
    tiles: questions
      .filter((q) => q.unit_id === unit._id)
      .map(questionToTile),
  }));
};

// Función para calcular el estado de cada tile, usando los tiles disponibles en la unidad actual
type TileStatus = "LOCKED" | "ACTIVE" | "COMPLETE";

const tileStatus = (tile: any, lessonsCompleted: number, unitTiles: any[]): TileStatus => {
  const lessonsPerTile = 4;
  const tilesCompleted = Math.floor(lessonsCompleted / lessonsPerTile);
  const tileIndex = unitTiles.findIndex((t: any) => t === tile);
  if (tileIndex < tilesCompleted) return "COMPLETE";
  if (tileIndex > tilesCompleted) return "LOCKED";
  return "ACTIVE";
};

const TileIcon = ({
  tileType,
  status,
}: {
  tileType: string;
  status: TileStatus;
}): JSX.Element => {
  switch (tileType) {
    case "star":
      return status === "COMPLETE" ? <CheckmarkSvg /> : status === "ACTIVE" ? <StarSvg /> : <LockSvg />;
    case "book":
      return status === "COMPLETE" ? <GoldenBookSvg /> : status === "ACTIVE" ? <ActiveBookSvg /> : <LockedBookSvg />;
    case "dumbbell":
      return status === "COMPLETE" ? <GoldenDumbbellSvg /> : status === "ACTIVE" ? <ActiveDumbbellSvg /> : <LockedDumbbellSvg />;
    case "fast-forward":
      return status === "COMPLETE" ? <CheckmarkSvg /> : status === "ACTIVE" ? <StarSvg /> : <FastForwardSvg />;
    case "treasure":
      return status === "COMPLETE" ? <GoldenTreasureSvg /> : status === "ACTIVE" ? <ActiveTreasureSvg /> : <LockedTreasureSvg />;
    case "trophy":
      return status === "COMPLETE" ? <GoldenTrophySvg /> : status === "ACTIVE" ? <ActiveTrophySvg /> : <LockedTrophySvg />;
    default:
      return <LockSvg />;
  }
};

const tileLeftClassNames = [
  "left-0",
  "left-[-45px]",
  "left-[-70px]",
  "left-[-45px]",
  "left-0",
  "left-[45px]",
  "left-[70px]",
  "left-[45px]",
] as const;

type TileLeftClassName = (typeof tileLeftClassNames)[number];

const getTileLeftClassName = ({
  index,
  unitNumber,
  tilesLength,
}: {
  index: number;
  unitNumber: number;
  tilesLength: number;
}): TileLeftClassName => {
  if (index >= tilesLength - 1) return "left-0";
  const classNames =
    unitNumber % 2 === 1
      ? tileLeftClassNames
      : [...tileLeftClassNames.slice(4), ...tileLeftClassNames.slice(0, 4)];
  return classNames[index % classNames.length] ?? "left-0";
};

const tileTooltipLeftOffsets = [140, 95, 70, 95, 140, 185, 210, 185] as const;
type TileTooltipLeftOffset = (typeof tileTooltipLeftOffsets)[number];

const getTileTooltipLeftOffset = ({
  index,
  unitNumber,
  tilesLength,
}: {
  index: number;
  unitNumber: number;
  tilesLength: number;
}): TileTooltipLeftOffset => {
  if (index >= tilesLength - 1) return tileTooltipLeftOffsets[0];
  const offsets =
    unitNumber % 2 === 1
      ? tileTooltipLeftOffsets
      : [...tileTooltipLeftOffsets.slice(4), ...tileTooltipLeftOffsets.slice(0, 4)];
  return offsets[index % offsets.length] ?? tileTooltipLeftOffsets[0];
};

const getTileColors = ({
  tileType,
  status,
  defaultColors,
}: {
  tileType: string;
  status: TileStatus;
  defaultColors: `border-${string} bg-${string}`;
}): `border-${string} bg-${string}` => {
  switch (status) {
    case "LOCKED":
      if (tileType === "fast-forward") return defaultColors;
      return "border-[#b7b7b7] bg-[#e5e5e5]";
    case "COMPLETE":
      return "border-yellow-500 bg-yellow-400";
    case "ACTIVE":
      return defaultColors;
    default:
      return defaultColors;
  }
};

const TileTooltip = ({
  selectedTile,
  index,
  unitNumber,
  tilesLength,
  description,
  status,
  closeTooltip,
  questionId,
}: {
  selectedTile: number | null;
  index: number;
  unitNumber: number;
  tilesLength: number;
  description: string;
  status: TileStatus;
  closeTooltip: () => void;
}) => {
  const tileTooltipRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const containsTileTooltip = (event: MouseEvent) => {
      if (selectedTile !== index) return;
      const clickIsInsideTooltip = tileTooltipRef.current?.contains(event.target as Node);
      if (clickIsInsideTooltip) return;
      closeTooltip();
    };
    window.addEventListener("click", containsTileTooltip, true);
    return () => window.removeEventListener("click", containsTileTooltip, true);
  }, [selectedTile, tileTooltipRef, closeTooltip, index]);

  const unitVisual = {
    backgroundColor: "bg-green-500",
    textColor: "text-green-500",
    borderColor: "border-green-500",
  };
  const activeBackgroundColor = unitVisual.backgroundColor;
  const activeTextColor = unitVisual.textColor;
  return (
    <div className={["relative h-0 w-full", index === selectedTile ? "" : "invisible"].join(" ")} ref={tileTooltipRef}>
      <div
        className={[
          "absolute z-30 flex w-[300px] flex-col gap-4 rounded-xl p-4 font-bold transition-all duration-300",
          status === "ACTIVE"
            ? activeBackgroundColor
            : status === "LOCKED"
            ? "border-2 border-gray-200 bg-gray-100"
            : "bg-yellow-400",
          index === selectedTile ? "top-4 scale-100" : "-top-14 scale-0",
        ].join(" ")}
        style={{ left: "calc(50% - 150px)" }}
      >
        <div
          className={[
            "absolute left-[140px] top-[-8px] h-4 w-4 rotate-45",
            status === "ACTIVE"
              ? activeBackgroundColor
              : status === "LOCKED"
              ? "border-l-2 border-t-2 border-gray-200 bg-gray-100"
              : "bg-yellow-400",
          ].join(" ")}
          style={{ left: getTileTooltipLeftOffset({ index, unitNumber, tilesLength }) }}
        ></div>
        <div
          className={[
            "text-lg",
            status === "ACTIVE"
              ? "text-white"
              : status === "LOCKED"
              ? "text-gray-400"
              : "text-yellow-600",
          ].join(" ")}
        >
          {description}
        </div>
        {status === "ACTIVE" ? (
          <Link
            href={`/lesson?questionId=${questionId}`}
            className={[
              "flex w-full items-center justify-center rounded-xl border-b-4 border-gray-200 bg-white p-3 uppercase",
              activeTextColor,
            ].join(" ")}
          >
            Comenzar
          </Link>
        ) : status === "LOCKED" ? (
          <button className="w-full rounded-xl bg-gray-200 p-3 uppercase text-gray-400" disabled>
            Locked
          </button>
        ) : (
          <Link
            href="/lesson"
            className="flex w-full items-center justify-center rounded-xl border-b-4 border-yellow-200 bg-white p-3 uppercase text-yellow-400"
          >
            Practice +5 XP
          </Link>
        )}
      </div>
    </div>
  );
};

const UnitSection = ({ unit }: { unit: Unit }): JSX.Element => {
  const router = useRouter();
  const [selectedTile, setSelectedTile] = useState<null | number>(null);
  useEffect(() => {
    const unselectTile = () => setSelectedTile(null);
    window.addEventListener("scroll", unselectTile);
    return () => window.removeEventListener("scroll", unselectTile);
  }, []);
  const closeTooltip = useCallback(() => setSelectedTile(null), []);
  const lessonsCompleted = useBoundStore((x) => x.lessonsCompleted);
  const increaseLessonsCompleted = useBoundStore((x) => x.increaseLessonsCompleted);
  const increaseLingots = useBoundStore((x) => x.increaseLingots);
  return (
    <>
      <UnitHeader
        unitNumber={unit.level} // Mostrar "Unidad {level}"
        description={unit.title}
        backgroundColor={unit.backgroundColor || "bg-[#58cc02]"}
        borderColor={unit.borderColor || "border-[#46a302]"}
      />
      <div className="relative mb-8 mt-[67px] flex max-w-2xl flex-col items-center gap-4">
        {unit.tiles.map((tile, i): JSX.Element => {
          const status = tileStatus(tile, lessonsCompleted, unit.tiles);
          return (
            <Fragment key={i}>
              {(() => {
                switch (tile.type) {
                  case "star":
                  case "book":
                  case "dumbbell":
                  case "trophy":
                  case "fast-forward":
                    if (tile.type === "trophy" && status === "COMPLETE") {
                      return (
                        <div className="relative">
                          <TileIcon tileType={tile.type} status={status} />
                          <div className="absolute left-0 right-0 top-6 flex justify-center text-lg font-bold text-yellow-700">
                            {unit.level}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        className={[
                          "relative -mb-4 h-[93px] w-[98px]",
                          getTileLeftClassName({
                            index: i,
                            unitNumber: unit.level,
                            tilesLength: unit.tiles.length,
                          }),
                        ].join(" ")}
                      >
                        {tile.type === "fast-forward" && status === "LOCKED" ? (
                          <HoverLabel text="Jump here?" textColor={unit.textColor || "text-green-500"} />
                        ) : selectedTile !== i && status === "ACTIVE" ? (
                          <HoverLabel text="Start" textColor={unit.textColor || "text-green-500"} />
                        ) : null}
                        <LessonCompletionSvg lessonsCompleted={lessonsCompleted} status={status} />
                        <button
                          className={[
                            "absolute m-3 rounded-full border-b-8 p-4",
                            getTileColors({
                              tileType: tile.type,
                              status,
                              defaultColors: `${unit.borderColor || "border-[#46a302]"} ${unit.backgroundColor || "bg-[#58cc02]"}`,
                            }),
                          ].join(" ")}
                          onClick={() => {
                            if (tile.type === "fast-forward" && status === "LOCKED") {
                              void router.push(`/lesson?fast-forward=${unit.level}`);
                              return;
                            }
                            setSelectedTile(i);
                          }}
                        >
                          <TileIcon tileType={tile.type} status={status} />
                          <span className="sr-only">Show lesson</span>
                        </button>
                      </div>
                    );
                  case "treasure":
                    return (
                      <div
                        className={[
                          "relative -mb-4",
                          getTileLeftClassName({
                            index: i,
                            unitNumber: unit.level,
                            tilesLength: unit.tiles.length,
                          }),
                        ].join(" ")}
                        onClick={() => {
                          if (status === "ACTIVE") {
                            increaseLessonsCompleted(4);
                            increaseLingots(1);
                          }
                        }}
                        role="button"
                        tabIndex={status === "ACTIVE" ? 0 : undefined}
                        aria-hidden={status !== "ACTIVE"}
                        aria-label={status === "ACTIVE" ? "Collect reward" : ""}
                      >
                        {status === "ACTIVE" && <HoverLabel text="Open" textColor="text-yellow-400" />}
                        <TileIcon tileType={tile.type} status={status} />
                      </div>
                    );
                }
              })()}
              <TileTooltip
                selectedTile={selectedTile}
                index={i}
                unitNumber={unit.level}
                tilesLength={unit.tiles.length}
                description={(() => {
                  switch (tile.type) {
                    case "book":
                    case "dumbbell":
                    case "star":
                      return tile.description;
                    case "fast-forward":
                      return status === "LOCKED" ? "Jump here?" : tile.description;
                    case "trophy":
                      return `Unidad ${unit.level} review`;
                    case "treasure":
                      return "";
                  }
                })()}
                status={status}
                closeTooltip={closeTooltip}
                questionId={tile.questionId} 
              />
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

const getTopBarColors = (scrollY: number): { backgroundColor: `bg-${string}`; borderColor: `border-${string}` } => {
  const defaultColors = {
    backgroundColor: "bg-[#58cc02]",
    borderColor: "border-[#46a302]",
  } as const;
  if (scrollY < 680) return defaultColors;
  if (scrollY < 1830) return { backgroundColor: "bg-[#58cc02]", borderColor: "border-[#46a302]" };
  return { backgroundColor: "bg-[#58cc02]", borderColor: "border-[#46a302]" };
};

const Learn: NextPage = () => {
  const { loginScreenState, setLoginScreenState } = useLoginScreen();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const updateScrollY = () => setScrollY(globalThis.scrollY ?? scrollY);
    updateScrollY();
    document.addEventListener("scroll", updateScrollY);
    return () => document.removeEventListener("scroll", updateScrollY);
  }, [scrollY]);

  const topBarColors = getTopBarColors(scrollY);

  // Cargamos las unidades y preguntas desde los hooks
  const unitsData = useUnits();
  const questionsData = useQuestions();

  if (unitsData.length === 0 || questionsData.length === 0) {
    return (
      <div className="p-6">
        <p>Cargando contenido...</p>
      </div>
    );
  }

  // Mapeamos las preguntas a cada unidad, asignándolas al array "tiles" transformando cada pregunta a un tile.
  const unitsWithTiles = mapQuestionsToUnits(unitsData, questionsData.map((q) => ({
    ...q,
    // Transformamos la pregunta a tile según su tipo.
    // Por ejemplo, para "Choice" se le asigna "book"; para "OpenEntry" se le asigna "star".
    type: q.type === "Choice" ? "book" : q.type === "OpenEntry" ? "star" : "book",
    description: q.body,
  })));

  // Ordenamos las unidades por level (ascendente)
  const sortedUnits = [...unitsWithTiles].sort((a, b) => a.level - b.level);

  return (
    <>
      <TopBar backgroundColor={topBarColors.backgroundColor} borderColor={topBarColors.borderColor} />
      <LeftBar selectedTab="Learn" />
      <div className="flex justify-center gap-3 pt-14 sm:p-6 sm:pt-10 md:ml-24 lg:ml-64 lg:gap-12">
        <div className="flex max-w-2xl grow flex-col">
          {sortedUnits.map((unit) => (
            <UnitSection unit={unit} key={unit._id} />
          ))}
          <div className="sticky bottom-28 left-0 right-0 flex items-end justify-between">
            {scrollY > 100 && (
              <button
                className="absolute right-4 flex h-14 w-14 items-center justify-center self-end rounded-2xl border-2 border-b-4 border-gray-200 bg-white transition hover:bg-gray-50 hover:brightness-90 md:right-0"
                onClick={() => scrollTo(0, 0)}
              >
                <span className="sr-only">Jump to top</span>
                <UpArrowSvg />
              </button>
            )}
          </div>
        </div>
        <RightBar />
      </div>
      <div className="pt-[90px]"></div>
      <BottomBar selectedTab="Learn" />
      <LoginScreen loginScreenState={loginScreenState} setLoginScreenState={setLoginScreenState} />
    </>
  );
};

export default withAuth(Learn);

const LessonCompletionSvg = ({
  lessonsCompleted,
  status,
  style = {},
}: {
  lessonsCompleted: number;
  status: TileStatus;
  style?: React.HTMLAttributes<SVGElement>["style"];
}) => {
  if (status !== "ACTIVE") return null;
  switch (lessonsCompleted % 4) {
    case 0:
      return <LessonCompletionSvg0 style={style} />;
    case 1:
      return <LessonCompletionSvg1 style={style} />;
    case 2:
      return <LessonCompletionSvg2 style={style} />;
    case 3:
      return <LessonCompletionSvg3 style={style} />;
    default:
      return null;
  }
};

const HoverLabel = ({
  text,
  textColor,
}: {
  text: string;
  textColor: `text-${string}`;
}) => {
  const hoverElement = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(72);
  useEffect(() => {
    setWidth(hoverElement.current?.clientWidth ?? width);
  }, [hoverElement.current?.clientWidth, width]);
  return (
    <div
      className={`absolute z-10 w-max animate-bounce rounded-lg border-2 border-gray-200 bg-white px-3 py-2 font-bold uppercase ${textColor}`}
      style={{ top: "-25%", left: `calc(50% - ${width / 2}px)` }}
      ref={hoverElement}
    >
      {text}
      <div
        className="absolute h-3 w-3 rotate-45 border-b-2 border-r-2 border-gray-200 bg-white"
        style={{ left: "calc(50% - 8px)", bottom: "-8px" }}
      ></div>
    </div>
  );
};

const UnitHeader = ({
  unitNumber,
  description,
  backgroundColor,
  borderColor,
}: {
  unitNumber: number;
  description: string;
  backgroundColor: `bg-${string}`;
  borderColor: `border-${string}`;
}) => {
  const language = useBoundStore((x) => x.language);
  return (
    <article className={["max-w-2xl text-white sm:rounded-xl", backgroundColor].join(" ")}>
      <header className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Unidad {unitNumber}</h2>
          <p className="text-lg">{description}</p>
        </div>
        <Link
          href={``}//aca hay que poner un link al pdf del material del taller.
          className={[
            "flex items-center gap-3 rounded-2xl border-2 border-b-4 p-3 transition hover:text-gray-100",
            borderColor,
          ].join(" ")}
        >
          <GuidebookSvg />
          <span className="sr-only font-bold uppercase lg:not-sr-only">Guidebook</span>
        </Link>
      </header>
    </article>
  );
};
