import Link from 'next/link';
export const metadata = { title: 'Community - Qospedia' };

export default function CommunityPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-[32px] font-semibold text-[#050505] mb-8 tracking-tight">Community</h1>
        <p className="text-[16px] text-[#636363] mb-8">Welcome to the Qospedia community!</p>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Ways to Contribute</h2>
          <ul className="list-disc list-inside space-y-2 text-[14px] text-[#636363]">
            <li>Write Articles</li>
            <li>Edit & Improve</li>
            <li>AI Collaboration</li>
            <li>Feedback</li>
          </ul>
        </section>
        <section className="mt-8">
          <p className="text-[14px] text-[#636363]">See our <Link href="/guidelines" className="text-[#2563EB] hover:underline">Guidelines</Link> and <Link href="/help" className="text-[#2563EB] hover:underline">Help Center</Link></p>
        </section>
      </div>
    </div>
  );
}