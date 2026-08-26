const base = import.meta.env.BASE_URL;

export default function Slide1() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text orbit-paper">
      <div className="absolute right-0 top-0 h-full w-[42vw] bg-primary" />
      <div className="absolute right-[3vw] top-[6vh] h-[88vh] w-[45vw] rounded-[3vw] bg-[#d8e0d6]" />
      <img src={base + 'orbit-network.png'} crossOrigin="anonymous" alt="Abstract constellation of connected relationship nodes" className="absolute right-[6vw] top-[10vh] h-[80vh] w-[39vw] rounded-[2.2vw] object-cover mix-blend-multiply" />
      <div className="absolute left-[7vw] top-[9vh] text-[1.3vw] font-semibold uppercase tracking-[0.28em] text-primary">Orbit</div>
      <div className="absolute left-[7vw] top-[25vh] w-[43vw]">
        <h1 className="font-display text-[7vw] font-bold leading-[0.98] tracking-[-0.065em] text-text">Orbit</h1>
        <p className="mt-[4vh] max-w-[36vw] font-body text-[2.2vw] leading-[1.28] text-muted">Remember people, context, and the right moment to reconnect.</p>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] flex items-center gap-[1vw] text-[1.25vw] font-semibold uppercase tracking-[0.22em] text-primary">
        <span className="h-[0.65vw] w-[0.65vw] rounded-full bg-accent" />
        <span>Personal relationship intelligence</span>
      </div>
      <div className="absolute bottom-[8vh] right-[7vw] text-[1.2vw] font-semibold text-[#edf1e7]">01</div>
    </div>
  );
}
