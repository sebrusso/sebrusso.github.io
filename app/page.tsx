'use client'

import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { SiX } from 'react-icons/si'
import { FaChevronDown } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Transition } from '@headlessui/react'

export default function AboutPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="container mx-auto max-w-2xl pt-6 pb-6">
      <div className="flex flex-col md:flex-row gap-8 px-4 md:px-0">
        <div className="flex flex-col gap-4">
          {/* Profile Picture */}
          <div className="relative w-[200px] h-[200px] md:w-[267px] md:h-[267px] flex-shrink-0 mx-auto md:mx-0">
            <Image
              src="/images/seb-polaroid.jpeg"
              alt="Sebastian Russo"
              fill
              className="object-cover rounded-sm"
              priority
            />
          </div>

          {/* Image Info Dropdown and Social Media Icons */}
          <div className="w-full">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <FaChevronDown
                  className={`h-3 w-3 transform transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
                <span></span>
              </button>

              {/* Social Media Icons */}
              <div className="flex gap-4">
                <Link href="https://www.linkedin.com/in/sebasrusso/" className="text-muted-foreground hover:text-foreground">
                  <FaLinkedin className="h-5 w-5" />
                </Link>
                <Link href="https://x.com/sebbrusso" className="text-muted-foreground hover:text-foreground">
                  <SiX className="h-5 w-5" />
                </Link>
                <Link href="https://github.com/sebrusso" className="text-muted-foreground hover:text-foreground">
                  <FaGithub className="h-5 w-5" />
                </Link>
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
                <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  this pic was taken for the regulars wall at Verve on University :0
                </div>
              </div>
            </Transition>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-start text-center md:text-left">
          <h1 className="text-title tracking-tight mb-6">Sebastian Russo</h1>
          
          <p className="text-base leading-relaxed mb-6">
            My name is Seb and I&apos;m a senior at Stanford studying computer science. I'm originally from San Marcos, Texas.
          </p>

          <p className="text-base leading-relaxed mb-6">
            I like to write, so hopefully while you're here you feel like reading. You can get in contact via social media or email{' '}
            <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">
              (sebrusso at stanford dot edu)
            </span>. 
          </p>
        </div>
      </div>
    </div>
  )
}

