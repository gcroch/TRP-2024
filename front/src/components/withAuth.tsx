import { useEffect } from "react";
import { useRouter } from "next/router";
import { useBoundStore } from "~/hooks/useBoundStore";

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithAuthComponent(props: P & JSX.IntrinsicAttributes) {
    const router = useRouter();
    const loggedIn = useBoundStore((state) => state.loggedIn);

    useEffect(() => {
      if (!loggedIn) {
        // Redirige al index si el usuario no está autenticado
        router.push("/");
      }
    }, [loggedIn, router]);

    // Mientras no se verifique la autenticación, puedes mostrar un loading o nada
    if (!loggedIn) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
