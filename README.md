# React Duolingo

https://react-duolingo-clone.vercel.app/ 

A simple [Duolingo](https://www.duolingo.com) web app clone written with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Next.js](https://nextjs.org/), [Tailwind](https://tailwindcss.com/), and [Zustand](https://github.com/pmndrs/zustand). I used [create-t3-app](https://github.com/t3-oss/create-t3-app) to initialize the project.

<img src="./screenshots/screenshot-mobile.png" alt="Mobile screenshot" />
<img src="./screenshots/screenshot-desktop.png" alt="Desktop screenshot" />

## Variables de entorno

Hay que crear el archivo con las variables de entorno `.env`, tomando como ejemplo a [`.env.example`](.env.example).

Agregué variables de entorno como se indica en [`.env.example`](.env.example):

* `NEXT_PUBLIC_BACKEND_HOST`: Ubicación de la API del backend.

| Tomar en cuenta que hay que prefijar las variables de entorno personalizadas con el string `NEXT_PUBLIC_`.