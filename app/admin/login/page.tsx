import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/AdminLoginForm";
import { ADMIN_SESSION_COOKIE_NAME, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);

  if (session) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Admin</p>
        <h1 className="text-4xl leading-tight text-white md:text-5xl">Beskyttet publiseringsflate for StemNorge</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Herfra kan admin opprette og planlegge saker. Tilgangen er nå låst bak en egen server-verifisert session.
        </p>
        <ul className="space-y-3 text-sm leading-7 text-slate-300">
          <li>• `/admin` krever gyldig admin-cookie</li>
          <li>• admin-API-et avviser kall uten session</li>
          <li>• innlogging aktiveres med `ADMIN_PASSWORD` i miljøet</li>
        </ul>
      </section>

      <AdminLoginForm isConfigured={isAdminConfigured()} />
    </div>
  );
}