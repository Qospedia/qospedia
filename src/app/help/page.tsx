import Link from 'next/link';
export const metadata = { title: 'Help - Qospedia' };

export default function HelpPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-[32px] font-semibold text-[#050505] mb-8 tracking-tight">Help Center</h1>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="bg-[#FCFCFC] border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="text-[14px] font-semibold text-[#050505] mb-2">How do I create an account?</h3>
              <p className="text-[14px] text-[#636363]">Click "Sign Up" and sign up with email or Google.</p>
            </div>
            <div className="bg-[#FCFCFC] border border-[#E5E7EB] rounded-lg p-4">
              <h3 className="text-[14px] font-semibold text-[#050505] mb-2">How do I become an editor?</h3>
              <p className="text-[14px] text-[#636363]">Contact us to request editor access.</p>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <p className="text-[14px] text-[#636363]">Can't find what you need? <Link href="/contact" className="text-[#2563EB] hover:underline">Contact Support</Link></p>
        </section>
      </div>
    </div>
  );
}