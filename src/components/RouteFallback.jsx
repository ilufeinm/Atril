// Spinner minimalista que se muestra mientras carga una ruta diferida.
// Sin dependencias pesadas para no penalizar el paquete principal.
export default function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" />
    </div>
  );
}