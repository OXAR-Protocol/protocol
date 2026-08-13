import { redirect } from "next/navigation";

/** The portfolio and the profile were the same object shown twice — the total, the
 *  positions, the history, in two levels of detail on two screens. /you is the one
 *  that stayed. Kept as a redirect: old links, the tab bar's history and anything
 *  bookmarked still land somewhere real. */
export default function PortfolioPage() {
  redirect("/you");
}
