export default function Slide5() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text orbit-paper">
      <div className="absolute -right-[12vw] -top-[15vh] h-[65vw] w-[65vw] rounded-full bg-primary" />
      <div className="absolute right-[8vw] top-[14vh] h-[47vw] w-[47vw] rounded-full border-[0.12vw] border-[#d8e0d6]/45" />
      <div className="absolute right-[16vw] top-[23vh] h-[31vw] w-[31vw] rounded-full border-[0.12vw] border-[#d8e0d6]/45" />
      <div className="absolute right-[30.7vw] top-[37.5vh] h-[2.5vw] w-[2.5vw] rounded-full bg-accent" />
      <div className="absolute right-[23vw] top-[28vh] h-[1.25vw] w-[1.25vw] rounded-full bg-[#d8e0d6]" />
      <div className="absolute right-[18vw] top-[48vh] h-[1.25vw] w-[1.25vw] rounded-full bg-[#d8e0d6]" />
      <div className="absolute right-[34vw] top-[54vh] h-[1.25vw] w-[1.25vw] rounded-full bg-[#d8e0d6]" />
      <div className="absolute right-[31.7vw] top-[38.5vh] w-[9vw] rotate-[-41deg] bg-[#d8e0d6]/55 orbit-line" />
      <div className="absolute right-[31.7vw] top-[38.5vh] w-[12vw] rotate-[32deg] bg-[#d8e0d6]/55 orbit-line" />
      <div className="absolute left-[7vw] top-[10vh] text-[1.2vw] font-semibold uppercase tracking-[0.28em] text-primary">05</div>
      <div className="absolute left-[7vw] top-[20vh] w-[44vw]">
        <h2 className="font-display text-[4.55vw] font-bold leading-[1.02] tracking-[-0.055em]">Start on iPhone. Grow into native.</h2>
        <div className="mt-[6vh] space-y-[2.3vh]">
          <p className="m-0 font-body text-[1.7vw] leading-[1.25]">The responsive web MVP works in Safari</p>
          <p className="m-0 font-body text-[1.7vw] leading-[1.25]">Add Orbit to the iPhone Home Screen for an app-like experience</p>
          <p className="m-0 font-body text-[1.7vw] leading-[1.25]">The shared API and data model create a path to a native Expo app</p>
          <p className="m-0 font-body text-[1.7vw] leading-[1.25]">The next milestone is App Store readiness: native client, Apple Developer setup, assets, privacy details, and review</p>
        </div>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] font-display text-[2.4vw] font-bold text-primary">Orbit</div>
    </div>
  );
}
