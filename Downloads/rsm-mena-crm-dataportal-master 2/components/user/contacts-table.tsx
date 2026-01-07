"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Search,
  Filter,
  Columns3,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
} from "lucide-react"

const contacts = [
  {
    id: 1,
    firstName: "Ali",
    lastName: "Rentschler",
    company: "Hirewell",
    email: "ali@hirewell.com",
    phone: "+1 312-496-7955",
    industry: "Staffing & Recruiting",
    industryColor: "bg-purple-100 text-purple-800",
  },
  {
    id: 2,
    firstName: "Kareen",
    lastName: "Simon",
    company: "WVU Medicine",
    email: "kareen.simon@wvumedicine.org",
    phone: "855-988-2273",
    industry: "Hospital & Health Care",
    industryColor: "bg-blue-100 text-blue-800",
  },
  {
    id: 3,
    firstName: "Ryan",
    lastName: "Douglas",
    company: "Digital River",
    email: "rdouglas@digitalriver.com",
    phone: "+1 952-225-3210",
    industry: "Information Technology",
    industryColor: "bg-yellow-100 text-yellow-800",
  },
  {
    id: 4,
    firstName: "Kent",
    lastName: "Riddle",
    company: "Mary Free Bed Rehabilitation Hospital",
    email: "kent.riddle@maryfreebedrehab.com",
    phone: "+1 800-528-8989",
    industry: "Hospital & Health Care",
    industryColor: "bg-blue-100 text-blue-800",
  },
  {
    id: 5,
    firstName: "Jeff",
    lastName: "Scheuren",
    company: "Fulton Bank",
    email: "jscheuren@fultonbank.com",
    phone: "+1 717-291-2411",
    industry: "Banking",
    industryColor: "bg-green-100 text-green-800",
  },
  {
    id: 6,
    firstName: "Danish",
    lastName: "Qureshi",
    company: "LifeStance Health",
    email: "danish.qureshi@lifestancehealth.com",
    phone: "+1 425-279-8500",
    industry: "Hospital & Health Care",
    industryColor: "bg-blue-100 text-blue-800",
  },
  {
    id: 7,
    firstName: "Valerie",
    lastName: "Waller",
    company: "YM",
    email: "valerie.waller@ymca.net",
    phone: "+1 719-329-7208",
    industry: "Nonprofit Organization",
    industryColor: "bg-indigo-100 text-indigo-800",
  },
  {
    id: 8,
    firstName: "Teresa",
    lastName: "Phelps",
    company: "MCS",
    email: "teresa.phelps@mcs360.com",
    phone: "+1 813-387-1100",
    industry: "Real Estate",
    industryColor: "bg-orange-100 text-orange-800",
  },
]

export default function ContactsTable() {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((contact) => contact.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    }
  }

  const filteredContacts = contacts.filter((contact) =>
    Object.values(contact).some((value) => value.toString().toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Files
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Title and Actions */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">All Contacts</h1>
                <p className="text-sm text-gray-500 mt-1">{filteredContacts.length} contacts total</p>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Industry</DropdownMenuItem>
                    <DropdownMenuItem>Company Size</DropdownMenuItem>
                    <DropdownMenuItem>Location</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns3 className="w-4 h-4 mr-2" />
                      Columns
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Show/Hide Columns</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="w-12 pl-6">
                    <Checkbox
                      checked={selectedContacts.length === contacts.length}
                      onCheckedChange={handleSelectAll}
                      className="border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">Name</TableHead>
                  <TableHead className="font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company
                    </div>
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">Industry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        className="border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-700">{contact.company}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-600 font-mono text-sm">{contact.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-600 font-mono text-sm">{contact.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${contact.industryColor} border-0 font-medium text-xs`}>
                        {contact.industry}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    10
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>10</DropdownMenuItem>
                  <DropdownMenuItem>25</DropdownMenuItem>
                  <DropdownMenuItem>50</DropdownMenuItem>
                  <DropdownMenuItem>100</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600">
                {selectedContacts.length > 0 && (
                  <span className="mr-4 font-medium">
                    {selectedContacts.length} of {filteredContacts.length} selected
                  </span>
                )}
                <span>
                  1-{Math.min(10, filteredContacts.length)} of {filteredContacts.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 bg-gray-100 text-gray-900">
                  1
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3">
                  2
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3">
                  3
                </Button>
                <span className="px-2 text-gray-400">...</span>
                <Button variant="ghost" size="sm" className="h-8 px-3">
                  306
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
