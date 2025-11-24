import { Sidebar, MobileSidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/10 md:flex">
        <Sidebar className="flex-1" />
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/10 px-6 md:hidden">
          <MobileSidebar />
          <span className="font-semibold">TweetBloom</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
