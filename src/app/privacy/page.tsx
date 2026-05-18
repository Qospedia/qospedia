export const metadata = { title: 'Privacy Policy - Qospedia' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-[32px] font-semibold text-[#050505] mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-[14px] text-[#636363]">Last updated: May 2026</p>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">1. Introduction</h2>
          <p className="text-[14px] text-[#636363]">We take your privacy seriously. This policy explains how we collect, use, and protect your information.</p>
        </section>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2 text-[14px] text-[#636363]">
            <li>Account information (name, email)</li>
            <li>Content you create</li>
            <li>Authentication data from Google OAuth</li>
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">3. Contact</h2>
          <p className="text-[14px] text-[#636363]">Questions? Email: <strong className="text-[#050505]">qospedia.com@gmail.com</strong></p>
        </section>
      </div>
    </div>
  );
}