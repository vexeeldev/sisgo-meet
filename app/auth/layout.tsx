import { Navbar } from "@/components/navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 font-sans">{children}</main>
    </>
  );
}
