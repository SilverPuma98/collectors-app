export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* El Navbar inteligente global ya se dibuja desde app/layout.tsx */}
      {children}
    </section>
  );
}