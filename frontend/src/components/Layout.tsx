import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransitionProvider } from './PageTransition'

export function Layout() {
  return (
    <PageTransitionProvider>
      <div className="flex min-h-dvh flex-col text-page-ink">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </PageTransitionProvider>
  )
}
