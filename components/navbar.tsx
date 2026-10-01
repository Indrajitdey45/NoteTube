'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useState, useEffect } from 'react'
import { UserButton, useAuth } from '@clerk/nextjs'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isSignedIn } = useAuth()

  // Only render auth-dependent UI after client mount to avoid SSR/prerender issues
  useEffect(() => { setMounted(true) }, [])

  const isLanding = pathname === '/'
  const isDashboard = pathname === '/dashboard'

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!isLanding && !isDashboard) return null

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">NT</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-semibold text-foreground text-sm">NoteTube</span>
                <span className="text-xs text-muted-foreground">AI</span>
              </div>
            </Link>

            {isLanding && (
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
                <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Examples</a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-input bg-background hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth — only rendered after client mount */}
            {mounted && (
              <>
                {isSignedIn ? (
                  <>
                    <Link href="/create">
                      <Button size="sm" className="bg-accent hover:bg-accent/90 hidden sm:inline-flex">
                        + Create Notes
                      </Button>
                    </Link>
                    <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
                  </>
                ) : isLanding ? (
                  <>
                    <div className="hidden sm:flex gap-3">
                      <SignInButton mode="redirect">
                        <Button variant="outline" size="sm">Sign in</Button>
                      </SignInButton>
                      <SignUpButton mode="redirect">
                        <Button size="sm" className="bg-accent hover:bg-accent/90">Get started</Button>
                      </SignUpButton>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-input"
                    >
                      {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                  </>
                ) : (
                  <SignInButton mode="redirect">
                    <Button size="sm" className="bg-accent hover:bg-accent/90">Sign in</Button>
                  </SignInButton>
                )}
              </>
            )}
          </div>
        </div>

        {isLanding && mobileMenuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground py-2">Features</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground py-2">How it works</a>
            <a href="#examples" className="block text-sm text-muted-foreground hover:text-foreground py-2">Examples</a>
            <div className="flex gap-3 mt-2">
              {mounted && !isSignedIn && (
                <>
                  <SignInButton mode="redirect">
                    <Button variant="outline" size="sm" className="flex-1">Sign in</Button>
                  </SignInButton>
                  <SignUpButton mode="redirect">
                    <Button size="sm" className="flex-1 bg-accent hover:bg-accent/90">Get started</Button>
                  </SignUpButton>
                </>
              )}
              {mounted && isSignedIn && (
                <Link href="/create" className="flex-1">
                  <Button size="sm" className="w-full bg-accent hover:bg-accent/90">Create Notes</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
