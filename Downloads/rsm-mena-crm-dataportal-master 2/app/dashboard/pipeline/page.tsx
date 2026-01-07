"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PipelineDrawer } from "@/components/pipeline/pipeline-drawer"
import { toast } from "sonner"
import { DataItems } from "@/components/user/data-items"
import Filter from "@/app/components/Filter"
import { Flame, CalendarClock, CheckCheck, Rocket } from "lucide-react"

type PipelineStage = "hot" | "meeting scheduled" | "meeting done" | "opportunity"
type PipelineSolution = "risk" | "cyber training" | "cyber advisory"

interface PipelineItem {
  _id: string
  first_name?: string
  last_name?: string
  title?: string
  company_name?: string
  email?: string
  stage: PipelineStage
  solution?: PipelineSolution
  notes?: { authorId: string; authorEmail?: string; comment: string; createdAt: string; category?: "call" | "note" | "email" | "meeting" }[]
}

export default function UserPipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  const stages: PipelineStage[] = ["hot", "meeting scheduled", "meeting done", "opportunity"]
  const solutions: PipelineSolution[] = ["risk", "cyber training", "cyber advisory"]

  // Field preferences (union of both user types)
  const GENERAL_FIELDS: string[] = [
    'first_name','last_name','title','company_name','email','email_status','seniority','departments','personal_phone','company_phone','employees','industry','person_linkedin_url','contact_country','website','technologies','company_address','company_linkedin_url','company_country','annual_revenue'
  ]
  const WORKMATE_FIELDS: string[] = [
    'contact_name','designation','account_name','industry_client','industry_nexuses','type_of_company','priority','sales_manager','no_of_employees','revenue','contact_number_personal','phone_status','email_id','email_status','person_linkedin_url','website','company_linkedin_url','technologies','city','state','country_contact_person','company_address','company_headquarter','workmates_remark','tm_remarks'
  ]

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/pipeline")
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      toast.error("Failed to load pipeline")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleStageChange = async (id: string, stage: PipelineStage) => {
    try {
      // optimistic
      setItems(prev => prev.map(i => i._id === id ? { ...i, stage } : i))
      const res = await fetch("/api/user/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, stage })
      })
      if (!res.ok) throw new Error()
      // refresh once on success
      load()
    } catch {
      toast.error("Failed to update stage")
      load()
    }
  }

  const handleSolutionChange = async (id: string, solution: PipelineSolution) => {
    try {
      setItems(prev => prev.map(i => i._id === id ? { ...i, solution } : i))
      const res = await fetch("/api/user/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, solution })
      })
      if (!res.ok) throw new Error()
      // refresh once on success
      load()
    } catch {
      toast.error("Failed to update solution")
      load()
    }
  }

  // Build DataItems-compatible rows
  const tableRows = useMemo(() => {
    return items.map((item: any) => {
      const d = (item?.data ?? {}) as Record<string, any>
      const m = (item?.meta ?? {}) as Record<string, any>
      const toStr = (v: any) => (v === undefined || v === null) ? '' : String(v)
      return {
        _id: toStr(item._id),
        first_name: toStr(d.first_name),
        last_name: toStr(d.last_name),
        contact_name: toStr(d.contact_name || m.fullName),
        title: toStr(d.title),
        designation: toStr(d.designation),
        company_name: toStr(d.company_name || d.account_name || m.company),
        account_name: toStr(d.account_name),
        email: toStr(d.email || d.email_id || m.email),
        personal_phone: toStr(d.personal_phone || d.contact_number_personal || d.phone || m.phone),
        industry: toStr(d.industry || d.industry_client || m.industry),
        website: toStr(d.website),
        person_linkedin_url: toStr(d.person_linkedin_url),
        company_linkedin_url: toStr(d.company_linkedin_url),
        stage: toStr(item.stage),
        solution: toStr(item.solution),
      } as Record<string, string>
    })
  }, [items])

  // Apply the same filters used by the table to compute stage stats
  const filteredRows = useMemo(() => {
    if (!tableRows || tableRows.length === 0) return [] as Record<string, string>[]
    if (!activeFilters || Object.keys(activeFilters).length === 0) return tableRows
    return tableRows.filter((row) => {
      return Object.entries(activeFilters).every(([column, allowedValues]) => {
        if (!allowedValues || allowedValues.length === 0) return true
        const cellValue = row[column]
        return allowedValues.includes(cellValue)
      })
    })
  }, [tableRows, activeFilters])

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      hot: 0,
      'meeting scheduled': 0,
      'meeting done': 0,
      opportunity: 0,
    }
    for (const r of filteredRows) {
      const key = String(r.stage || '').toLowerCase() as PipelineStage
      if (key in counts) counts[key] += 1
    }
    return counts
  }, [filteredRows])

  const totalFiltered = filteredRows.length

  return (
    <div className="p-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : (
            <>
              {/* Stage Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 shadow-sm hover:shadow transition" title="Hot">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#6B7280]">Hot</div>
                      <div className="mt-1 text-2xl font-semibold text-[#111827]">{stageCounts['hot']}</div>
                      <div className="text-xs text-[#9CA3AF]">of {totalFiltered} filtered</div>
                    </div>
                    <div className="h-10 w-10 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
                      <Flame className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 shadow-sm hover:shadow transition" title="Meeting Scheduled">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#6B7280]">Meeting Scheduled</div>
                      <div className="mt-1 text-2xl font-semibold text-[#111827]">{stageCounts['meeting scheduled']}</div>
                      <div className="text-xs text-[#9CA3AF]">of {totalFiltered} filtered</div>
                    </div>
                    <div className="h-10 w-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 shadow-sm hover:shadow transition" title="Meeting Done">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#6B7280]">Meeting Done</div>
                      <div className="mt-1 text-2xl font-semibold text-[#111827]">{stageCounts['meeting done']}</div>
                      <div className="text-xs text-[#9CA3AF]">of {totalFiltered} filtered</div>
                    </div>
                    <div className="h-10 w-10 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
                      <CheckCheck className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm hover:shadow transition" title="Opportunity">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#6B7280]">Opportunity</div>
                      <div className="mt-1 text-2xl font-semibold text-[#111827]">{stageCounts['opportunity']}</div>
                      <div className="text-xs text-[#9CA3AF]">of {totalFiltered} filtered</div>
                    </div>
                    <div className="h-10 w-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Rocket className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              <DataItems
                selectedFileIndex={0}
                activeFilters={activeFilters}
                setIsFilterOpen={setIsFilterOpen}
                allFilesData={tableRows}
                enableExport={false}
                preferredColumns={[
                  'first_name',
                  'last_name',
                  'title',
                  'company_name',
                  'industry',
                  'stage',
                  'solution'
                ]}
                renderDrawer={({ row, isOpen, onClose }) => {
                  const item = items.find(i => String((i as any)._id) === String((row as any)?._id)) || null
                  return (
                    <PipelineDrawer
                      isOpen={isOpen}
                      onClose={onClose}
                      item={item}
                      stages={stages}
                      solutions={solutions as any}
                      onStageChange={(stage) => {
                        if (!item?._id) return
                        handleStageChange(item._id, stage)
                      }}
                      onSolutionChange={(solution) => {
                        if (!item?._id) return
                        handleSolutionChange(item._id, solution as PipelineSolution)
                      }}
                      onAddNote={async ({ comment, category }) => {
                        if (!item?._id) return
                        const res = await fetch(`/api/user/pipeline/${item._id}/notes`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ comment, category })
                        })
                        if (res.ok) {
                          const updated = await res.json()
                          setItems(prev => prev.map(i => i._id === updated._id ? updated : i))
                        }
                      }}
                      onSaveDetails={undefined}
                    />
                  )
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
      {/* Filter drawer controlled from the table's Filters button */}
      <Filter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={(filters) => setActiveFilters(filters)}
        data={tableRows}
      />
    </div>
  )
}


