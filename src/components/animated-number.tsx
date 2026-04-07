"use client";

import { useEffect } from "react";
import { useSpring, useTransform, motion, SpringOptions } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  springOptions?: SpringOptions;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
  springOptions,
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1,
    ...springOptions,
  });

  const display = useTransform(spring, (current) =>
    `${prefix}${current.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
