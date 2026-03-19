import NavbarAdmin from "@/components/NavbarAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Todo lo que esté dentro de /admin usará esta estructura automáticamente
    <section className="flex flex-col min-h-screen bg-[#050810]">
      <NavbarAdmin />
      <div className="flex-grow">
        {children}
      </div>
    </section>
  );
}