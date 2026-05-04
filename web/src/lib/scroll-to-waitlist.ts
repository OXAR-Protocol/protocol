export function scrollToWaitlist() {
  if (typeof window === "undefined") return;
  const el = document.getElementById("waitlist");
  if (!el) {
    window.location.hash = "#waitlist";
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
