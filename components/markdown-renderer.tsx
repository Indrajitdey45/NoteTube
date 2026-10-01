'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Check, Copy, Code2 } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'Plain text'

  // Extract raw string content
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format language title
  const displayLang =
    language.toLowerCase() === 'plain text' || language === ''
      ? 'Plain text'
      : language.charAt(0).toUpperCase() + language.slice(1)

  return (
    <div className="group relative my-5 overflow-hidden rounded-2xl border border-neutral-800 bg-[#121214] shadow-xl">
      {/* Code Block Header (matches screenshot style) */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 bg-[#1a1a1e] px-4 py-2.5 text-xs text-neutral-400">
        <div className="flex items-center gap-2 font-mono font-medium text-neutral-300">
          <Code2 className="size-4 text-neutral-400" />
          <span>{displayLang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Content */}
      <div className="overflow-x-auto p-4 sm:p-5 font-mono text-[13px] sm:text-sm leading-relaxed text-neutral-200 selection:bg-neutral-700 selection:text-white">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="study-notes-markdown text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 mb-4 border-b border-border pb-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-lg sm:text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-base font-semibold text-foreground">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-3 text-sm sm:text-base leading-7 text-foreground/90">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          hr: () => (
            <hr className="my-8 border-t border-border" />
          ),
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 list-disc list-outside pl-5 text-sm sm:text-base text-foreground/90 leading-relaxed">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1.5 list-decimal list-outside pl-5 text-sm sm:text-base text-foreground/90 leading-relaxed">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:text-muted-foreground">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-xl border-l-4 border-accent bg-secondary/50 px-4 py-3 text-foreground italic">
              {children}
            </blockquote>
          ),
          // Tables (GFM)
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[500px] text-left text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border bg-secondary text-xs font-semibold uppercase tracking-wider text-foreground">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/60">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-secondary/40 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3.5 text-foreground/90 align-top leading-relaxed">{children}</td>
          ),
          // Code elements (inline vs block)
          code: ({ node, className, children, ...props }: any) => {
            const isBlock = className || String(children).includes('\n')

            if (!isBlock) {
              return (
                <code
                  className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.88em] font-medium text-foreground border border-border"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return <CodeBlock className={className}>{children}</CodeBlock>
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline underline-offset-4 transition-colors font-medium"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
