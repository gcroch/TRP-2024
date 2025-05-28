import { type NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAuth } from "~/components/withAuth";
import { useUnits } from "~/hooks/useUnits";
import { useQuestions } from "~/hooks/useQuestions";
import { useCompletedQuestions } from "~/hooks/useCompletedQuestions";

import {
  ActiveBookSvg,
  CheckmarkSvg,
  LockSvg,
  StarSvg,
  GuidebookSvg,
} from "~/components/Svgs";
import { TopBar } from "~/components/TopBar";
import { BottomBar } from "~/components/BottomBar";
import { RightBar } from "~/components/RightBar";
import { LeftBar } from "~/components/LeftBar";
import { LoginScreen, useLoginScreen } from "~/components/LoginScreen";

// --- Interfaces ---
interface Unit {
  _id: string;
  title: string;
  level: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  tiles: Array<{
    questionId: string;
    type: string;        // "book" o "star"
    description: string;
    exp: number;
  }>;
}

interface Question {
  _id: string;
  type: string;          // "Choice" o "OpenEntry"
  body: string;
  exp: number;
  unit_id: string;
}

// --- Transform backend questions a tiles ---
const questionToTile = (q: Question) => ({
  questionId: q._id,
  type: q.type === "Choice" ? "book" : "star",
  description: q.body,
  exp: q.exp,
});

const mapQuestionsToUnits = (
  units: Omit<Unit, "tiles">[],
  questions: Question[]
): Unit[] =>
  units.map((u) => ({
    ...u,
    tiles: questions
      .filter((q) => q.unit_id === u._id)
      .map(questionToTile),
  }));

// --- Render unitaria de la unidad con curva en S ---
const UnitSection = ({
  unit,
  completed,
}: {
  unit: Unit;
  completed: string[];
}) => {
  const router = useRouter();

  // pregunta activa
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const uncompleted = unit.tiles.filter(
      (t) => !completed.includes(t.questionId)
    );
    if (uncompleted.length > 0) {
      const idx = Math.floor(Math.random() * uncompleted.length);
      setActiveQuestionId(uncompleted[idx].questionId);
    } else {
      setActiveQuestionId(null);
    }
  }, [completed, unit.tiles]);

  const doneCount = unit.tiles.filter((t) =>
    completed.includes(t.questionId)
  ).length;

  const total = unit.tiles.length;
  const lockedCount =
    activeQuestionId === null
      ? total - doneCount
      : total - doneCount - 1;

  const activeTile = unit.tiles.find(
    (t) => t.questionId === activeQuestionId
  );

  // Construir array de nodos
  const nodes: React.ReactNode[] = [];  

  // checks
  for (let i = 0; i < doneCount; i++) {
    nodes.push(
      <button
        key={`done-${i}`}
        className="rounded-full p-4 border-b-8 border-yellow-500 bg-yellow-400"
      >
        <CheckmarkSvg />
      </button>
    );
  }

  // nodo activo
  if (activeTile) {
    nodes.push(
      <button
        key="active"
        onClick={() =>
          router.push(`/lesson?questionId=${activeTile.questionId}`)
        }
        className={`rounded-full p-4 border-b-8 transition-all ${
          unit.borderColor || "border-[#46a302]"
        } ${unit.backgroundColor || "bg-[#58cc02]"}`}
      >
        {activeTile.type === "book" ? <ActiveBookSvg /> : <StarSvg />}
      </button>
    );
  }

  // locks
  for (let i = 0; i < lockedCount; i++) {
    nodes.push(
      <button
        key={`locked-${i}`}
        className="rounded-full p-4 border-b-8 border-gray-300 bg-gray-200"
      >
        <LockSvg />
      </button>
    );
  }

  // Parámetros para la curva
  const AMPLITUDE = 40; // px
  const count = nodes.length;

  return (
    <section className="mb-12">
      {/* Header verde de la unidad */}
      <article
        className={`max-w-2xl text-white sm:rounded-xl ${
          unit.backgroundColor || "bg-[#58cc02]"
        }`}
      >
        <header className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-2xl font-bold">Unidad {unit.level}</h2>
            <p className="text-lg">{unit.title}</p>
          </div>
          <Link
            href={`https://duolingo.com/guidebook/${unit.level}`}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4 transition hover:text-gray-100 ${
              unit.borderColor || "border-[#46a302]"
            }`}
          >
            <GuidebookSvg />
            <span className="sr-only">Guidebook</span>
          </Link>
        </header>
      </article>

      {/* Camino curvado en S */}
      <div className="relative flex flex-col items-center gap-6 mt-6">
        {nodes.map((node, idx) => {
          const t = count > 1 ? idx / (count - 1) : 0;
          const x = Math.sin(t * Math.PI) * AMPLITUDE;
          return (
            <div
              key={idx}
              style={{ transform: `translateX(${x}px)` }}
              className="transition-transform"
            >
              {node}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// --- Página principal Learn ---
const Learn: NextPage = () => {
  const { loginScreenState, setLoginScreenState } = useLoginScreen();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unitsData = useUnits();
  const questionsData = useQuestions();
  const completed = useCompletedQuestions();

  if (unitsData.length === 0 || questionsData.length === 0) {
    return <div className="p-6">Cargando contenido...</div>;
  }

  const unitsWithTiles = mapQuestionsToUnits(unitsData, questionsData);
  const sortedUnits = [...unitsWithTiles].sort((a, b) => a.level - b.level);

  return (
    <>
      <TopBar backgroundColor="bg-[#58cc02]" borderColor="border-[#46a302]" />
      <LeftBar selectedTab="Learn" />

      <div className="flex justify-center gap-6 pt-14 p-6">
        <div className="w-full max-w-2xl">
          {sortedUnits.map((unit) => (
            <UnitSection key={unit._id} unit={unit} completed={completed} />
          ))}
          <div className="h-32" />
        </div>
        <RightBar />
      </div>

      <BottomBar selectedTab="Learn" />
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </>
  );
};

export default withAuth(Learn);
