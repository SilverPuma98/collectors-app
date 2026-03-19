export default function Footer() {
  return (
    // mt-auto empuja el footer siempre hasta el final de la pantalla
    <footer className="w-full bg-slate-900 border-t border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Collectors. El archivo definitivo.
        </p>
      </div>
    </footer>
  );
}