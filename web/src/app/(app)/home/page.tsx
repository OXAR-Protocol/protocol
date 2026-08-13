import { redirect } from "next/navigation";

/** Renamed to /portfolio — the page had become the portfolio, so the name should
 *  say so. Old links, bookmarks and anything still pointing at /home land right. */
export default function HomeRedirect() {
  redirect("/you");
}
