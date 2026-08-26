export default function Slide4() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text orbit-paper">
      <div className="absolute left-[7vw] top-[10vh] text-[1.2vw] font-semibold uppercase tracking-[0.28em] text-primary">04</div>
      <div className="absolute left-[7vw] top-[20vh] w-[37vw]">
        <h2 className="font-display text-[4.5vw] font-bold leading-[1.02] tracking-[-0.055em]">From one note to the next conversation</h2>
      </div>
      <div className="absolute left-[8vw] top-[62vh] h-[0.12vw] w-[33vw] bg-primary/35" />
      <div className="absolute left-[8vw] top-[57.5vh] h-[1vw] w-[1vw] rounded-full bg-accent" />
      <div className="absolute left-[18vw] top-[57.5vh] h-[1vw] w-[1vw] rounded-full bg-primary" />
      <div className="absolute left-[28vw] top-[57.5vh] h-[1vw] w-[1vw] rounded-full bg-accent" />
      <div className="absolute left-[38vw] top-[57.5vh] h-[1vw] w-[1vw] rounded-full bg-primary" />
      <div className="absolute right-[7vw] top-[14vh] w-[43vw]">
        <div className="flex items-start gap-[1.6vw] border-t-[0.12vw] border-primary/25 py-[2.75vh]">
          <span className="font-display text-[2.1vw] font-bold text-accent">01</span>
          <p className="m-0 font-body text-[1.8vw] leading-[1.2]">Write or paste what happened</p>
        </div>
        <div className="flex items-start gap-[1.6vw] border-t-[0.12vw] border-primary/25 py-[2.75vh]">
          <span className="font-display text-[2.1vw] font-bold text-accent">02</span>
          <p className="m-0 font-body text-[1.8vw] leading-[1.2]">Orbit creates or updates the person record</p>
        </div>
        <div className="flex items-start gap-[1.6vw] border-t-[0.12vw] border-primary/25 py-[2.75vh]">
          <span className="font-display text-[2.1vw] font-bold text-accent">03</span>
          <p className="m-0 font-body text-[1.8vw] leading-[1.2]">Context and interaction history stay attached to the relationship</p>
        </div>
        <div className="flex items-start gap-[1.6vw] border-t-[0.12vw] border-primary/25 py-[2.75vh]">
          <span className="font-display text-[2.1vw] font-bold text-accent">04</span>
          <p className="m-0 font-body text-[1.8vw] leading-[1.2]">Reconnect prompts surface people who have been quiet for 30+ days</p>
        </div>
        <div className="flex items-start gap-[1.6vw] border-y-[0.12vw] border-primary/25 py-[2.75vh]">
          <span className="font-display text-[2.1vw] font-bold text-accent">05</span>
          <p className="m-0 font-body text-[1.8vw] font-semibold leading-[1.2] text-primary">Search works across names, companies, tags, and notes</p>
        </div>
      </div>
    </div>
  );
}
