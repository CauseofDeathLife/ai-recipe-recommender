# Instrucciones de despliegue — Bios Recipe Recommender

Este documento explica cómo ejecutar la aplicación localmente a partir del archivo de imagen Docker que se entrega como parte del Reto 12.

---

## ¿Qué es el archivo `bios-recommender.tar`?

Es una imagen Docker exportada que contiene la aplicación web lista para correr. No requiere tener Node.js, npm ni acceso al código fuente; solo necesita Docker.

---

## Prerequisito

Tener **Docker Desktop** instalado y en ejecución.

- Descarga: https://www.docker.com/products/docker-desktop/

---

## Paso 1 — Cargar la imagen

Desde la carpeta donde esté el archivo `bios-recommender.tar`, ejecutar:

```bash
docker load -i bios-recommender.tar
```

Esto registra la imagen `bios-recommender:1.0.0` en Docker local.

---

## Paso 2 — Correr el contenedor

```bash
docker run -d -p 8080:80 --name bios-recommender bios-recommender:1.0.0
```

---

## Paso 3 — Abrir la aplicación

Abrir el navegador en:

```
http://localhost:8080
```

---

## Nota sobre la generación de recetas por IA

Si al solicitar una receta aparece un mensaje de error o la respuesta se ve genérica, es porque el webhook de N8N (plan de prueba gratuito) ha expirado. Esto es comportamiento esperado: la aplicación detecta el fallo y cae automáticamente a un generador local de respaldo, por lo que la funcionalidad principal sigue disponible.

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Detener el contenedor | `docker stop bios-recommender` |
| Eliminar el contenedor | `docker rm bios-recommender` |
| Eliminar la imagen | `docker rmi bios-recommender:1.0.0` |
| Ver logs del contenedor | `docker logs bios-recommender` |

---

## Resumen rápido (todo en un bloque)

```bash
# Cargar
docker load -i bios-recommender.tar

# Correr
docker run -d -p 8080:80 --name bios-recommender bios-recommender:1.0.0

# Abrir en el navegador: http://localhost:8080

# Limpiar cuando termine
docker stop bios-recommender
docker rm bios-recommender
```
