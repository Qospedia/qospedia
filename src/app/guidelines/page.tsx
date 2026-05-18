export const metadata = { title: 'Guidelines - Qospedia' };

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-[32px] font-semibold text-[#050505] mb-8 tracking-tight">Community Guidelines</h1>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Content Standards</h2>
          <ul className="list-disc list-inside space-y-2 text-[14px] text-[#636363]">
            <li><strong className="text-[#050505]">Accuracy:</strong> All content should be factually correct</li>
            <li><strong className="text-[#050505]">Neutrality:</strong> Maintain a neutral, encyclopedic tone</li>
            <li><strong className="text-[#050505]">Citations:</strong> Include reliable sources</li>
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">AI-Assisted Content</h2>
          <p className="text-[14px] text-[#636363]">All AI-generated content must be reviewed and approved by human editors before publication.</p>
        </section>
      </div>
    </div>
  );
}