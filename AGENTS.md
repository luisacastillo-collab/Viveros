# AGENTS.md — Proyecto Vivero

## Contexto del Proyecto

**ViveroOnline** es una plataforma web de directorio de viveros construida con HTML/CSS/JavaScript vanilla + Firebase (Hosting + Auth + Firestore). Es un proyecto de aprendizaje de Firebase partiendo de una plantilla AniWalks modificada.

- **Repositorio GitHub**: https://github.com/luisacastillo-collab/viveros
- **Firebase Project**: `aniwalks-2e9ec`
- **URL desplegada**: https://aniwalks-2e9ec.web.app (o .firebaseapp.com)
- **Plan Firebase**: Spark (gratuito) — sin Storage, sin App Hosting, sin emulators

## Tecnologías

- HTML5 + Bootstrap 4 + jQuery
- Leaflet.js (mapa interactivo)
- Firebase Authentication (Google + email/password)
- Firebase Firestore (base de datos NoSQL)
- Firebase Hosting (deploy estático)
- ES Modules via CDN (`https://www.gstatic.com/firebasejs/10.12.0/`)

## Estructura de Archivos

```
vivero/
├── firebase-config.js       # Inicialización Firebase (compartido por todas las páginas)
├── firebase.json            # Config hosting: "public": "."
├── .firebaserc              # Proyecto: aniwalks-2e9ec
├── index.html               # Directorio de viveros (página principal)
├── login.html               # Login + registro (Google y email/password)
├── registro-vivero.html     # Formulario para registrar un nuevo vivero
├── vivero-detalle.html      # Catálogo de plantas del vivero + CRUD para dueños
├── mapa_viveros.html        # Mapa Leaflet (actualmente con datos hardcodeados)
├── about.html               # Quiénes somos
├── contact.html             # Contacto
├── price.html               # Precios (heredado de AniWalks, pendiente actualizar)
├── plants.html              # Plantas estáticas (heredado)
├── js/
│   ├── auth-guard.js        # Protege páginas: redirige a login.html si no hay sesión
│   └── main.js              # Scripts Bootstrap/jQuery
└── css/style.css            # Estilos principales
```

## Estructura Firestore

```
viveros/                          # Colección principal
  {viveroId}/                     # Documento del vivero
    nombre: string
    descripción: string           # OJO: con acento (así fue creado en Firestore)
    ciudad: string
    dirección: string             # OJO: con acento
    telefono: string
    horario: string
    email: string
    duenoId: string               # UID del usuario Firebase dueño del vivero
    creadoEn: Timestamp
    
    plantas/                      # Subcolección de plantas
      {plantaId}/
        nombre: string
        descripcion: string       # sin acento
        precio: number
        categoria: "interior" | "exterior"
        tamano: "pequeña" | "mediana" | "grande"
        disponible: "true" | "false"
        imagen: string            # URL de imagen (no archivo, Storage es de pago)
        creadoEn: Timestamp
```

**IMPORTANTE**: Los campos `descripción` y `dirección` del vivero tienen acento porque así se crearon en Firestore Console. No se pueden renombrar desde la consola. El código los lee con acento: `v.descripción || v.descripcion`.

## Comandos Frecuentes

```bash
# Deploy
firebase deploy --only hosting

# Git
git add .
git commit -m "mensaje"
git push

# Si expira la sesión de Firebase
firebase login --reauth
```

## Funcionalidades Implementadas

1. **Autenticación**: Login con Google + email/password. Registro de nuevos usuarios.
2. **Auth Guard**: Todas las páginas (excepto `login.html`) redirigen si no hay sesión. Implementado en `js/auth-guard.js`.
3. **Registro de vivero**: Formulario en `registro-vivero.html`. Guarda en Firestore con `duenoId: currentUser.uid`.
4. **Directorio**: `index.html` lista todos los viveros de Firestore. Muestra botón "Registrar Vivero" solo si hay sesión.
5. **Detalle del vivero**: `vivero-detalle.html?id={viveroId}` muestra info del vivero y catálogo de plantas.
6. **CRUD de plantas**: El dueño del vivero (detectado comparando `user.uid === v.duenoId`) puede agregar, editar y eliminar plantas. El modal `#modalPlanta` se reutiliza para agregar y editar (variable `plantaEditandoId` controla el modo).

## Funcionalidades Pendientes

- **Buscador**: Filtrar viveros por ciudad o plantas por categoría
- **Mapa con datos reales**: `mapa_viveros.html` usa datos hardcodeados; conectarlo a Firestore requiere geocodificación (latitud/longitud al registrar vivero)
- **Editar perfil del vivero**: Permitir al dueño actualizar info del vivero
- **Limpiar páginas heredadas**: `price.html`, `plants.html`, `about.html` aún tienen contenido de AniWalks

## Patrones de Código

### firebase-config.js — archivo central compartido
Todas las páginas importan desde aquí con ES Modules:
```javascript
import { auth, db, onAuthStateChanged, ... } from './firebase-config.js';
```

### Detectar si el usuario es dueño del vivero
```javascript
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === v.duenoId) {
        esDueno = true;
        // mostrar botones de gestión
    }
});
```

### Imágenes de plantas
Se usan URLs de internet (no subida de archivos) porque Firebase Storage requiere plan Blaze (de pago).

## Problemas Conocidos / Soluciones

| Problema | Solución |
|----------|----------|
| `descripción` con acento en Firestore | Leer con `v.descripción \|\| v.descripcion` |
| Vivero creado manualmente tiene `duenoId: "test"` | Registrar un nuevo vivero desde la app (asigna UID real automáticamente) |
| Firebase Storage es de pago | Usar URLs de imagen en lugar de subir archivos |
| Sesión de Firebase CLI expira | `firebase login --reauth` |
| Funciones `editarPlanta`/`eliminarPlanta` no accesibles desde HTML | Exponerlas con `window.editarPlanta = ...` dentro del módulo ES |
