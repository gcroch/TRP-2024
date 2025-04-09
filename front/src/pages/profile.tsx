import { type NextPage } from "next";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  EmptyFireSvg,
  FireSvg,
  LightningProgressSvg,
} from "~/components/Svgs";
import { TopBar } from "~/components/TopBar";
import { BottomBar } from "~/components/BottomBar";
import { RightBar } from "~/components/RightBar";
import { LeftBar } from "~/components/LeftBar";
import { useRouter } from "next/router";
import { LoginScreen, useLoginScreen } from "~/components/LoginScreen";
import { useBoundStore } from "~/hooks/useBoundStore";
import { withAuth } from "~/components/withAuth";

// Hook para obtener los datos de perfil del usuario desde la API backend
const useUserProfile = () => {
  const [profile, setProfile] = useState<{
    DNI: string;
    name: string;
    lastname: string;
    email: string;
    role: string;
    exp: number;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Se asume que ya se guardó el JWT al hacer login
    if (token) {
      fetch("http://127.0.0.1:5000/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al obtener el perfil");
          }
          return response.json();
        })
        .then((data) => setProfile(data))
        .catch((error) => console.error("Error fetching profile:", error));
    }
  }, []);

  return profile;
};
const ProfileTopSection = () => {
  const router = useRouter();
  const loggedIn = useBoundStore((x) => x.loggedIn);
  const profile = useUserProfile();

  useEffect(() => {
    if (!loggedIn) {
      void router.push("/");
    }
  }, [loggedIn, router]);

  if (!profile) {
    return <div className="p-5 text-center">Cargando perfil...</div>;
  }

  return (
    <section className="flex flex-row-reverse border-b-2 border-gray-200 pb-8 md:flex-row md:gap-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-3xl font-bold text-gray-400 md:h-44 md:w-44 md:text-7xl">
        {profile.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex grow flex-col justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-bold">
              {profile.name} {profile.lastname}
            </h1>
            <div className="text-sm text-gray-400">{profile.DNI}</div>
          </div>
          <div className="flex items-center gap-3">
            <ProfileTimeJoinedSvg />
            <span className="text-gray-500">{profile.email}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProfileStatsSection = () => {
  const profile = useUserProfile();
  const totalXp = profile?.exp ?? 0;

  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold">Estadisticas</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex gap-2 rounded-2xl border-2 border-gray-200 p-2 md:gap-3 md:px-6 md:py-4">
          <LightningProgressSvg size={35} />
          <div className="flex flex-col">
            <span className="text-xl font-bold">{totalXp}</span>
            <span className="text-sm text-gray-400 md:text-base">Total XP</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const ChangePasswordSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const token = localStorage.getItem("access_token");

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (response.ok) {
        setMessage("Contraseña actualizada.");
        setIsEditing(false);
        // Opcional: recarga de perfil o redirección
      } else {
        setMessage("Error al actualizar la contraseña.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage("Error al actualizar la contraseña.");
    }
  };

  return (
    <div className="mt-4">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Cambiar contraseña
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border px-2 py-1"
          />
          <button
            onClick={handleChangePassword}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            OK
          </button>
        </div>
      )}
      {message && <div className="mt-2 text-sm text-center">{message}</div>}
    </div>
  );
};

const ProfileTopBar = () => {
  return (
    <div className="fixed left-0 right-0 top-0 flex h-16 items-center justify-between border-b-2 border-gray-200 bg-white px-5 text-xl font-bold text-gray-300 md:hidden">
      <span className="text-gray-400">Perfil</span>
    </div>
  );
};

const Profile: NextPage = () => {
  const { loginScreenState, setLoginScreenState } = useLoginScreen();

  return (
    <div>
      <ProfileTopBar />
      <LeftBar selectedTab="Profile" />
      <div className="flex justify-center gap-3 pt-14 md:ml-24 lg:ml-64 lg:gap-12">
        <div className="flex w-full max-w-4xl flex-col gap-5 p-5">
          <ProfileTopSection />
          <ProfileStatsSection />
          <ChangePasswordSection />
        </div>
      </div>
      <div className="pt-[90px]"></div>
      <BottomBar selectedTab="Profile" />
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </div>
  );
};

export default withAuth(Profile);
// Componente para mostrar la información "time joined"
// Puedes adaptarlo o reemplazarlo con el SVG real que necesites
const ProfileTimeJoinedSvg = () => {
  return (
    <svg width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#888" />
    </svg>
  );
};
