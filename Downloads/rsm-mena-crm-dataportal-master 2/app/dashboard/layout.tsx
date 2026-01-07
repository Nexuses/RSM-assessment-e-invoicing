import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Fixed Sidebar for desktop */}
      <div className="hidden md:block">
        <div className="fixed top-0 left-0 h-screen w-64 z-30">
          <Sidebar />
        </div>
      </div>
      {/* Mobile Sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
      {/* Main Content with left margin for sidebar */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-hidden w-full relative z-10">
        <div className="max-w-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

