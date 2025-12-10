"use client"

import { useState, useTransition } from "react"
import { submitCapabilityForm } from "./actions"

export default function Home() {
  const [leaderCount, setLeaderCount] = useState(1)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isPending, startTransition] = useTransition()

  const addLeader = () => {
    setLeaderCount((prev) => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    startTransition(async () => {
      const result = await submitCapabilityForm(formData)
      if (result?.success) {
        setShowThankYou(true)
        // Scroll to top to show thank you message
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Reset form after showing thank you
        if (form) {
          form.reset()
        }
        setLeaderCount(1)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#005C94] shadow-sm">
        <div className="max-w-[900px] mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <div>
              <img
                src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/MARS/RSM%20Academy%20Logo.svg"
                alt="RSM Academy Logo"
                className="h-[55px]"
              />
            </div>
            <div className="text-sm text-[#666] uppercase tracking-wider">The Power of Being Understood</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[#009BDD] text-white py-12 text-center">
        <div className="max-w-[900px] mx-auto px-5">
          <h1 className="text-4xl font-bold mb-2.5">RSM MENA Cyber Security Capability Map</h1>
          <p className="text-lg max-w-[700px] mx-auto opacity-90">
            Unifying our strengths to deliver the 360° Cyber Security Approach across the region.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-[900px] mx-auto px-5">
        <div className="bg-white -mt-8 mb-12 p-10 rounded-lg shadow-lg relative">
          {showThankYou ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-[#11A537] rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#333] mb-4">Thank You!</h2>
              <p className="text-lg text-[#666] leading-relaxed">
                Thank you for submitting the form. We will get back to you soon.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[0.95rem] text-[#666] mb-5 italic">
                This survey maps the specific capabilities available within each RSM MENA member firm. The data will be used
                to route leads to the correct office and identify cross-border collaboration opportunities.
              </p>

              <form onSubmit={handleSubmit} encType="multipart/form-data">
            {/* Section 1: Member Firm Identification */}
            <h2 className="text-[#11A537] border-b-2 border-[#f4f4f4] pb-2.5 mt-8 text-2xl font-bold">
              1. Member Firm Identification
            </h2>

            <div className="mb-5 mt-5">
              <label htmlFor="country" className="block font-bold mb-2">
                RSM Member Firm / Country
              </label>
              <select
                id="country"
                name="country"
                required
                className="w-full p-3 border border-[#ccc] rounded text-base"
              >
                <option value="" disabled>
                  Select your location
                </option>
                <option value="Mauritania">Mauritania</option>
                <option value="Chad">Chad</option>
                <option value="Iraq">Iraq</option>
                <option value="Senegal">Senegal</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Qatar">Qatar</option>
                <option value="Oman">Oman</option>
                <option value="Palestine">Palestine</option>
                <option value="Morocco">Morocco</option>
                <option value="Kuwait">Kuwait</option>
                <option value="UAE">UAE</option>
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="contactName" className="block font-bold mb-2">
                Primary Cyber Security Lead
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                placeholder="Partner or Director Name"
                required
                className="w-full p-3 border border-[#ccc] rounded text-base"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="contactEmail" className="block font-bold mb-2">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                placeholder="name@rsm.ae"
                required
                className="w-full p-3 border border-[#ccc] rounded text-base"
              />
            </div>

            {/* Section 2: Service Capabilities */}
            <h2 className="text-[#11A537] border-b-2 border-[#f4f4f4] pb-2.5 mt-8 text-2xl font-bold">
              2. Service Capabilities
            </h2>
            <p className="text-[0.95rem] text-[#666] mb-5 italic">
              Select only the services your local office can deliver independently.
            </p>

            {/* Strategic Advisory & GRC */}
            <h3 className="text-[#11A537] text-xl font-bold mb-4 mt-6">Strategic Advisory & GRC</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="vCISO" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">vCISO Services</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Cyber defence strategy, policy, architecture & org planning.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="MaturityAssessment" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Maturity Assessment (NIST)</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Scoring maturity based on NIST framework & People/Controls readiness.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="GRC" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">GRC Automation & Assessment</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Compliance (ISO, COSO, SOX, Central Bank) & ITGC/Enterprise Risk.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="DigitalFootprint" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Digital Footprint Mapping</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Analysis of external exposure and brand sentiment.
                  </span>
                </div>
              </label>
            </div>

            {/* Offensive Security & VAPT */}
            <h3 className="text-[#11A537] text-xl font-bold mb-4 mt-6">Offensive Security & VAPT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="VAPT" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Vulnerability Assessment (VAPT)</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Blackbox/Greybox/Whitebox (Outside-in & Inside-out).
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="RedTeaming" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Red Teaming</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Adversary simulation to test detection/response.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="DevSecOps" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">DevSecOps / Security as Code</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Securing the SDLC and Cloud Applications.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="BAS" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Breach & Attack Simulation</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Lab-based continuous validation of controls.
                  </span>
                </div>
              </label>
            </div>

            {/* Managed Services & Response */}
            <h3 className="text-[#11A537] text-xl font-bold mb-4 mt-6">Managed Services & Response</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="SOC" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">SOC as a Service</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    24x7 Monitoring, Incident Management (Captive or Managed).
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="ThreatIntel" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Threat Monitoring</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Dark web monitoring & threat intelligence.
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="IncidentResponse" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Incident Response & Forensics</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Root cause analysis, kill-chain reconstruction (e.g. Ransomware/DDoS).
                  </span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="OTSecurity" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">OT Security</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Assessments for Operational Technology & Industrial Control Systems.
                  </span>
                </div>
              </label>
            </div>

            {/* Training & Resilience */}
            <h3 className="text-[#11A537] text-xl font-bold mb-4 mt-6">Training & Resilience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="CyberDrills" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Cyber Drills / Table-Top</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">Workshops for IT/Non-IT Executives.</span>
                </div>
              </label>

              <label className="bg-[#f9f9f9] p-4 rounded border-l-4 border-[#00A3E0] flex items-start cursor-pointer hover:bg-[#f0f7fb] transition-colors">
                <input type="checkbox" name="services" value="Training" className="mr-3 mt-1 scale-110" />
                <div>
                  <strong className="block text-[#333]">Skill Assurance Programs</strong>
                  <span className="text-[0.85rem] text-[#666] block mt-1">
                    Lab-based training (B2B/B2C) & Onboarding programs.
                  </span>
                </div>
              </label>
            </div>

            {/* Section 3: Niche & Unique Capabilities */}
            <h2 className="text-[#11A537] border-b-2 border-[#f4f4f4] pb-2.5 mt-8 text-2xl font-bold">
              3. Niche & Unique Capabilities
            </h2>
            <div className="mb-5 mt-5">
              <label htmlFor="niche" className="block font-bold mb-2">
                Is there a specific area not listed above where your firm excels?
              </label>
              <p className="text-[0.95rem] text-[#666] mb-2 italic">
                E.g., Specific local regulations (PDPL, SAMA), specific industries (Oil & Gas), or proprietary tools.
              </p>
              <textarea
                id="niche"
                name="niche"
                rows={4}
                placeholder="Describe any unique capabilities..."
                className="w-full p-3 border border-[#ccc] rounded text-base"
              />
            </div>

            {/* Section 4: Leadership & Expertise Profile */}
            <h2 className="text-[#11A537] border-b-2 border-[#f4f4f4] pb-2.5 mt-8 text-2xl font-bold">
              4. Leadership & Expertise Profile
            </h2>
            <p className="text-[0.95rem] text-[#666] mb-5 italic">
              Please profile the Partners/Directors who lead these services. We will use this to build a regional expert
              directory.
            </p>

            <div id="leaders-container">
              {Array.from({ length: leaderCount }, (_, i) => (
                <div key={i} className="bg-[#f0f7fb] border border-[#d0e3f0] p-5 rounded mb-5">
                  <h3 className="mt-0 text-lg text-[#005C94] font-bold mb-4">Leader Profile {i + 1}</h3>
                  <div className="mb-5">
                    <label className="block font-bold mb-2">Name</label>
                    <input
                      type="text"
                      name={`leaderName_${i}`}
                      required={i === 0}
                      className="w-full p-3 border border-[#ccc] rounded text-base"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block font-bold mb-2">Designation</label>
                    <input
                      type="text"
                      name={`leaderRole_${i}`}
                      placeholder="e.g. Partner, Director"
                      required={i === 0}
                      className="w-full p-3 border border-[#ccc] rounded text-base"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block font-bold mb-2">Primary Technical Expertise</label>
                    <input
                      type="text"
                      name={`leaderSkill_${i}`}
                      placeholder="e.g. Forensics, Banking GRC"
                      required={i === 0}
                      className="w-full p-3 border border-[#ccc] rounded text-base"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block font-bold mb-2">Upload CV (PDF)</label>
                    <input
                      type="file"
                      name={`leaderCV_${i}`}
                      accept=".pdf,.doc,.docx"
                      className="w-full p-3 border border-[#ccc] rounded text-base"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLeader}
              className="bg-transparent border-2 border-dashed border-[#005C94] text-[#005C94] p-2.5 w-full cursor-pointer font-bold rounded transition-colors hover:bg-[#f0f7fb]"
            >
              + Add Another Leader
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="bg-[#11A537] text-white border-none p-4 text-lg font-bold rounded cursor-pointer w-full mt-8 transition-colors hover:bg-[#0d8a2b] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Capability Assessment"
              )}
            </button>
          </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-[#888] text-sm border-t border-[#ddd]">
        <div className="max-w-[900px] mx-auto px-5">
          <p>&copy; 2025 RSM International Association. All rights reserved.</p>
          <p>RSM is the brand used by a network of independent accounting and consulting firms.</p>
        </div>
      </footer>
    </div>
  )
}
