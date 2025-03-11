Para ejecutar el front del proyecto, lo que debemos hacer es lo siguiente:

Clonamos el proyecto

Nos paramos en la carpeta front
```
   cd front
```
Luego instalamos las dependencias npm
```   
   npm install
```
```
   npm run build
```
y finalmente ejecutamos el front con
```
   npm start
```
y nos con esto en marcha nos podemos dirigir a localhost:3000 y observar el front andando


Back-end (API con Flask)

Para ejecutar la API de Flask, sigue estos pasos:

1. Navegar a la carpeta back:

```
   cd back
```

2. (Opcional) Crear y activar un entorno virtual para aislar las dependencias:

```
python3 -m venv venv
```

```
source venv/bin/activate
```

3. Instalar Dependencias como Flask:

```
pip install -r requirements.txt
```

4. Ejecutar la API:

```
python app.py
```

Por defecto, la API se ejecuta en http://localhost:5000.
