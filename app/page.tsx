'use client'

import { FaGithub, FaLinkedin, FaChevronDown } from 'react-icons/fa'
import { SiX } from 'react-icons/si'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Transition } from '@headlessui/react'
import { Water } from '../components/water'

const socials = [
  { href: 'https://www.linkedin.com/in/sebasrusso/', label: 'LinkedIn', Icon: FaLinkedin },
  { href: 'https://x.com/sebbrusso', label: 'X', Icon: SiX },
  { href: 'https://github.com/sebrusso', label: 'GitHub', Icon: FaGithub },
]

const linkClass = 'font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80'

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Water />
      {/* The root layout already supplies the centered max-w-2xl column and its
          horizontal padding; pages must not nest a second one. */}
      <div className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            {/* Profile Picture */}
            <div className="relative w-[240px] h-[240px] md:w-[267px] md:h-[267px] flex-shrink-0 mx-auto md:mx-0">
              <Image
                src="/images/seb-polaroid.webp"
                alt="Sebastian Russo"
                fill
                sizes="(min-width: 768px) 267px, 240px"
                className="object-cover rounded-sm"
                priority
              />
            </div>

            {/* Photo caption disclosure and social links. Matched to the photo's
                width so the row doesn't outrun it on mobile. */}
            <div className="w-[240px] md:w-[267px]">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-expanded={isOpen}
                  aria-label="About this photo"
                  title="About this photo"
                  className="flex items-center text-muted-foreground transition-colors hover:text-primary"
                >
                  <FaChevronDown
                    aria-hidden="true"
                    className={`h-3 w-3 transform transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div className="flex gap-3 md:gap-4">
                  {socials.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              <Transition
                show={isOpen}
                enter="transition-all duration-200 ease-out"
                enterFrom="opacity-0 max-h-0"
                enterTo="opacity-100 max-h-24"
                leave="transition-all duration-200 ease-in"
                leaveFrom="opacity-100 max-h-24"
                leaveTo="opacity-0 max-h-0"
              >
                <div className="overflow-hidden">
                  <div className="mt-2 text-sm text-muted-foreground bg-muted/50 border-l-2 border-brand p-3 rounded-md">
                    this pic was taken for the regulars wall at Verve on University :0
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-col justify-start">
            <h1 className="text-title tracking-tight mb-6">Sebastian Russo</h1>

            <p className="text-base leading-relaxed mb-4">
              I&apos;m Seb, a research PM at Google DeepMind.
            </p>

            <ul className="mb-6 flex flex-col gap-3 text-base leading-relaxed">
              <li className="border-l-2 border-brand pl-4">
                <span className="font-medium">Code post-training for Gemini</span> — eval design:
                consumer webdev and 1P SWE tasks, RL/SFT code-data procurement, and LM judges (e.g.
                tool use, instruction following) for offline &amp; online analysis.
              </li>
              <li className="border-l-2 border-brand pl-4">
                <span className="font-medium">Gemini Embeddings</span> — recently, lead PM
                (modeling, GTM) for an upcoming Gemma-family open embedding model.
              </li>
            </ul>

            <p className="text-base leading-relaxed mb-6">
              I studied computer science at Stanford and graduated in 2025. I live in San Francisco,
              originally from San Marcos, Texas.
            </p>

            {/* No resume link on the site for now. public/resume.pdf is still
                deployed and reachable at /resume.pdf so it can be shared
                directly; it's just not advertised here. */}
            <p className="text-base leading-relaxed mb-6">
              I write <Link href="/writing" className={linkClass}>essays</Link>. Reachable on social
              or at{' '}
              <a href="mailto:sebrusso@cs.stanford.edu" className={linkClass}>
                sebrusso@cs.stanford.edu
              </a>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
