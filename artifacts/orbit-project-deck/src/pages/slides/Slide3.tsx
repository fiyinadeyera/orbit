export default function Slide3() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text orbit-paper">
      <div className="absolute left-[7vw] top-[10vh] text-[1.2vw] font-semibold uppercase tracking-[0.28em] text-primary">03</div>
      <div className="absolute left-[7vw] top-[19vh] w-[52vw]">
        <h2 className="font-display text-[4.35vw] font-bold leading-[1.02] tracking-[-0.055em]">A memory layer for your network</h2>
      </div>
      <div className="absolute right-[8vw] top-[12vh] h-[26vw] w-[26vw] rounded-full bg-[#d8e0d6]" />
      <div className="absolute right-[18vw] top-[19vh] h-[12vw] w-[12vw] orbit-ring" />
      <div className="absolute right-[23.3vw] top-[24.2vh] h-[1.6vw] w-[1.6vw] rounded-full bg-primary" />
      <div className="absolute right-[13vw] top-[21vh] h-[1.2vw] w-[1.2vw] rounded-full bg-accent" />
      <div className="absolute right-[29vw] top-[30vh] h-[1vw] w-[1vw] rounded-full bg-primary" />
      <div className="absolute right-[14vw] top-[34vh] h-[1vw] w-[1vw] rounded-full bg-accent" />
      <div className="absolute right-[23.7vw] top-[25vh] w-[10vw] rotate-[19deg] orbit-line" />
      <div className="absolute right-[24vw] top-[26vh] w-[8vw] rotate-[-32deg] orbit-line" />
      <div className="absolute right-[24vw] top-[26vh] w-[9vw] rotate-[61deg] orbit-line" />
      <div className="absolute left-[7vw] top-[43vh] grid w-[86vw] grid-cols-2 gap-x-[4vw] gap-y-[4.5vh]">
        <div className="flex gap-[1.5vw] border-t-[0.12vw] border-primary/25 pt-[2.3vh]">
          <div className="flex h-[3.2vw] w-[3.2vw] shrink-0 items-center justify-center rounded-full bg-primary font-display text-[1.35vw] font-bold text-[#f4f1e9]">01</div>
          <p className="m-0 max-w-[32vw] font-body text-[1.8vw] leading-[1.25]">Capture a natural-language note in seconds</p>
        </div>
        <div className="flex gap-[1.5vw] border-t-[0.12vw] border-primary/25 pt-[2.3vh]">
          <div className="flex h-[3.2vw] w-[3.2vw] shrink-0 items-center justify-center rounded-full bg-accent font-display text-[1.35vw] font-bold text-[#f4f1e9]">02</div>
          <p className="m-0 max-w-[32vw] font-body text-[1.8vw] leading-[1.25]">Claude extracts names, roles, companies, places, interests, and goals</p>
        </div>
        <div className="flex gap-[1.5vw] border-t-[0.12vw] border-primary/25 pt-[2.3vh]">
          <div className="flex h-[3.2vw] w-[3.2vw] shrink-0 items-center justify-center rounded-full bg-primary font-display text-[1.35vw] font-bold text-[#f4f1e9]">03</div>
          <p className="m-0 max-w-[32vw] font-body text-[1.8vw] leading-[1.25]">People, tags, interactions, and connections stay organized</p>
        </div>
        <div className="flex gap-[1.5vw] border-t-[0.12vw] border-primary/25 pt-[2.3vh]">
          <div className="flex h-[3.2vw] w-[3.2vw] shrink-0 items-center justify-center rounded-full bg-accent font-display text-[1.35vw] font-bold text-[#f4f1e9]">04</div>
          <p className="m-0 max-w-[32vw] font-body text-[1.8vw] leading-[1.25]">A visual graph makes the network easy to explore</p>
        </div>
      </div>
    </div>
  );
}
