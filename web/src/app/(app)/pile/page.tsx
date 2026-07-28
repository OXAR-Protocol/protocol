import { redirect } from "next/navigation";

/** The portfolio moved onto /home. Home and this page were the same object twice —
 *  both led with the total and both listed the positions — so home became the real
 *  one. Old links and bookmarks still land in the right place. */
export default function PileRedirect() {
  redirect("/portfolio");
}
