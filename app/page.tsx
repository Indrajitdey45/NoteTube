export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { FeatureCard } from '@/components/feature-card'
import { NoteCard } from '@/components/note-card'
import { Tabs } from '@/components/tabs'
import {
  BookOpen,
  Zap,
  MessageSquare,
  FileText,
  HelpCircle,
  Layers2,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Structured Notes',
      description: 'Turn long videos into organized notes with headings, explanations, examples, and key points.',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Quick Revision',
      description: 'Generate concise revision material for last-minute studying.',
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: 'Questions',
      description: 'Generate important conceptual, interview, and exam questions.',
    },
    {
      icon: <Layers2 className="w-5 h-5" />,
      title: 'Flashcards',
      description: 'Turn important concepts into active-recall flashcards.',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'AI Chat',
      description: 'Ask questions about the video and get answers grounded in its content.',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Timestamp References',
      description: 'Connect explanations to timestamps from the original video.',
    },
  ]

  const outputTabs = [
    {
      id: 'notes',
      label: 'Notes',
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Operating Systems — Memory Management</h4>
            <p className="mb-3">Comprehensive guide to memory management in operating systems, including paging, segmentation, and virtual memory.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Key Topics</p>
            <ul className="space-y-1">
              <li>• What is Memory Management?</li>
              <li>• Paging and Page Tables</li>
              <li>• Translation Lookaside Buffer (TLB)</li>
              <li>• Virtual Memory</li>
              <li>• Page Replacement Algorithms</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'summary',
      label: 'Summary',
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Memory management is a critical component of modern operating systems that handles allocation, protection, and optimization of system memory.</p>
          <p><strong className="text-foreground">Core concepts:</strong> Paging, segmentation, virtual memory, and page replacement strategies.</p>
          <p><strong className="text-foreground">Key takeaway:</strong> Virtual memory allows programs to use more memory than physically available through disk swapping and translation mechanisms.</p>
        </div>
      ),
    },
    {
      id: 'questions',
      label: 'Questions',
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">1. What is the primary purpose of a Translation Lookaside Buffer?</p>
            <p className="mt-1 text-xs">Caches frequently used page-table entries for faster address translation.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">2. Explain the difference between paging and segmentation.</p>
            <p className="mt-1 text-xs">Paging divides memory into fixed-size pages; segmentation uses variable-size logical segments.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">3. How does virtual memory extend physical memory?</p>
            <p className="mt-1 text-xs">Uses disk storage to simulate more memory than physically available.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      content: (
        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="font-semibold text-foreground">Paging</p>
            <p className="text-xs text-muted-foreground mt-2">Fixed-size blocks of memory divided for allocation and protection</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="font-semibold text-foreground">TLB</p>
            <p className="text-xs text-muted-foreground mt-2">Translation Lookaside Buffer - cache for virtual-to-physical address mappings</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="font-semibold text-foreground">Virtual Memory</p>
            <p className="text-xs text-muted-foreground mt-2">Technique allowing programs to use more memory than physically available</p>
          </div>
        </div>
      ),
    },
    {
      id: 'quiz',
      label: 'Quiz',
      content: (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-3">1. What is paging?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer">
                <input type="radio" name="q1" className="w-4 h-4" />
                <span>Process of dividing memory into variable-size blocks</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer">
                <input type="radio" name="q1" className="w-4 h-4" />
                <span className="text-accent font-semibold">Dividing memory into fixed-size blocks</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer">
                <input type="radio" name="q1" className="w-4 h-4" />
                <span>Loading entire programs into memory</span>
              </label>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <>
      <Navbar />
      <main className="bg-background">
        {/* Hero Section */}
        <section className="relative border-b border-border bg-gradient-to-br from-background via-background to-secondary/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
              <div className="flex-1 min-w-0">
                <div className="inline-block mb-4">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Learn from any video
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Turn YouTube videos into notes you actually understand.
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  Paste a YouTube link and let AI transform the video into structured notes, key concepts, questions, flashcards, and revision material.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Link href="/create">
                    <Button size="lg" className="bg-accent hover:bg-accent/90">
                      Generate Notes
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline">
                      See how it works
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground">
                  Works with videos that have accessible transcripts or captions.
                </p>
              </div>

              <div className="flex-1 hidden lg:block">
                <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="aspect-video rounded bg-secondary/50 flex items-center justify-center text-muted-foreground">
                      <span className="text-sm">Video Preview</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-secondary border border-border">
                        <p className="text-xs text-muted-foreground">12 Sections</p>
                        <p className="font-semibold text-foreground">Chapters</p>
                      </div>
                      <div className="p-3 rounded bg-secondary border border-border">
                        <p className="text-xs text-muted-foreground">34 Concepts</p>
                        <p className="font-semibold text-foreground">Key Points</p>
                      </div>
                      <div className="p-3 rounded bg-secondary border border-border">
                        <p className="text-xs text-muted-foreground">20 Questions</p>
                        <p className="font-semibold text-foreground">Tests</p>
                      </div>
                      <div className="p-3 rounded bg-secondary border border-border">
                        <p className="text-xs text-muted-foreground">24 Flashcards</p>
                        <p className="font-semibold text-foreground">Recalls</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-b border-border py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                From video to study material.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to learn effectively from any educational video.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <FeatureCard key={i} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-b border-border py-20 sm:py-28 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                How it works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Paste',
                  description: 'Paste a YouTube URL to get started.',
                  icon: <FileText className="w-6 h-6" />,
                },
                {
                  step: '02',
                  title: 'Understand',
                  description: 'AI processes the available transcript and identifies important concepts.',
                  icon: <Zap className="w-6 h-6" />,
                },
                {
                  step: '03',
                  title: 'Learn',
                  description: 'Get structured notes, questions, flashcards, and an AI tutor.',
                  icon: <CheckCircle2 className="w-6 h-6" />,
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
                    {item.icon}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.step}</p>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Output Preview */}
        <section id="examples" className="border-b border-border py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                See what you get
              </h2>
              <p className="text-lg text-muted-foreground">
                AI generates multiple formats to match your learning style.
              </p>
            </div>

            <div className="border border-border rounded-lg bg-card p-8">
              <Tabs tabs={outputTabs} defaultTab="notes" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Ready to learn smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Transform your next educational video into comprehensive study material in seconds.
            </p>
            <Link href="/create">
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                Create Your First Notes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-secondary/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xs">NT</span>
                </div>
                <span className="font-semibold text-foreground">NoteTube AI</span>
              </div>
              <p className="text-sm text-muted-foreground text-center sm:text-right">
                Turn videos into knowledge
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
