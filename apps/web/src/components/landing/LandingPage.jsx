import Navbar from "./Navbar";
import Hero from "./Hero";
import StoryScroll from "./StoryScroll";
import Features from "./Features";
import Workflow from "./Workflow";
import { Cta, Footer } from "./CtaFooter";

export default function LandingPage({ onOpenAuth }) {
  return (
    <>
      <Navbar onOpenAuth={onOpenAuth} />
      <main id="main" className="relative z-[2]">
        <Hero onOpenAuth={onOpenAuth} />
        <StoryScroll />
        <Features />
        <Workflow onOpenAuth={onOpenAuth} />
        <Cta onOpenAuth={onOpenAuth} />
      </main>
      <Footer onOpenAuth={onOpenAuth} />
    </>
  );
}

