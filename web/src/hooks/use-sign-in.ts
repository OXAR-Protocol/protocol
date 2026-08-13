"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { useAccessUnlocked } from "@/components/access-gate/access-wall";

/**
 * How a shop-window visitor gets in, from wherever they decided to.
 *
 * If this browser has cleared the closed-alpha wall, that's the ordinary Privy
 * login. If it hasn't, opening Privy would sign them in and then strand them at
 * the wall a screen later — so they go to the wall first, which is also where the
 * waitlist lives.
 */
export function useSignIn(): () => void {
  const router = useRouter();
  const { login } = usePrivy();
  const unlocked = useAccessUnlocked();

  return () => (unlocked ? login() : router.push("/login"));
}
