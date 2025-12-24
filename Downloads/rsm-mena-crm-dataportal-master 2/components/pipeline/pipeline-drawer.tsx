"use client"

import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { X, Mail, Phone, Building2, Globe, MapPin, User, Briefcase, LinkedinIcon, Info, Calendar, Clock, StickyNote } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { getTechBadgeColors, getIndustryBadgeColors } from "@/components/user/tech-colors"

type PipelineStage = "hot" | "meeting scheduled" | "meeting done" | "opportunity"
type PipelineSolution = "risk" | "cyber training" | "cyber advisory"
type NoteCategory = "call" | "note" | "email" | "meeting"

interface NoteItem {
  comment: string
  createdAt: string
  authorEmail?: string
  category?: NoteCategory
}

interface PipelineDrawerProps {
  isOpen: boolean
  onClose: () => void
  item: any | null
  stages: PipelineStage[]
  onStageChange?: (stage: PipelineStage) => void
  solutions?: PipelineSolution[]
  onSolutionChange?: (solution: PipelineSolution) => void
  onAddNote?: (payload: { comment: string; category: NoteCategory }) => void | Promise<void>
  allowEdit?: boolean
  onSaveDetails?: (updatedData: Record<string, any>) => void | Promise<void>
}

export function PipelineDrawer({ isOpen, onClose, item, stages, onStageChange, solutions = ["risk","cyber training","cyber advisory"], onSolutionChange, onAddNote, allowEdit = false, onSaveDetails }: PipelineDrawerProps) {
  const [animateIn, setAnimateIn] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteCategory, setNoteCategory] = useState<NoteCategory>("note")
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>("details")
  const [editMode, setEditMode] = useState(false)
  const [draftData, setDraftData] = useState<Record<string, any>>({})

  // Derive display fields eagerly so hooks order never changes
  const name = [item?.first_name, item?.last_name].filter(Boolean).join(" ")
  const notes: NoteItem[] = (item?.notes || [])
  const data: Record<string, any> = useMemo(() => item?.data ?? {}, [item])
  const displayData: Record<string, any> = useMemo(() => {
    const meta = new Set(['_id','userId','stage','notes','createdAt','updatedAt','__v','data'])
    const root: Record<string, any> = {}
    if (item) {
      Object.keys(item).forEach((k) => {
        if (!meta.has(k)) {
          const v = (item as any)[k]
          if (typeof v !== 'object') root[k] = v
        }
      })
    }
    return { ...root, ...data }
  }, [item, data])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setAnimateIn(true), 10)
      return () => clearTimeout(t)
    } else {
      setAnimateIn(false)
      setNoteText("")
      setNoteCategory("note")
    }
  }, [isOpen])

  // Initialize draft data only when item changes
  useEffect(() => {
    setDraftData(item?.data ?? {})
  }, [item])

  // Defer conditional rendering until after all hooks to preserve hook order across renders

  const handleAddNote = async () => {
    if (!noteText.trim() || !onAddNote) return
    await onAddNote({ comment: noteText.trim(), category: noteCategory })
    setNoteText("")
    setNoteCategory("note")
  }

  const fieldLabel = (key: string) => key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  // ---------- Drawer design helpers to match All Contacts drawer ----------
  const formatColumnName = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getFieldIcon = (key: string, value: string) => {
    const keyLower = key.toLowerCase()
    if (keyLower.includes('email')) return <Mail className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('phone') || keyLower.includes('contact_number')) return <Phone className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('company') || keyLower.includes('account_name')) return <Building2 className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('website') || keyLower.includes('url')) return <Globe className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('address') || keyLower.includes('location') || keyLower.includes('country')) return <MapPin className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('name') || keyLower.includes('person')) return <User className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('title') || keyLower.includes('designation') || keyLower.includes('position')) return <Briefcase className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('linkedin')) return <LinkedinIcon className="h-5 w-5 text-gray-500" />
    if (keyLower.includes('date') || keyLower.includes('last')) return <Calendar className="h-5 w-5 text-gray-500" />
    return <Info className="h-5 w-5 text-gray-500" />
  }

  const getPersonName = (rowData: Record<string, any>): string => {
    if (rowData['contact_name']) return rowData['contact_name']
    if (rowData['first_name'] && rowData['last_name']) return `${rowData['first_name']} ${rowData['last_name']}`.trim()
    if (rowData['name']) return rowData['name']
    if (rowData['full_name']) return rowData['full_name']
    const nameField = Object.keys(rowData).find(k => k.toLowerCase().includes('name') && !k.toLowerCase().includes('company') && !k.toLowerCase().includes('account'))
    return nameField ? rowData[nameField] : 'Contact Details'
  }

  const getCompanyName = (rowData: Record<string, any>): string => {
    if (rowData['company']) return rowData['company']
    if (rowData['company_name']) return rowData['company_name']
    if (rowData['account_name']) return rowData['account_name']
    const companyField = Object.keys(rowData).find(k => k.toLowerCase().includes('company') || k.toLowerCase().includes('account'))
    return companyField ? rowData[companyField] : ''
  }

  const getIndustry = (rowData: Record<string, any>): string => {
    if (rowData['industry']) return rowData['industry']
    if (rowData['industry_client']) return rowData['industry_client']
    const industryField = Object.keys(rowData).find(k => k.toLowerCase().includes('industry'))
    return industryField ? rowData[industryField] : ''
  }

  const personName = getPersonName(displayData)
  const companyName = getCompanyName(displayData)
  const industry = getIndustry(displayData)

  const emailKey = Object.keys(displayData).find(key => key.toLowerCase().includes('email') && displayData[key])
  const emailValue = emailKey ? displayData[emailKey] : ''
  const phoneKey = Object.keys(displayData).find(key => (key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact_number')) && displayData[key])
  const phoneValue = phoneKey ? displayData[phoneKey] : ''

  const toTitleCase = (s: string) => String(s || '')
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const stageBadgeClasses = (stage: string) => {
    const key = String(stage || '').toLowerCase()
    if (key === 'hot') return 'bg-red-100 text-red-800'
    if (key === 'meeting scheduled') return 'bg-yellow-100 text-yellow-800'
    if (key === 'meeting done') return 'bg-green-100 text-green-800'
    if (key === 'opportunity') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const solutionBadgeClasses = (solution: string) => {
    const key = String(solution || '').toLowerCase()
    if (key === 'risk') return 'bg-purple-100 text-purple-800'
    if (key === 'cyber training') return 'bg-amber-100 text-amber-800'
    if (key === 'cyber advisory') return 'bg-indigo-100 text-indigo-800'
    return 'bg-gray-100 text-gray-800'
  }

  // Group fields into sections for cleaner layout
  const allKeys = Object.keys(displayData)
  const by = (fn: (k: string) => boolean) => allKeys.filter(k => fn(k) && displayData[k])
  const inList = (k: string, parts: string[]) => parts.some(p => k.toLowerCase().includes(p))

  const contactKeys = by(k => inList(k, ['email', 'phone', 'contact_number']))
  const socialKeys = by(k => inList(k, ['website', 'linkedin']))
  const roleOrgKeys = by(k => inList(k, ['title', 'designation', 'seniority', 'department', 'company', 'account_name', 'industry']))
  const locationKeys = by(k => inList(k, ['address', 'location', 'city', 'state', 'country']))
  const techKeys = by(k => inList(k, ['technolog']))
  const usedKeySet = new Set<string>([...contactKeys, ...socialKeys, ...roleOrgKeys, ...locationKeys, ...techKeys])
  const additionalKeys = allKeys.filter(k => !usedKeySet.has(k) && !['_id','stage','solution','notes'].includes(k) && displayData[k])

  // ----- Timeline helpers for Notes -----
  const isSameDay = (a: Date, b: Date) => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )

  const formatDateLabel = (d: Date) => {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    if (isSameDay(d, today)) return 'Today'
    if (isSameDay(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTimeLabel = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  const getRelativeTime = (d: Date) => {
    const diffMs = Date.now() - d.getTime()
    const sec = Math.floor(diffMs / 1000)
    const min = Math.floor(sec / 60)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    if (sec < 60) return `${sec}s ago`
    if (min < 60) return `${min}m ago`
    if (hr < 24) return `${hr}h ago`
    return `${day}d ago`
  }

  const groupedNotes = useMemo(() => {
    const sorted = (notes || []).slice().sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return db - da // newest first
    })
    const groups: { key: string; label: string; items: NoteItem[] }[] = []
    for (const n of sorted) {
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) {
        const fallbackKey = 'Unknown'
        let g = groups.find(g => g.key === fallbackKey)
        if (!g) { g = { key: fallbackKey, label: 'Unknown Date', items: [] }; groups.push(g) }
        g.items.push(n)
        continue
      }
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
      let group = groups.find(g => g.key === key)
      if (!group) {
        group = { key, label: formatDateLabel(d), items: [] }
        groups.push(group)
      }
      group.items.push(n)
    }
    return groups
  }, [notes])
  const categoryIcon = (cat?: NoteCategory) => {
    const c = (cat || 'note') as NoteCategory
    if (c === 'call') return <Phone className="w-4 h-4" />
    if (c === 'email') return <Mail className="w-4 h-4" />
    if (c === 'meeting') return <Calendar className="w-4 h-4" />
    return <StickyNote className="w-4 h-4" />
  }

  const categoryClasses = (cat?: NoteCategory) => {
    const c = (cat || 'note') as NoteCategory
    if (c === 'call') return 'border-blue-200 bg-blue-50'
    if (c === 'email') return 'border-emerald-200 bg-emerald-50'
    if (c === 'meeting') return 'border-amber-200 bg-amber-50'
    return 'border-gray-200 bg-gray-50'
  }


  // After all hooks are declared, conditionally render nothing when closed
  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-[1000] m-0 p-0">
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${animateIn ? 'opacity-50' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-[90%] md:w-[560px] lg:w-[640px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${animateIn ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-gray-200 overflow-hidden`}>
        {/* Header to mirror RowDetailsDrawer */}
        <div className="flex-none p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-4">
            <div className="mb-2">
              <div className="text-xl font-semibold text-gray-900">{personName || name || 'Contact Details'}</div>
              {companyName && <div className="text-gray-600 mt-1">{companyName}</div>}
              {industry && (
                <div className="mt-2">
                  <Badge className={cn(
                    getIndustryBadgeColors(industry).bg,
                    getIndustryBadgeColors(industry).text,
                    'border',
                    getIndustryBadgeColors(industry).bg.replace('bg-', 'border-'),
                    'font-normal'
                  )}>{industry}</Badge>
                </div>
              )}
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <div className="px-6">
              <div className="flex flex-col gap-3">
                <TabsList className="w-fit self-start">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="text-xs uppercase text-gray-500">Stage</div>
                    {onStageChange ? (
                      <Select value={item?.stage} onValueChange={(v: PipelineStage) => onStageChange(v)}>
                        <SelectTrigger className="h-8 w-[140px] sm:w-[180px]">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map(s => <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${stageBadgeClasses(item?.stage || '')}`}>{toTitleCase(item?.stage || '')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs uppercase text-gray-500">Solution</div>
                    {onSolutionChange ? (
                      <Select value={item?.solution} onValueChange={(v: PipelineSolution) => onSolutionChange(v)}>
                        <SelectTrigger className="h-8 w-[140px] sm:w-[180px]">
                          <SelectValue placeholder="Select solution" />
                        </SelectTrigger>
                        <SelectContent>
                          {solutions.map(s => <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${solutionBadgeClasses(item?.solution || '')}`}>{toTitleCase(item?.solution || '')}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <TabsContent value="details" className="flex-1 min-h-0">
              <ScrollArea className="h-full px-6 py-4 overflow-y-auto">
                {allowEdit && (
                  <div className="flex justify-end mb-3">
                    {!editMode ? (
                      <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={async () => { if (onSaveDetails) await onSaveDetails(draftData); setEditMode(false) }}>Save</Button>
                        <Button variant="outline" onClick={() => { setDraftData(data); setEditMode(false) }}>Cancel</Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-8">
                  {/* Contact Information */}
                  {(contactKeys.length > 0 || socialKeys.length > 0) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Contact Information</div>
                      <div className="space-y-4">
                        {[...contactKeys, ...socialKeys].map((key) => {
                          const value = displayData[key]
                          const isEmail = key.toLowerCase().includes('email')
                          const isPhone = key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact_number')
                          return (
                            <div key={key} className="flex items-center gap-4">
                              <div className="flex-shrink-0">{getFieldIcon(key, String(value))}</div>
                              <div className="flex-grow">
                                {isEmail ? (
                                  <a href={`mailto:${value}`} className="text-blue-600 hover:underline text-sm">{String(value)}</a>
                                ) : isPhone ? (
                                  <a href={`tel:${String(value).replace(/\D/g, '')}`} className="text-blue-600 hover:underline text-sm">{String(value)}</a>
                                ) : (
                                  <span className="text-sm text-gray-900">{String(value)}</span>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">{formatColumnName(key)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Role & Organization */}
                  {roleOrgKeys.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Role & Organization</div>
                      <div className="space-y-4">
                        {roleOrgKeys.map((key) => (
                          <div key={key} className="flex items-start gap-4">
                            <div className="flex-shrink-0">{getFieldIcon(key, String(displayData[key]))}</div>
                            <div className="flex-grow">
                              <div className="text-xs uppercase text-gray-500">{fieldLabel(key)}</div>
                              <div className="text-sm text-gray-800 break-words">{String(displayData[key])}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {locationKeys.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Location</div>
                      <div className="space-y-4">
                        {locationKeys.map((key) => (
                          <div key={key} className="flex items-start gap-4">
                            <div className="flex-shrink-0">{getFieldIcon(key, String(displayData[key]))}</div>
                            <div className="flex-grow">
                              <div className="text-xs uppercase text-gray-500">{fieldLabel(key)}</div>
                              <div className="text-sm text-gray-800 break-words">{String(displayData[key])}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technologies */}
                  {techKeys.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Technologies</div>
                      <div className="space-y-2">
                        {techKeys.map((key) => (
                          <div key={key} className="flex items-start gap-4">
                            <div className="flex-shrink-0">{getFieldIcon(key, String(displayData[key]))}</div>
                            <div className="flex-grow">
                              <div className="flex flex-wrap gap-2">
                                {String(displayData[key]).split(',').map((tech, i) => {
                                  const t = tech.trim(); if (!t) return null
                                  const colors = getTechBadgeColors(t)
                                  return <Badge key={i} className={cn(colors.bg, colors.text, 'border', colors.bg.replace('bg-','border-'), 'font-normal')}>{t}</Badge>
                                })}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{fieldLabel(key)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  {additionalKeys.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Additional Details</div>
                      <div className="space-y-4">
                        {additionalKeys.map((key) => (
                          <div key={key} className="flex items-start gap-4">
                            <div className="flex-shrink-0">{getFieldIcon(key, String(displayData[key]))}</div>
                            <div className="flex-grow">
                      <div className="text-xs uppercase text-gray-500">{fieldLabel(key)}</div>
                      {!editMode || !allowEdit ? (
                                <div className="text-sm text-gray-800 break-words">{String(displayData[key])}</div>
                      ) : (
                        <Input value={String((draftData as any)[key] ?? displayData[key] ?? '')} onChange={(e) => setDraftData(prev => ({ ...prev, [key]: e.target.value }))} />
                      )}
                            </div>
                    </div>
                  ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 min-h-0">
              <ScrollArea className="h-full px-6 py-4 overflow-y-auto">
                {groupedNotes.length > 0 ? (
                  <div className="pl-6 border-l border-gray-200 space-y-6">
                    {groupedNotes.map(group => (
                      <div key={group.key} className="space-y-3">
                        <div className="-ml-6 mb-1">
                          <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">{group.label}</Badge>
                        </div>
                        {group.items.map((n, idx) => {
                          const d = new Date(n.createdAt)
                          const time = isNaN(d.getTime()) ? '' : formatTimeLabel(d)
                          const rel = isNaN(d.getTime()) ? '' : getRelativeTime(d)
                          return (
                            <div key={idx} className="relative">
                              <span className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white border border-blue-200"></span>
                              <div className={`rounded p-3 border ${categoryClasses(n.category as NoteCategory)}`}>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-600 flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 font-medium text-gray-800">
                                      {categoryIcon(n.category as NoteCategory)}
                                      <span className="capitalize">{(n.category || 'note')}</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{time}</span>
                                    </span>
                                    {n.authorEmail && (
                                      <span className="text-gray-400">• {n.authorEmail}</span>
                                    )}
                                  </div>
                                  {rel && <div className="text-[10px] text-gray-400">{rel}</div>}
                                </div>
                                <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{n.comment}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No notes yet.</div>
                )}

                {onAddNote && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase text-gray-500">Comment Type</span>
                      <ToggleGroup type="single" value={noteCategory} onValueChange={(v) => v && setNoteCategory(v as NoteCategory)}>
                        <ToggleGroupItem value="call" aria-label="Call" title="Call">
                          <div className="inline-flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Call</span>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="note" aria-label="Note" title="Note">
                          <div className="inline-flex items-center gap-1.5">
                            <StickyNote className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Note</span>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="email" aria-label="Email" title="Email">
                          <div className="inline-flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Email</span>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="meeting" aria-label="Meeting" title="Meeting">
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Meeting</span>
                          </div>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="flex gap-2">
                      <Textarea placeholder="Add a note" value={noteText} onChange={e => setNoteText(e.target.value)} />
                      <Button className="self-start" onClick={handleAddNote}>Add</Button>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


