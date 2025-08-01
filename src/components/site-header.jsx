"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react"; // or use any icon you prefer

export function SiteHeader() {
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter(Boolean); // removes empty strings from leading slash

  const crumbs = segments.map((segment, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const name = segment
      .replace(/-/g, " ") // handle kebab-case like 'user-profile'
      .replace(/\b\w/g, (l) => l.toUpperCase()); // capitalize

    return { href, name };
  });

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        {/* ✅ Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground font-medium">
            Dashboard
          </Link>
          {crumbs.slice(1).map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <ChevronRight className="size-4" />
              <Link
                href={crumb.href}
                className="hover:text-foreground capitalize"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2"></div>
      </div>
    </header>
  );
}
