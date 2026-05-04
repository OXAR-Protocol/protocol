interface ButtonProps {
  variant: "filled" | "ghost";
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export function Button({ variant, children, href, onClick }: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 px-6 py-3 rounded font-mono text-sm uppercase tracking-wide transition-all duration-200";
  const styles = {
    filled: "bg-white text-surface-0 hover:bg-white/90",
    ghost:
      "border border-white/20 text-white hover:border-white/40 bg-transparent",
  };

  const className = `${base} ${styles[variant]}`;

  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
