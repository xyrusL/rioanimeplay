import Link from "next/link";

export default function Custom404() {
  return (
    <main className="min-h-screen bg-[#131315] px-4 py-10 text-[#f3f1ee] sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-[760px] items-center justify-center">
        <div className="w-full rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(30,30,37,0.98)] px-6 py-10 text-center shadow-[0_28px_70px_rgba(0,0,0,0.38)]">
          <p className="text-[0.82rem] uppercase tracking-[0.24em] text-[#af90ff]">
            Not Found
          </p>
          <h1 className="mt-4 text-[2rem] font-semibold text-[#f3f1ee]">
            This page does not exist.
          </h1>
          <p className="mx-auto mt-3 max-w-[38rem] text-sm leading-7 text-[#c4bfd3]">
            The page you tried to open could not be found.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-semibold text-[#c4bfd3] transition-transform hover:-translate-y-0.5"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

