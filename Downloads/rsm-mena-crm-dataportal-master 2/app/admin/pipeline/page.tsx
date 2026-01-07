"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { PipelineDrawer } from "@/components/pipeline/pipeline-drawer"

type PipelineStage = "hot" | "meeting scheduled" | "meeting done" | "opportunity"
type PipelineSolution = "risk" | "cyber training" | "cyber advisory"

interface PipelineItem {
  _id?: string
  userId: string
  data?: Record<string, any>
  first_name?: string
  last_name?: string
  title?: string
  company_name?: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  stage: PipelineStage
  solution?: PipelineSolution
  notes?: { authorId: string; comment: string; createdAt: string; authorEmail?: string }[]
}

interface UserOption { id: string; email: string; userType?: 'workmate' | 'general' }

export default function AdminPipelinePage() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState<boolean>(true)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerItem, setDrawerItem] = useState<PipelineItem | null>(null)
  const [newNote, setNewNote] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const stages: PipelineStage[] = ["hot", "meeting scheduled", "meeting done", "opportunity"]
  const solutions: PipelineSolution[] = ["risk", "cyber training", "cyber advisory"]

  // Define contact field sets
  const GENERAL_FIELDS: string[] = [
    'first_name','last_name','title','company_name','email','email_status','seniority','departments','personal_phone','company_phone','employees','industry','person_linkedin_url','contact_country','website','technologies','company_address','company_linkedin_url','company_country','annual_revenue'
  ]
  const WORKMATE_FIELDS: string[] = [
    'contact_name','designation','account_name','industry_client','industry_nexuses','type_of_company','priority','sales_manager','no_of_employees','revenue','contact_number_personal','phone_status','email_id','email_status','person_linkedin_url','website','company_linkedin_url','technologies','city','state','country_contact_person','company_address','company_headquarter','workmates_remark','tm_remarks'
  ]

  useEffect(() => {
    // fetch users for selection
    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        const res = await fetch("/api/admin/users")
        if (!res.ok) throw new Error()
        const data = await res.json()
        const options = (data || []).map((u: any) => ({ id: u.id, email: u.email, userType: u.userType }))
        setUsers(options)
      } catch {
        toast.error("Failed to load users")
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    const fetchItems = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/pipeline?userId=${selectedUserId}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setItems(data)
      } catch {
        toast.error("Failed to load pipeline")
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [selectedUserId])

  const handleSaveItem = async (item: PipelineItem) => {
    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      // Client-side meta/data fallback if API didn't include them yet
      const ensureMeta = (it: any) => {
        const d = it.data || item.data || {}
        const pick = (obj: any, keys: string[]) => keys.map(k => Object.keys(obj||{}).find(x => x.toLowerCase()===k.toLowerCase())).map(k=>k?d[k!]:undefined).find(v=>v!=null && String(v).trim()!=='')
        const first = pick(d, ['first_name','firstname'])
        const last = pick(d, ['last_name','lastname'])
        const contact = pick(d, ['contact_name','name'])
        const fullName = (first||last) ? `${first||''} ${(last||'')}`.trim() : (contact||'')
        const meta = it.meta && Object.keys(it.meta).length>0 ? it.meta : {
          fullName,
          title: pick(d,['title','designation']) || '',
          company: pick(d,['company_name','account_name','company']) || '',
          email: pick(d,['email','email_id']) || '',
        }
        return { ...it, data: Object.keys(it.data||{}).length ? it.data : d, meta }
      }
      const normalized = ensureMeta(saved)
      setItems(prev => {
        const idx = prev.findIndex(p => p._id === normalized._id)
        if (idx >= 0) {
          const copy = [...prev]; copy[idx] = normalized; return copy
        }
        return [normalized, ...prev]
      })
      toast.success("Saved")
    } catch {
      toast.error("Save failed")
    }
  }

  const handleStageChange = (id: string, stage: PipelineStage) => {
    const updated = items.find(i => i._id === id)
    if (!updated) return
    const toSave = { ...updated, stage }
    setItems(prev => prev.map(i => i._id === id ? { ...i, stage } : i))
    handleSaveItem(toSave)
    // re-fetch to ensure latest
    setTimeout(() => {
      if (selectedUserId) {
        fetch(`/api/admin/pipeline?userId=${selectedUserId}`).then(async (res) => {
          if (res.ok) setItems(await res.json())
        }).catch(() => {})
      }
    }, 0)
  }

  const handleSolutionChange = (id: string, solution: PipelineSolution) => {
    const updated = items.find(i => i._id === id)
    if (!updated) return
    const toSave = { ...updated, solution }
    setItems(prev => prev.map(i => i._id === id ? { ...i, solution } : i))
    handleSaveItem(toSave)
    // re-fetch to ensure latest
    setTimeout(() => {
      if (selectedUserId) {
        fetch(`/api/admin/pipeline?userId=${selectedUserId}`).then(async (res) => {
          if (res.ok) setItems(await res.json())
        }).catch(() => {})
      }
    }, 0)
  }

  const [form, setForm] = useState<any>({ userId: "", stage: "hot", solution: "risk", data: {} })

  const resetForm = () => setForm({ userId: selectedUserId || "", stage: "hot", solution: "risk", data: {} })

  const handleCreate = async () => {
    if (!selectedUserId) { toast.error("Select a user first"); return }
    try {
      const payload = { _id: form._id, userId: selectedUserId, stage: form.stage, solution: form.solution, data: form.data || {} }
      console.log('[PIPELINE_CREATE] submitting', payload)
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      console.log('[PIPELINE_CREATE] response', saved)
      const d = payload.data || {}
      const pick = (obj: any, keys: string[]) => keys.map(k => Object.keys(obj||{}).find(x => x.toLowerCase()===k.toLowerCase())).map(k=>k?d[k!]:undefined).find(v=>v!=null && String(v).trim()!=='')
      const first = pick(d, ['first_name','firstname'])
      const last = pick(d, ['last_name','lastname'])
      const contact = pick(d, ['contact_name','name'])
      const fullName = (first||last) ? `${first||''} ${(last||'')}`.trim() : (contact||'')
      const meta = saved.meta && Object.keys(saved.meta).length>0 ? saved.meta : {
        fullName,
        title: pick(d,['title','designation']) || '',
        company: pick(d,['company_name','account_name','company']) || '',
        email: pick(d,['email','email_id']) || '',
      }
      const normalized = { ...saved, data: Object.keys(saved.data||{}).length ? saved.data : d, meta }
      setItems(prev => {
        const idx = prev.findIndex(p => p._id === normalized._id)
        if (idx >= 0) {
          const copy = [...prev]; copy[idx] = normalized; return copy
        }
        return [normalized, ...prev]
      })
      resetForm()
      toast.success(form._id ? "Pipeline item updated" : "Pipeline item created")
    } catch {
      toast.error("Create failed")
    }
  }

  const openDetails = (item: PipelineItem) => {
    setDrawerItem(item)
    setIsDrawerOpen(true)
  }

  const selectedUserEmail = useMemo(() => users.find(u => u.id === selectedUserId)?.email || "", [users, selectedUserId])

  // Compute essential keys for table based on user type and available data keys
  const essentialKeys = useMemo(() => {
    if (!items || items.length === 0) return [] as string[]
      const selectedUser = users.find(u => u.id === selectedUserId)
    const fieldPool = new Map<string, string>() // lowerKey -> originalKey
    items.forEach(it => {
      Object.keys(it.data || {}).forEach((k) => {
        const lower = k.toLowerCase()
        if (!fieldPool.has(lower)) fieldPool.set(lower, k)
      })
    })
    const base = (selectedUser?.userType === 'workmate' ? WORKMATE_FIELDS : GENERAL_FIELDS)
      .map(k => k.toLowerCase())

    // Resolve base fields to existing keys in data (case-insensitive)
    const matched = base
      .map(lower => fieldPool.get(lower))
      .filter((k): k is string => Boolean(k))

    // Fallbacks if nothing matched yet
    if (matched.length === 0) {
      // Try convenience fields present on items
      const convenience = ['first_name','last_name','title','company_name','email','industry','website']
      const presentConvenience = convenience.filter(key => items.some(it => (it as any)[key]))
      if (presentConvenience.length > 0) return presentConvenience

      // Final fallback: first 6 keys from data pool
      return Array.from(fieldPool.values()).slice(0, 6)
    }
    return matched
  }, [items, users, selectedUserId])

  const getCellValue = (item: PipelineItem, key: string) => {
    // First try exact key in data
    if (item.data && Object.prototype.hasOwnProperty.call(item.data, key)) return item.data[key]
    // Case-insensitive search in data
    if (item.data) {
      const found = Object.keys(item.data).find(k => k.toLowerCase() === key.toLowerCase())
      if (found) return item.data[found]
    }
    // Convenience field on item
    return (item as any)[key]
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Pipeline</h1>
          {selectedUserId && (
                <Button onClick={() => { resetForm(); setIsFormOpen(true) }} className="bg-blue-600 hover:bg-blue-700">Add item</Button>
          )}
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Manage Pipeline by User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-center">
              <div className="w-72">
                <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue placeholder={usersLoading ? "Loading users..." : "Select user"} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-white/70 text-sm mb-1">Solution</div>
                <Select value={form.solution} onValueChange={(v: PipelineSolution) => setForm((f: any) => ({ ...f, solution: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                    {solutions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {usersLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-white/80" />
              )}
            </div>

            <div className="border border-zinc-800 rounded-md overflow-x-auto">
              <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-800">
                    {essentialKeys.length > 0 ? (
                      essentialKeys.map((key) => (
                        <TableHead key={key} className="text-white/70">
                          {key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                        </TableHead>
                      ))
                    ) : (
                      // Fallback headers for visibility during empty matching
                      <>
                        <TableHead className="text-white/70">Name</TableHead>
                        <TableHead className="text-white/70">Title</TableHead>
                        <TableHead className="text-white/70">Company</TableHead>
                        <TableHead className="text-white/70">Email</TableHead>
                      </>
                    )}
                    <TableHead className="text-white/70">Stage</TableHead>
                    <TableHead className="text-white/70">Solution</TableHead>
                    <TableHead className="text-white/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell className="text-white" colSpan={(essentialKeys.length || 4) + 3}>Loading...</TableCell></TableRow>
                  ) : items.length === 0 ? (
                    <TableRow><TableCell className="text-white/70" colSpan={(essentialKeys.length || 4) + 3}>No items</TableCell></TableRow>
                  ) : (
                    items.map(item => (
                      <TableRow key={item._id} className="border-zinc-800 hover:bg-zinc-800/50">
                        {essentialKeys.length > 0 ? (
                          essentialKeys.map((key) => (
                            <TableCell key={key} className="text-white/90">{(getCellValue(item, key) ?? '-') as any}</TableCell>
                          ))
                        ) : (
                          <>
                            <TableCell className="text-white/90">{(item as any).meta?.fullName || '-'}</TableCell>
                            <TableCell className="text-white/90">{(item as any).meta?.title || '-'}</TableCell>
                            <TableCell className="text-white/90">{(item as any).meta?.company || '-'}</TableCell>
                            <TableCell className="text-white/90">{(item as any).meta?.email || '-'}</TableCell>
                          </>
                        )}
                        <TableCell className="text-white">
                          <Select value={item.stage} onValueChange={(v: PipelineStage) => item._id && handleStageChange(item._id, v)}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                              {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-white">
                          <Select value={item.solution || 'risk'} onValueChange={(v: PipelineSolution) => item._id && handleSolutionChange(item._id, v)}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                              {solutions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30" onClick={() => openDetails(item)}>Details</Button>
                            <Button size="sm" variant="outline" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" onClick={() => { setForm({ _id: item._id, userId: selectedUserId, stage: item.stage, solution: item.solution || 'risk', data: item.data || {} }); setIsFormOpen(true) }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(item._id!)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Update drawer */}
      <div className={`fixed inset-0 z-50 ${isFormOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${isFormOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsFormOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[640px] bg-zinc-900 border-l border-zinc-800 shadow-xl transition-transform ${isFormOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-white font-semibold">{form._id ? 'Edit Pipeline Item' : 'Create Pipeline Item'}</div>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-zinc-800 hover:text-white" onClick={() => setIsFormOpen(false)}>Close</Button>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(() => {
                const selectedUser = users.find(u => u.id === selectedUserId)
                const fields = selectedUser?.userType === 'workmate' ? WORKMATE_FIELDS : GENERAL_FIELDS
                return fields.map((key) => (
                  <div key={key}>
                    <Input
                      placeholder={key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      value={(form.data?.[key] ?? '') as any}
                      onChange={e => setForm((prev: any) => ({ ...prev, data: { ...(prev.data||{}), [key]: e.target.value } }))}
                    />
                  </div>
                ))
              })()}
              <div>
                <div className="text-white/70 text-sm mb-1">Stage</div>
                <Select value={form.stage} onValueChange={(v: PipelineStage) => setForm((f: any) => ({ ...f, stage: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                    {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">{form._id ? 'Save' : 'Create'}</Button>
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-zinc-800 hover:text-white" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTargetId(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-5">
              <div className="text-white text-lg font-semibold mb-2">Delete Pipeline Item</div>
              <div className="text-white/80 mb-4">Are you sure you want to delete this pipeline item? This action cannot be undone.</div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-zinc-800 hover:text-white" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
                <Button variant="destructive" disabled={isDeleting} onClick={async () => {
                  if (!deleteTargetId) return
                  try {
                    setIsDeleting(true)
                    const res = await fetch(`/api/admin/pipeline/${deleteTargetId}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error()
                    setItems(prev => prev.filter(i => i._id !== deleteTargetId))
                    setDeleteTargetId(null)
                  } catch {
                    toast.error('Failed to delete')
                  } finally {
                    setIsDeleting(false)
                  }
                }}>Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PipelineDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        item={drawerItem}
        stages={stages}
        solutions={solutions as any}
        onStageChange={(stage) => {
          if (!drawerItem?._id) return
          handleStageChange(drawerItem._id, stage)
          setDrawerItem(prev => prev ? { ...prev, stage } : prev)
        }}
        onSolutionChange={(solution) => {
          if (!drawerItem?._id) return
          handleSolutionChange(drawerItem._id, solution as PipelineSolution)
          setDrawerItem(prev => prev ? { ...prev, solution } : prev)
        }}
        onAddNote={async (comment) => {
          if (!drawerItem?._id) return
          const res = await fetch(`/api/admin/pipeline/${drawerItem._id}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment }),
          })
          if (res.ok) {
            const updated = await res.json()
            setItems(prev => prev.map(i => i._id === updated._id ? updated : i))
            setDrawerItem(updated)
          }
        }}
        allowEdit
        onSaveDetails={async (updated) => {
          if (!drawerItem?._id) return
          const res = await fetch('/api/admin/pipeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: drawerItem._id, data: updated })
          })
          if (res.ok) {
            const saved = await res.json()
            setItems(prev => prev.map(i => i._id === saved._id ? saved : i))
            setDrawerItem(saved)
          } else {
            toast.error('Failed to save details')
          }
        }}
      />
    </AdminLayout>
  )
}


