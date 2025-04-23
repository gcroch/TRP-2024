import { type NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
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

// --------------------------------------------------
// Hook para obtener el perfil (incluye role)
// --------------------------------------------------
interface UserProfile {
  userId: string;
  DNI: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
  exp: number;
}

const useUserProfile = (): UserProfile | null => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener perfil");
        return res.json();
      })
      .then((data) => {
        setProfile({
          userId: data.userId,
          DNI: data.DNI,
          name: data.name,
          lastname: data.lastname,
          email: data.email,
          role: data.role,
          exp: data.exp,
        });
      })
      .catch((err) => {
        console.error("fetch profile:", err);
      });
  }, []);

  return profile;
};

// --------------------------------------------------
// Secciones del perfil
// --------------------------------------------------
const ProfileTopSection = ({ profile }: { profile: UserProfile }) => (
  <section className="flex flex-row-reverse border-b-2 border-gray-200 pb-8 md:flex-row md:gap-8">
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-3xl font-bold text-gray-400 md:h-44 md:w-44 md:text-7xl">
      {profile.name.charAt(0).toUpperCase()}
    </div>
    <div className="flex grow flex-col justify-between gap-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">
          {profile.name} {profile.lastname}
        </h1>
        <div className="text-sm text-gray-400">{profile.DNI}</div>
        <div className="flex items-center gap-3">
          <ProfileTimeJoinedSvg />
          <span className="text-gray-500">{profile.email}</span>
        </div>
      </div>
    </div>
  </section>
);

const ProfileStatsSection = ({ exp }: { exp: number }) => (
  <section>
    <h2 className="mb-5 text-2xl font-bold">Estadísticas</h2>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex gap-2 rounded-2xl border-2 border-gray-200 p-2 md:gap-3 md:px-6 md:py-4">
        <LightningProgressSvg size={35} />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{exp}</span>
          <span className="text-sm text-gray-400 md:text-base">Total XP</span>
        </div>
      </div>
    </div>
  </section>
);

const ChangePasswordSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const handleChangePassword = async () => {
    if (!token) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        password: newPassword,
      }),
    });
    if (res.ok) {
      setMessage("Contraseña actualizada.");
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const errData = await res.json();
      setMessage(errData.error || "Error al actualizar contraseña");
    }
  };

  return (
    <section className="mt-8">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Cambiar contraseña
        </button>
      ) : (
        <div className="flex flex-col gap-2 max-w-sm">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border px-2 py-1"
          />
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
            Guardar
          </button>
        </div>
      )}
      {message && <p className="mt-2 text-sm text-center">{message}</p>}
    </section>
  );
};

const ProfileTimeJoinedSvg = () => (
  <svg width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#888" />
  </svg>
);

// --------------------------------------------------
// Página completa
// --------------------------------------------------
const Profile: NextPage = () => {
  const { loginScreenState, setLoginScreenState } = useLoginScreen();
  const router = useRouter();
  const profile = useUserProfile();

  const loggedIn = useBoundStore((x) => x.loggedIn);
  useEffect(() => {
    if (!loggedIn) router.push("/");
  }, [loggedIn, router]);

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    // Hacer el contenedor scrollable y agregar padding-bottom para móviles
    <div className="min-h-screen overflow-y-auto">
      <TopBar backgroundColor="bg-white" borderColor="border-gray-200" />
      <LeftBar selectedTab="Profile" />

      <main className="pt-14 md:ml-24 lg:ml-64 p-5 pb-24 max-w-4xl mx-auto space-y-8">
        <ProfileTopSection profile={profile} />
        <ProfileStatsSection exp={profile.exp} />
        <ChangePasswordSection />

        {profile.role === "admin" && (
          <section className="mt-12 border-t pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Administración</h2>
            <div className="flex flex-col gap-3 max-w-sm">
              <button
                onClick={() => router.push("/admin/units")}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                ABM Unidades
              </button>
              <button
                onClick={() => router.push("/admin/questions")}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                ABM Preguntas
              </button>
              <button
                onClick={() => router.push("/admin/users")}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                ABM Usuarios
              </button>
            </div>
          </section>
        )}
      </main>

      <RightBar />
      <BottomBar selectedTab="Profile" />
      <LoginScreen
        loginScreenState={loginScreenState}
        setLoginScreenState={setLoginScreenState}
      />
    </div>
  );
};

export default withAuth(Profile);
