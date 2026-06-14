"use client";

import { useCallback, useEffect, useState } from "react";

import { HeroGate } from "./hero";
import { Nav } from "./nav";
import { Problem } from "./problem";
import { HowItWorks } from "./how-it-works";
import { Speeds } from "./speeds";
import { Roadmap } from "./roadmap";
import { Footer } from "./footer";

type Gate = "open" | "closing" | "closed";

/**
 * Orchestrates the one-time entry gate. While the gate is up the page is
 * scroll-locked and the hero overlay covers everything; picking a choice fades
 * the gate out and reveals the content with "the problem" at the very top.
 */
export function LandingShell() {
  const [gate, setGate] = useState<Gate>("open");

  useEffect(() => {
    const locked = gate !== "closed";
    const v = locked ? "hidden" : "";
    document.documentElement.style.overflow = v;
    document.body.style.overflow = v;
    if (locked) window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [gate]);

  const enter = useCallback((target: "problem" | "waitlist") => {
    setGate("closing");
    window.setTimeout(() => {
      setGate("closed");
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        if (target === "waitlist") {
          document
            .getElementById("waitlist")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      });
    }, 500);
  }, []);

  return (
    <>
      {gate !== "closed" && (
        <HeroGate onEnter={enter} closing={gate === "closing"} />
      )}
      <Nav />
      <Problem />
      <HowItWorks />
      <Speeds />
      <Roadmap />
      <Footer />
    </>
  );
}
