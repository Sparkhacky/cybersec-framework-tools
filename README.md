
# Índice de Herramientas de Ciberseguridad (GitHub Pages)

Sitio **estático** listo para publicar en GitHub Pages: buscador y filtros por categorías para enlaces a repositorios de ciberseguridad.

## Cómo usar

1. Crea un repositorio en GitHub, por ejemplo `cybersec-tools-index`.
2. Sube estos archivos a la raíz (`index.html`, `styles.css`, `app.js`, `repos.json`).
3. Activa **GitHub Pages** (Settings → Pages → _Deploy from a branch_ → `main` / `/root`).  
4. Abre la URL pública que te da GitHub Pages.

## Añadir/editar herramientas

Edita `repos.json` y añade objetos con este esquema:

```json
{
  "name": "Nombre",
  "description": "Descripción corta",
  "repo": "https://github.com/usuario/proyecto",
  "categories": ["Hacking Web", "Reconocimiento"],
  "platforms": ["Linux", "Windows"],
  "tags": ["sqli", "scanner"],
  "language": "Python"
}
```

No hay backend ni librerías: **solo HTML/CSS/JS**. Rápido, minimalista y fácil de mantener.

> Recuerda actuar conforme a la ley y la ética profesional. Usa las herramientas con permiso explícito.
