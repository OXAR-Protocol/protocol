import Image from "next/image";

export function PitchCurrencies() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-12">
      <div className="text-center mb-10 sm:mb-14">
        <p className="font-bold text-base sm:text-lg text-[#f0f0f2] tracking-tight">
          LIVE · SOLANA
        </p>
        <p className="font-extralight italic text-base sm:text-lg text-[#f0f0f2] tracking-tight mt-1">
          6 BONDS · UP TO 18% APY
        </p>
      </div>

      <div className="flex items-end justify-center gap-4 sm:gap-8 lg:gap-12 flex-nowrap w-full">
        {/* USD — vertical, max-size */}
        <div className="relative w-[28vw] h-[64vw] sm:w-[26vw] sm:h-[60vw] lg:w-[24vw] lg:h-[55vw] max-w-[500px] max-h-[1100px]">
          <Image
            src="/pitch/currency-usd.png"
            alt="USD"
            fill
            className="object-contain rotate-90"
          />
        </div>

        {/* EUR — vertical, max-size */}
        <div className="relative w-[29vw] h-[64vw] sm:w-[27vw] sm:h-[60vw] lg:w-[25vw] lg:h-[55vw] max-w-[520px] max-h-[1100px]">
          <Image
            src="/pitch/currency-eur.png"
            alt="EUR"
            fill
            className="object-contain rotate-90"
          />
        </div>

        {/* UAH — vertical, max-size */}
        <div className="relative w-[29vw] h-[64vw] sm:w-[27vw] sm:h-[60vw] lg:w-[25vw] lg:h-[55vw] max-w-[520px] max-h-[1100px]">
          <Image
            src="/pitch/currency-uah.png"
            alt="UAH"
            fill
            className="object-contain rotate-90"
          />
        </div>
      </div>
    </section>
  );
}
