export default function Slide2() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text orbit-paper">
      <div className="absolute -right-[9vw] -top-[18vh] h-[55vw] w-[55vw] orbit-ring" />
      <div className="absolute -right-[4vw] -top-[12vh] h-[43vw] w-[43vw] orbit-ring" />
      <div className="absolute right-[12vw] top-[25vh] h-[1.2vw] w-[1.2vw] rounded-full bg-accent" />
      <div className="absolute left-[7vw] top-[10vh] text-[1.5vw] font-semibold uppercase tracking-[0.28em] text-primary">02</div>
      <div className="absolute left-[7vw] top-[22vh] w-[39vw]">
        <h2 className="font-display text-[4.55vw] font-bold leading-[1.02] tracking-[-0.055em]">Weak ties are easy to lose</h2>
        <p className="mt-[4vh] max-w-[32vw] font-body text-[2vw] leading-[1.35] text-muted">The people we meet once or twice quickly lose their context.</p>
      </div>
      <div className="absolute right-[7vw] top-[17vh] w-[43vw]">
        <div className="flex items-start gap-[1.7vw] border-t-[0.12vw] border-primary/25 py-[3.2vh]">
          <span className="font-display text-[2.2vw] font-bold text-accent">01</span>
          <p className="m-0 font-body text-[2vw] leading-[1.2]">Strong relationships maintain themselves</p>
        </div>
        <div className="flex items-start gap-[1.7vw] border-t-[0.12vw] border-primary/25 py-[3.2vh]">
          <span className="font-display text-[2.2vw] font-bold text-accent">02</span>
          <p className="m-0 font-body text-[2vw] leading-[1.2]">The people we meet once or twice quickly lose their context</p>
        </div>
        <div className="flex items-start gap-[1.7vw] border-t-[0.12vw] border-primary/25 py-[3.2vh]">
          <span className="font-display text-[2.2vw] font-bold text-accent">03</span>
          <p className="m-0 font-body text-[2vw] leading-[1.2]">Notes become scattered, stale, and hard to act on</p>
        </div>
        <div className="flex items-start gap-[1.7vw] border-y-[0.12vw] border-primary/25 py-[3.2vh]">
          <span className="font-display text-[2.2vw] font-bold text-accent">04</span>
          <p className="m-0 font-body text-[2vw] font-semibold leading-[1.2] text-primary">Orbit turns relationship memory into something retrievable</p>
        </div>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] h-[0.45vw] w-[12vw] bg-accent" />
    </div>
  );
}
