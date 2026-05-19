import { Breadcrumbs } from "./_components/breadcrumbs";
import { DocsSidebar } from "./_components/sidebar";
import { SearchModal } from "./_components/search-modal";
import { DocsTopTabs } from "./_components/top-tabs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16">
      <DocsTopTabs />
      <Breadcrumbs />
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex items-center justify-end py-4">
          <SearchModal />
        </div>
        <div className="grid grid-cols-1 gap-10 pb-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <DocsSidebar />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
