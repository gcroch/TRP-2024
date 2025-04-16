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
  // Usamos setUser en vez de setUsername y setName
  const setUser = useBoundStore((x) => x.setUser);

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [ageTooltipShown, setAgeTooltipShown] = useState(false);
  const nameInputRef = useRef<null | HTMLInputElement>(null);

  useEffect(() => {
    if (loginScreenState !== "HIDDEN" && loggedIn) {
      setLoginScreenState("HIDDEN");
    }
  }, [loginScreenState, loggedIn, setLoginScreenState]);

  const logInAndSetUserProperties = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            DNI: dni,
            password: password,
          }),
        }
      );
  
      if (!response.ok) {
        console.error("Error en el login:", await response.text());
        return;
      }
  
      const data = await response.json();
      const jwt = data.access_token;
      console.log("JWT recibido:", jwt);
  
      localStorage.setItem("token", jwt);
  
      // Llamamos a /profile para obtener el user_id y otros datos
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
  
      if (!profileRes.ok) {
        console.error("Error al obtener el perfil:", await profileRes.text());
        return;
      }
  
      const profile = await profileRes.json();
  
      // Seteamos el user en el store, incluyendo el user_id
      setUser({
        userId: profile.userId,
        DNI: profile.DNI || dni,
        name: profile.name || "Anonimo",
        lastname: profile.lastname || "",
        username: profile.username || "", // o generarlo a partir del nombre
        xpThisWeek: profile.exp || 0,
      });
  
      logIn();
      router.push("/learn");
    } catch (error) {
      console.error("Error durante el fetch de login:", error);
    }
  };
  

  return (
    <article
      className={[
        "fixed inset-0 z-30 flex flex-col bg-white p-7 transition duration-300",
        loginScreenState === "HIDDEN"
          ? "pointer-events-none opacity-0"
          : "opacity-100",
      ].join(" ")}
      aria-hidden={!loginScreenState}
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
            {loginScreenState === "LOGIN" ? "Iniciar sesión" : "Iniciar sesión"}
          </h2>
          <div className="flex flex-col gap-2 text-black">
            <input
              className="grow rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
            <div className="relative flex grow">
              <input
                className="grow rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            className="rounded-2xl border-b-4 border-blue-500 bg-blue-400 py-3 font-bold uppercase text-white transition hover:brightness-110"
            onClick={logInAndSetUserProperties}
          >
            {loginScreenState === "LOGIN" ? "Aceptar" : "Aceptar"}
          </button>
          <p className="block text-center sm:hidden"></p>
        </div>
      </div>
    </article>
  );
};
