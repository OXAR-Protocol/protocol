import Image from "next/image";

export function PitchHero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-20">
      <div className="relative w-[200px] h-[288px] sm:w-[260px] sm:h-[374px] lg:w-[320px] lg:h-[461px] mb-12">
        <Image
          src="/pitch/logo-x.svg"
          alt="OXAR"
          fill
          priority
          className="object-contain"
        />
      </div>
      <p className="font-light text-center text-white/70 text-base leading-relaxed max-w-md">
        OXAR tokenizes emerging market government bonds. We&apos;re starting in
        Ukraine — and we&apos;re going global.
      </p>
    </section>
  );
}
