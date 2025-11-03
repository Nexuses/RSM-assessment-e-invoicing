"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"

const slides = [
  {
    logo: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Screenshot%202025-10-31%20at%205.28.59%20PM.png",
    industry: "AEROSPACE",
    title:
      "Vision.eXpress gets real-time insights with SAP and CAD integration from FULCRUM,",
    image:
      "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Frame%2080.png",
  },
  {
    logo: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Screenshot%202025-10-31%20at%205.28.43%20PM.png",
    industry: "MANUFACTURING",
    title: "Launched Strata's UAE aerostructures plant—securing Tier-1 OEM partnerships through process KPI & SAP buildout.",
    image:
      "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Frame%2082%20(2).png",
  },
  {
    logo: "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Screenshot%202025-10-31%20at%205.28.15%20PM.png",
    industry: "CONGLOMERATE",
    title: "Alghanim achieves more flexibility and coverage with SAP integration.",
    image:
      "https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Frame%2081.png",
  },
]

export default function CaseStudyCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [lockedHeight, setLockedHeight] = useState<number | null>(null)
  const isMobile = useIsMobile()
  const [submitting, setSubmitting] = useState(false)
  const { toast } = require("@/components/ui/use-toast")
  const leftCardRef = useRef<HTMLDivElement | null>(null)

  // Reset form when slide changes
  useEffect(() => {
    setShowForm(false)
    setLockedHeight(null)
  }, [currentSlide])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const slide = slides[currentSlide]
  const isFirstSlide = currentSlide === 0
  const isSecondSlide = currentSlide === 1
  const caseStudyNames = [
    'Vision eXpress',
    'Strata',
    'Alghanim',
  ] as const
  const pdfUrls = [
    'https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Vision%20Express%20Technical%20Fuclrum%20Case%20Study%20(1).pdf',
    'https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Strata%20CS%20updated.pdf',
    'https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/EGuardian/Alghanim%20CS%20updated.pdf',
  ] as const

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 lg:px-20">
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 md:left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-white hover:bg-gray-100 shadow-lg"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-gray-800" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 md:right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-white hover:bg-gray-100 shadow-lg"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-gray-800" />
      </Button>

      <div className="relative bg-[#4a4a4a] overflow-hidden">
        {/* Slide Content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] md:items-stretch gap-0">
          {/* Left Side - Content */}
          <div 
            ref={leftCardRef}
            className={`bg-[#f5f5f5] p-6 sm:p-6 ${isFirstSlide ? 'md:p-8 lg:p-12' : isSecondSlide ? 'md:p-6 lg:p-8' : 'md:p-12 lg:p-16'} flex flex-col justify-center ${isFirstSlide && showForm ? 'items-center' : ''} relative ${showForm ? 'min-h-[260px] sm:min-h-[300px] md:min-h-[340px]' : (isFirstSlide ? 'min-h-[280px] sm:min-h-[320px]' : isSecondSlide ? 'min-h-[220px] sm:min-h-[260px]' : 'min-h-[300px] sm:min-h-[350px]')} md:h-full`}
            style={{ height: showForm && lockedHeight ? lockedHeight : undefined }}
          >
            {!showForm ? (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-12 w-36 sm:h-14 sm:w-40 md:h-16 md:w-48 relative flex-shrink-0">
                    <Image
                      src={slide.logo || "/placeholder.svg"}
                      alt="Company Logo"
                      fill
                      className="object-contain object-left"
                    />
                  </div>
                  <div className="text-[#e31e24] font-bold text-xs sm:text-sm tracking-wider whitespace-nowrap">{slide.industry}</div>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1a1a] leading-tight">{slide.title}</h2>

                {/* CTA Link */}
                <button
                  onClick={() => {
                    const h = leftCardRef.current?.offsetHeight ?? null
                    if (h) setLockedHeight(h)
                    setShowForm(true)
                  }}
                  className="inline-flex items-center gap-2 text-[#e31e24] font-semibold text-base sm:text-lg hover:gap-3 transition-all cursor-pointer"
                >
                  See the full story
                  <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-[#e31e24]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 w-full max-w-md border-2 border-[#e31e24] rounded-lg p-6 mx-auto">
                <form
                  className="space-y-5"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (submitting) return
                    const form = e.currentTarget as HTMLFormElement
                    const data = new FormData(form)
                    const payload = {
                      fullName: String(data.get('fullName') || ''),
                      email: String(data.get('email') || ''),
                      phone: String(data.get('phone') || ''),
                      caseStudy: caseStudyNames[currentSlide] || 'Unknown',
                      pdfUrl: pdfUrls[currentSlide] || '',
                    }
                    if (!payload.fullName || !payload.email || !payload.phone) {
                      toast?.({ title: 'Please fill all fields' })
                      return
                    }
                    try {
                      setSubmitting(true)
                      const res = await fetch('/api/case-study-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                      if (!res.ok) throw new Error('Request failed')
                      toast?.({ title: 'Submitted', description: 'We have emailed the details.' })
                      form.reset()
                      setShowForm(false)
                      setLockedHeight(null)
                      const url = pdfUrls[currentSlide]
                      if (url) {
                        try {
                          window.open(url, '_blank', 'noopener')
                        } catch {}
                      }
                    } catch (err) {
                      toast?.({ title: 'Submission failed', description: 'Please try again later.' })
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[#1a1a1a] font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#1a1a1a] font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#1a1a1a] font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setLockedHeight(null)
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#e31e24] hover:bg-[#c71a20] text-white"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Side - Image with Metric */}
          <div 
            className={`relative bg-[#4a4a4a] ${showForm ? 'min-h-[260px] sm:min-h-[300px] md:min-h-[340px]' : (isFirstSlide ? 'min-h-[280px] sm:min-h-[320px]' : isSecondSlide ? 'min-h-[220px] sm:min-h-[260px]' : 'min-h-[300px] sm:min-h-[350px]')} md:h-full overflow-hidden`}
            style={{ height: showForm && lockedHeight ? lockedHeight : undefined }}
          >
            {/* Background Image */}
            <Image src={slide.image || "/placeholder.svg"} alt="Case Study" fill className="object-cover" />

            {/* Metric Card Overlay */}
           
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
