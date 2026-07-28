import { redirect } from "next/navigation";

/** The page was renamed to /market — "yield" described a third of what's on it
 *  (savings sources, but also stocks and gold). Old links and bookmarks still work. */
export default function YieldRedirect() {
  redirect("/market");
}
