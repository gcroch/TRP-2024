import React, { useEffect, useRef, useState } from "react";
import { useBoundStore } from "~/hooks/useBoundStore";
import { useRouter } from "next/router";
import { CloseSvg } from "./Svgs";
import Link from "next/link";

export type LoginScreenState = "HIDDEN" | "LOGIN";

export const useLoginScreen = () => {
  const router = useRouter();
  const loggedIn = useBoundStore((x) => x.loggedIn);
  const queryState: LoginScreenState = (() => {
    if (loggedIn) return "HIDDEN";
    if ("login" in router.query) return "LOGIN";
    return "HIDDEN";
  })();
  const [loginScreenState, setLoginScreenState] = useState(queryState);
  useEffect(() => setLoginScreenState(queryState), [queryState]);
  return { loginScreenState, setLoginScreenState };
};

export const LoginScreen = ({
  loginScreenState,
  setLoginScreenState,
}: {
  loginScreenState: LoginScreenState;
  setLoginScreenState: React.Dispatch<React.SetStateAction<LoginScreenState>>;
}) => {
  const router = useRouter();
  const loggedIn = useBoundStore((x) => x.loggedIn);
  const logIn = useBoundStore((x) => x.logIn);
  const setUser = useBoundStore((x) => x.setUser);

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  // Estado para mensajes de error
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loginScreenState !== "HIDDEN" && loggedIn) {
      setLoginScreenState("HIDDEN");
    }
  }, [loginScreenState, loggedIn, setLoginScreenState]);

  const logInAndSetUserProperties = async () => {
    try {
      // Limpiar error previo
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ DNI: dni, password }),
        }
      );

      if (!response.ok) {
        // Mostrar mensaje de error si credenciales incorrectas
        setError("Usuario o contraseña incorrectos");
        return;
      }

      const data = await response.json();
      const jwt = data.access_token;
      localStorage.setItem("token", jwt);

      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile`,
        { method: "GET", headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (!profileRes.ok) {
        console.error("Error al obtener el perfil:", await profileRes.text());
        setError("Error al obtener datos de usuario");
        return;
      }

      const profile = await profileRes.json();
      setUser({
        userId: profile.userId,
        DNI: profile.DNI || dni,
        name: profile.name || "Anónimo",
        lastname: profile.lastname || "",
        username: profile.username || "",
        xpThisWeek: profile.exp || 0,
      });

      logIn();
      router.push("/learn");
    } catch (err) {
      console.error("Error durante el fetch de login:", err);
      setError("Ocurrió un error, intenta nuevamente");
    }
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDni(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  return (
    <article
      className={[
        "fixed inset-0 z-30 flex flex-col bg-white p-7 transition duration-300",
        loginScreenState === "HIDDEN"
          ? "pointer-events-none opacity-0"
          : "opacity-100",
      ].join(" ")}
      aria-hidden={loginScreenState === "HIDDEN"}
    >
      <header className="flex flex-row-reverse justify-between sm:flex-row">
        <button
          className="flex text-gray-400"
          onClick={() => setLoginScreenState("HIDDEN")}
        >
          <CloseSvg />
          <span className="sr-only">Close</span>
        </button>
      </header>
      <div className="flex grow items-center justify-center">
        <div className="flex w-full flex-col gap-5 sm:w-96">
          <h2 className="text-center text-2xl font-bold text-gray-800">
            Iniciar sesión
          </h2>
          <div className="flex flex-col gap-2 text-black">
            <input
              className="grow rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3"
              placeholder="DNI"
              value={dni}
              onChange={handleDniChange}
            />
            <div className="relative flex grow">
              <input
                className="grow rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
            {error && (
              <p className="text-center text-red-500 text-sm font-medium">
                {error}
              </p>
            )}
          </div>
          <button
            className="rounded-2xl border-b-4 border-blue-500 bg-blue-400 py-3 font-bold uppercase text-white transition hover:brightness-110"
            onClick={logInAndSetUserProperties}
          >
            Aceptar
          </button>
        </div>
      </div>
    </article>
  );
};
