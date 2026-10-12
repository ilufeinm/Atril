# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Usuario principal (confirmado por Ilan, 2026-10-12): el músico que toca en vivo.** Es un músico profesional o serio que lleva sus partituras al ensayo y al escenario. Toca con el instrumento en la mano, con poca atención disponible para la app, muchas veces con poca luz. Su trabajo: tener la partitura correcta delante, pasar de página sin pensar y que la app no falle ni lo distraiga. Cuando hay que elegir, se decide primero por él.

Otros usuarios (documentados en los docs de UX del proyecto):
- **Músico individual**: importa, organiza, busca, anota y toca su biblioteca.
- **Director o líder de banda**: crea la banda, arma repertorios y setlists, invita músicos y da permisos de editor.
- **Integrante de banda**: recibe el repertorio compartido y las partituras actualizadas.

## Product Purpose

Atril es una app de partituras: leer, anotar y tocar con la banda desde el celular o la tablet, con un modo escenario sin distracciones. Reemplaza la carpeta de papeles en el atril.

Promesa: la partitura correcta delante rápido, una interfaz calma y una presentación en vivo confiable. La fricción que elimina: "necesito esta obra" → "tengo la partitura delante" → "puedo tocar".

Éxito: un músico en el escenario, con el instrumento en la mano, pasa de página en 2 segundos sin pensar en la app. Ideal declarado: "Me olvidé de que estaba usando una app. Solo estaba tocando."

Métricas de éxito cuantitativas: **no definidas todavía** (no hay datos de descargas, retención ni ratings registrados).

## Positioning

Confirmado por Ilan (2026-10-12): Atril da el poder que necesita un músico profesional **con mucha menos complejidad** que las apps de partituras tradicionales (forScore, MobileSheets, Newzik, OnSong, BandHelper), **y permite tocar en sintonía con la banda**: repertorio compartido entre integrantes y modo en vivo de banda.

No compite por cantidad de funciones. Toda función nueva tiene que resolver un problema real de un músico, no existir porque la tiene un competidor.

## Operating Context

- **Ensayo y show en vivo**: escenario, bar o sala con poca luz, brillo o reflejos. El músico está de pie, con el instrumento en la mano y la atención en la música.
- **Gestión vs. performance**: son dos contextos distintos. En gestión (organizar biblioteca, armar setlists, crear bandas) hay atención disponible. En performance hay muy poca.
- **Material de trabajo**: lead sheets y partituras en PDF o foto (Real Book, standards de jazz). Contenido de demo: Autumn Leaves, All of Me, Summertime y Take Five, rotulado como demo y borrable.
- **Repertorio de banda**: el director prepara el setlist de un show con fecha y lugar. Los integrantes lo reciben y lo tocan en el Modo En Vivo.
- **Pedales de página**: los músicos usan pedales Bluetooth que funcionan como teclado (flechas o AvPag).

## Capabilities and Constraints

### Implementado (verificado en el código el 2026-10-12)
- Biblioteca de partituras con búsqueda, favoritos y vistas lista/grilla (`/biblioteca`, `/favoritos`).
- Repertorios y setlists (`/repertorios`). Exportar setlist a PDF.
- Modo En Vivo / presentación (`/en-vivo/:id`, `/presentacion/:id`): tap para avanzar, navegación con teclado (flechas, AvPag) para pedales, pantalla siempre encendida.
- Anotaciones sobre la partitura.
- Bandas (`/modo-banda`): crear banda, invitar con código o link (`/join/:code`, `/modo-banda/invitar/:code`), shows, modo en vivo de banda, roles director/editor/integrante.
- Grabación de la performance (`/grabaciones`): **es función premium** (al usuario gratuito le aparece un diálogo de premium).
- Cuenta: registro, login (incluido Google), recuperar contraseña, perfil, bienvenida/onboarding (`/bienvenida`), páginas Acerca de y Contacto.
- Plan Gratis / Premium. Texto actual de la oferta: "Repertorios y modo banda ilimitados, sincronización con Google Drive y soporte prioritario. US$4,99/mes".

### Previsto o incompleto (no dar por hecho)
- **Importar desde Google Drive**: el botón existe pero muestra "próximamente".
- **Sincronización con Google Drive**: aparece en Perfil y en la oferta Premium, pero el texto viene de Base44 y no está verificado que funcione tras la migración.
- **Uso sin conexión**: no hay soporte offline implementado (sin service worker ni caché de partituras). Es un objetivo explícito de los docs de UX.
- **Pedal Bluetooth directo**: hoy no conecta. Solo funcionan los pedales que actúan como teclado.
- **Suscripciones en Google Play**: no están creadas. No está definido el cobro real del Premium.
- **Anuncios (AdMob)**: el plugin está instalado, pero el código que muestra anuncios no está en la versión actual.
- **iOS y web pública como producto**: la visión es llegar a todas las plataformas. Hoy se publica en Android y en la web (Cloudflare). iOS no tiene fecha.
- **Chat de banda**: posible a futuro.

### Restricciones técnicas
- React + Vite. Backend en Supabase (migrado desde Base44 en octubre de 2026; `src/api/base44Client.js` es una capa de compatibilidad que usa Supabase por debajo).
- Android con Capacitor (`android/`, paquete `com.scorebook.musicapp`). Web publicada en Cloudflare (`wrangler.jsonc`).
- Una sola interfaz para todas las plataformas (plataforma de diseño: `web`).

### Terminología
Usar siempre la misma palabra para el mismo concepto: **Canciones, Partituras, Repertorio, Bandas, Shows, Setlists, Performance, Modo En Vivo**. Hoy la app mezcla nombres (por ejemplo, pestaña "Partituras" y pantalla "Biblioteca"; "Abrir presentación" e "Iniciar en vivo"). Unificarlos es una tarea pendiente, no decidida en detalle.

### Decisiones abiertas
- Usuario objetivo fino (instrumento, nivel, país, géneros).
- Qué es gratis y qué es premium, y el precio definitivo.
- Glosario final de términos.

## Brand Commitments

- **Nombre**: Atril. Se escribe "Atril" (no en mayúsculas). Nombres anteriores: StageBook → ScoreBook. El paquete Android conserva `com.scorebook.musicapp`.
- **Slogan**: «Tu atril, siempre listo.» · Etiqueta: «Para músicos profesionales» · Handle: @atril.app.
- **Voz**: español rioplatense con voseo, frases cortas que cierran con punto, de músico a músico ("Leé en vivo. Sin distracciones.", "Tocá en sintonía con tu banda.").
- **Personalidad**: simple, amigable, premium, moderno, minimalista, elegante, rápido, confiable, calmo. No debe sentirse recargado, enterprise, técnico, sobre-ingenierizado ni clon de otra app. Ilan pidió explícitamente algo profesional y para gente seria, "no un juego de niños".
- **Identidad visual v2**: existe y está documentada fuera de este repo, en `Escritorio/Atril/marca/` (manual PDF, logo, piezas de Instagram, Play Store, sistema de diseño con `atril-tokens.css`). La interfaz actual de la app es la autoridad visual vigente.
- **Plataformas en la comunicación**: no decir "para Android". La visión es multiplataforma (las piezas de Instagram v2 todavía dicen "para Android" y están desactualizadas en ese punto).
- **Cambios de diseño**: sutiles y sobre la app real. No rediseñar ni cambiar el estilo sin pedido explícito de Ilan.

## Evidence on Hand

- **Contenido demo** de 4 standards (Autumn Leaves, All of Me, Summertime, Take Five) con 3 bandas demo (Los Nocturnos, Banda de Teatro, Wedding Band). Siempre rotulado DEMO.
- **Identidad visual y piezas**: `Escritorio/Atril/marca/` (fuera de este repo).
- **Docs del producto y de UX**: principios, decisiones y revisiones en el segundo cerebro (`Escritorio/Atril/cerebro/WIKI/`, por ejemplo `principios-ux.md`, `modo-en-vivo.md`, `decisiones-de-producto.md`) y la revisión UX del 2026-10-11 (`cerebro/OUTPUTS/2026-10-11-revision-ux-app.md`).
- **Ausencias que no se deben inventar**: no hay testimonios, reseñas, usuarios reales citables, métricas de uso, casos de estudio, prensa ni precios de competidores.

## Product Principles

1. **El Modo En Vivo es sagrado.** La confiabilidad en vivo va primero. Nada interrumpe al músico mientras toca: ni pop-ups, ni ventas, ni permisos, ni tutoriales. Si algo falla, recuperarse en un toque es más importante que explicar el error.
2. **La partitura correcta, delante, rápido.** Cada flujo se mide por cuánto tarda el músico en pasar de "necesito esta obra" a "puedo tocar".
3. **Poder profesional, complejidad mínima.** Gana la solución más simple que resuelve bien. Cada función necesita un problema real de un músico. No se copia a la competencia.
4. **Tocar en sintonía con la banda.** El repertorio compartido y el modo banda son parte del núcleo, no un extra.
5. **Calma y confianza.** La app tiene que sentirse calma y hacer visible su estado (guardado, sincronizando, grabando, offline) para que el músico confíe en ella.

## Accessibility & Inclusion

- **Condiciones de escenario**: poca luz, brillo y reflejos. La legibilidad de la partitura manda. Los controles tienen que tener áreas táctiles grandes y separadas, y las acciones críticas no pueden depender solo de gestos.
- **Uso con las manos ocupadas**: pase de página por toque o por pedal (teclado).
- **Idioma**: la interfaz está en español rioplatense, pero `index.html` declara `lang="en"`. Es una discrepancia conocida, no corregida.
- No se estableció un estándar formal (como WCAG AA) como requisito del producto.
