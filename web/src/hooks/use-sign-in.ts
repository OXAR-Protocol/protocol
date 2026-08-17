"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

import { useAccessUnlocked } from "@/components/access-gate/access-wall";
import { useSignInGate } from "@/components/terms/sign-in-gate";

/**
 * How a shop-window visitor gets in, from wherever they decided to.
 *
 * If this browser has cleared the closed-alpha wall, that's the ordinary Privy
 * login. If it hasn't, opening Privy would sign them in and then strand them at
 * the wall a screen later — so they go to the wall first, which is also where the
 * waitlist lives.
 *
 * Either way the terms come first: `SignInGateProvider` holds the action back
 * until this browser has agreed to the current version. Nothing is created
 * before that — see the note there on why the old order was the wrong way round.
 */
export function useSignIn(): () => void {
  const router = useRouter();
  const { login } = usePrivy();
  const unlocked = useAccessUnlocked();
  const guard = useSignInGate();

  return () => guard(() => (unlocked ? login() : router.push("/login")));
}
