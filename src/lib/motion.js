// Sistema de movimiento de Atril.
// Un solo lenguaje de animación: mismas curvas, mismos resortes y mismos tiempos en toda la app.
// Regla de oro: solo se animan `transform` y `opacity` (van por GPU y no traban el scroll).

// Curvas
export const EASE_OUT = [0.22, 1, 0.36, 1];   // entrada: arranca rápido y aterriza suave
export const EASE_IN = [0.4, 0, 1, 1];        // salida: rápida y discreta

// Resortes
export const SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 };
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 30 };
export const SPRING_BOUNCY = { type: 'spring', stiffness: 520, damping: 24 };
export const SHEET_SPRING = { type: 'spring', stiffness: 380, damping: 38 };

// Demora escalonada para listas: tope para que las listas largas no se sientan lentas.
export const itemDelay = (i = 0, step = 0.04, max = 10) => Math.min(i, max) * step;

// Variantes para entradas escalonadas
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const stagger = (step = 0.06, start = 0.04) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: start } },
});

// Props listos para esparcir en una tarjeta de lista (motion.div / motion.button / motion.create(Link)).
// Entrada con fade + subida, elevación al pasar el mouse y "hundido" al tocar.
// Pasado el item 20 no hay entrada animada, para no cargar listas grandes.
export const cardMotion = (i = 0) => (i > 20 ? {
  whileHover: { y: -3, transition: SPRING_SOFT },
  whileTap: { scale: 0.98, transition: SPRING },
} : {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT, delay: itemDelay(i) } },
  whileHover: { y: -3, transition: SPRING_SOFT },
  whileTap: { scale: 0.98, transition: SPRING },
});

// Resorte para la transición "miniatura → visor"
export const HERO_SPRING = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 };
