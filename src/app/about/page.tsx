export const metadata = { title: 'About - Qospedia' };

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-[32px] font-semibold text-[#050505] mb-8 tracking-tight">About Qospedia</h1>
        <p className="text-[16px] text-[#636363] mb-8">A modern, AI-powered knowledge platform designed to make learning accessible, engaging, and comprehensive.</p>
        
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Our Mission</h2>
          <p className="text-[14px] text-[#636363]">To create a collaborative platform where AI and human expertise come together to build the most comprehensive knowledge base possible.</p>
        </section>
        
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Founded By</h2>
          <div className="bg-[#FCFCFC] border border-[#E5E7EB] rounded-lg p-6">
            <p className="text-[16px] font-semibold text-[#050505]">Shaurya Agarwal</p>
            <p className="text-[14px] text-[#636363] mt-2">Founder & Visionary</p>
          </div>
        </section>
        
        <section className="mt-8">
          <h2 className="text-[20px] font-semibold text-[#050505] mb-4">Parent Company</h2>
          <div className="bg-[#FCFCFC] border border-[#E5E7EB] rounded-lg p-6">
            <p className="text-[16px] font-semibold text-[#050505]">HALONAI</p>
            <p className="text-[14px] text-[#636363] mt-2">A technology company pioneering AI-powered solutions for education.</p>
          </div>
        </section>
      </div>
    </div>
  );
}