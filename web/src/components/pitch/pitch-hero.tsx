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
      <h1 className="font-extralight italic text-center text-white text-[clamp(28px,3.2vw,48px)] leading-tight tracking-tight max-w-2xl mb-6">
        Where does your money sleep?
      </h1>
      <p className="font-light text-center text-white/70 text-base leading-relaxed max-w-md">
        Wake it up. Earn yield. Save together. No bank. No broker. No lock.
      </p>
    </section>
  );
}
