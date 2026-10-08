// Mientras haya una hoja abierta, la página de atrás se achica un poco (como en iOS).
// El CSS reacciona al atributo `data-sheet` del <body>; la variable --sheet-oy fija el
// punto de escala en el centro de lo que se está viendo (la página scrollea en `window`).
let openCount = 0;
export function setSheetOpen(open) {
  if (typeof document === 'undefined') return;
  openCount = Math.max(0, openCount + (open ? 1 : -1));
  if (open && openCount === 1) {
    document.documentElement.style.setProperty('--sheet-oy', `${window.scrollY + window.innerHeight / 2}px`);
  }
  if (openCount > 0) document.body.setAttribute('data-sheet', '1');
  else document.body.removeAttribute('data-sheet');
}
