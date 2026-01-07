"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Download, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Mail, 
  Phone, 
  Users, 
  Globe, 
  LinkedinIcon, 
  DollarSign, 
  Briefcase, 
  MapPin, 
  Info, 
  User, 
  Columns3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  FilterFns,
  FilterFn,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RowDetailsDrawer } from "./row-details-drawer"

// Import the technology color functions from tech-colors.ts
import { getTechBadgeColors, getIndustryBadgeColors } from "./tech-colors"

// Define color mapping for industry badges with Tailwind classes
const INDUSTRY_COLORS: Record<string, { bg: string, text: string }> = {
  // Original mappings
  "Staffing & Recruiting": { bg: "bg-purple-100", text: "text-purple-800" },
  "Hospital & Health Care": { bg: "bg-blue-100", text: "text-blue-800" },
  "Information Technology": { bg: "bg-amber-100", text: "text-amber-800" },
  "Banking": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Nonprofit Organization": { bg: "bg-purple-100", text: "text-purple-800" },
  "Real Estate": { bg: "bg-amber-100", text: "text-amber-800" },
  
  // Additional industry mappings
  "Software": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Technology": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Healthcare": { bg: "bg-blue-100", text: "text-blue-800" },
  "Finance": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Education": { bg: "bg-sky-100", text: "text-sky-800" },
  "Manufacturing": { bg: "bg-orange-100", text: "text-orange-800" },
  "Retail": { bg: "bg-rose-100", text: "text-rose-800" },
  "Consulting": { bg: "bg-violet-100", text: "text-violet-800" },
  "Marketing": { bg: "bg-pink-100", text: "text-pink-800" },
  "Media": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  "Telecommunications": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "Transportation": { bg: "bg-lime-100", text: "text-lime-800" },
  "Construction": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "Agriculture": { bg: "bg-green-100", text: "text-green-800" },
  "Energy": { bg: "bg-teal-100", text: "text-teal-800" },
  "Legal Services": { bg: "bg-slate-100", text: "text-slate-800" },
  "Government": { bg: "bg-zinc-100", text: "text-zinc-800" },
  "Hospitality": { bg: "bg-red-100", text: "text-red-800" },
};

// Keywords to industry color mappings
const INDUSTRY_KEYWORDS: Record<string, { bg: string, text: string }> = {
  "tech": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "software": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "it": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "computer": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "digital": { bg: "bg-indigo-100", text: "text-indigo-800" },
  
  "health": { bg: "bg-blue-100", text: "text-blue-800" },
  "medical": { bg: "bg-blue-100", text: "text-blue-800" },
  "hospital": { bg: "bg-blue-100", text: "text-blue-800" },
  "care": { bg: "bg-blue-100", text: "text-blue-800" },
  "pharma": { bg: "bg-blue-100", text: "text-blue-800" },
  
  "bank": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "financ": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "invest": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "insur": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "capital": { bg: "bg-emerald-100", text: "text-emerald-800" },
  
  "edu": { bg: "bg-sky-100", text: "text-sky-800" },
  "school": { bg: "bg-sky-100", text: "text-sky-800" },
  "college": { bg: "bg-sky-100", text: "text-sky-800" },
  "university": { bg: "bg-sky-100", text: "text-sky-800" },
  "academic": { bg: "bg-sky-100", text: "text-sky-800" },
  
  "manufact": { bg: "bg-orange-100", text: "text-orange-800" },
  "industr": { bg: "bg-orange-100", text: "text-orange-800" },
  "product": { bg: "bg-orange-100", text: "text-orange-800" },
  
  "retail": { bg: "bg-rose-100", text: "text-rose-800" },
  "shop": { bg: "bg-rose-100", text: "text-rose-800" },
  "store": { bg: "bg-rose-100", text: "text-rose-800" },
  "ecommerce": { bg: "bg-rose-100", text: "text-rose-800" },
  "consumer": { bg: "bg-rose-100", text: "text-rose-800" },
  
  "consult": { bg: "bg-violet-100", text: "text-violet-800" },
  "advisor": { bg: "bg-violet-100", text: "text-violet-800" },
  "service": { bg: "bg-violet-100", text: "text-violet-800" },
  
  "market": { bg: "bg-pink-100", text: "text-pink-800" },
  "advertis": { bg: "bg-pink-100", text: "text-pink-800" },
  "brand": { bg: "bg-pink-100", text: "text-pink-800" },
  "pr": { bg: "bg-pink-100", text: "text-pink-800" },
  
  "media": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  "entertain": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  "news": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  "publish": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  "content": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
  
  "telecom": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "network": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "communication": { bg: "bg-cyan-100", text: "text-cyan-800" },
  
  "transport": { bg: "bg-lime-100", text: "text-lime-800" },
  "logistic": { bg: "bg-lime-100", text: "text-lime-800" },
  "shipping": { bg: "bg-lime-100", text: "text-lime-800" },
  "freight": { bg: "bg-lime-100", text: "text-lime-800" },
  
  "construct": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "build": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "architect": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "engineer": { bg: "bg-yellow-100", text: "text-yellow-800" },
  
  "agri": { bg: "bg-green-100", text: "text-green-800" },
  "farm": { bg: "bg-green-100", text: "text-green-800" },
  "food": { bg: "bg-green-100", text: "text-green-800" },
  
  "energy": { bg: "bg-teal-100", text: "text-teal-800" },
  "power": { bg: "bg-teal-100", text: "text-teal-800" },
  "oil": { bg: "bg-teal-100", text: "text-teal-800" },
  "gas": { bg: "bg-teal-100", text: "text-teal-800" },
  "utility": { bg: "bg-teal-100", text: "text-teal-800" },
  
  "legal": { bg: "bg-slate-100", text: "text-slate-800" },
  "law": { bg: "bg-slate-100", text: "text-slate-800" },
  "attorney": { bg: "bg-slate-100", text: "text-slate-800" },
  
  "government": { bg: "bg-zinc-100", text: "text-zinc-800" },
  "public": { bg: "bg-zinc-100", text: "text-zinc-800" },
  "federal": { bg: "bg-zinc-100", text: "text-zinc-800" },
  "state": { bg: "bg-zinc-100", text: "text-zinc-800" },
  "admin": { bg: "bg-zinc-100", text: "text-zinc-800" },
  
  "hospitality": { bg: "bg-red-100", text: "text-red-800" },
  "hotel": { bg: "bg-red-100", text: "text-red-800" },
  "restaurant": { bg: "bg-red-100", text: "text-red-800" },
  "tourism": { bg: "bg-red-100", text: "text-red-800" },
  "travel": { bg: "bg-red-100", text: "text-red-800" },
  
  "nonprofit": { bg: "bg-purple-100", text: "text-purple-800" },
  "ngo": { bg: "bg-purple-100", text: "text-purple-800" },
  "charity": { bg: "bg-purple-100", text: "text-purple-800" },
  
  "real estate": { bg: "bg-amber-100", text: "text-amber-800" },
  "property": { bg: "bg-amber-100", text: "text-amber-800" },
};

// Define color mapping for technology badges
const TECH_COLORS: Record<string, { bg: string, text: string }> = {
  // Programming languages
  "JavaScript": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "TypeScript": { bg: "bg-blue-100", text: "text-blue-800" },
  "Python": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Java": { bg: "bg-orange-100", text: "text-orange-800" },
  "C#": { bg: "bg-purple-100", text: "text-purple-800" },
  "PHP": { bg: "bg-violet-100", text: "text-violet-800" },
  "Ruby": { bg: "bg-red-100", text: "text-red-800" },
  "Go": { bg: "bg-cyan-100", text: "text-cyan-800" },
  
  // Frameworks
  "React": { bg: "bg-sky-100", text: "text-sky-800" },
  "Angular": { bg: "bg-red-100", text: "text-red-800" },
  "Vue": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Node": { bg: "bg-green-100", text: "text-green-800" },
  "Express": { bg: "bg-gray-100", text: "text-gray-800" },
  "Django": { bg: "bg-teal-100", text: "text-teal-800" },
  "Laravel": { bg: "bg-pink-100", text: "text-pink-800" },
  "Spring": { bg: "bg-lime-100", text: "text-lime-800" },
  
  // Databases
  "SQL": { bg: "bg-amber-100", text: "text-amber-800" },
  "MongoDB": { bg: "bg-green-100", text: "text-green-800" },
  "PostgreSQL": { bg: "bg-blue-100", text: "text-blue-800" },
  "MySQL": { bg: "bg-orange-100", text: "text-orange-800" },
  
  // Cloud
  "AWS": { bg: "bg-orange-100", text: "text-orange-800" },
  "Azure": { bg: "bg-blue-100", text: "text-blue-800" },
  "Google Cloud": { bg: "bg-red-100", text: "text-red-800" },
  
  // Other
  "AI": { bg: "bg-purple-100", text: "text-purple-800" },
  "Machine Learning": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Data Science": { bg: "bg-sky-100", text: "text-sky-800" },
  "DevOps": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Blockchain": { bg: "bg-amber-100", text: "text-amber-800" },
};

// Define technology keyword mappings
const TECH_KEYWORDS: Record<string, { bg: string, text: string }> = {
  // Programming languages
  "javascript": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "js": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "typescript": { bg: "bg-blue-100", text: "text-blue-800" },
  "ts": { bg: "bg-blue-100", text: "text-blue-800" },
  "python": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "py": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "java": { bg: "bg-orange-100", text: "text-orange-800" },
  "c#": { bg: "bg-purple-100", text: "text-purple-800" },
  ".net": { bg: "bg-purple-100", text: "text-purple-800" },
  "php": { bg: "bg-violet-100", text: "text-violet-800" },
  "ruby": { bg: "bg-red-100", text: "text-red-800" },
  "go": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "golang": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "rust": { bg: "bg-orange-100", text: "text-orange-800" },
  "swift": { bg: "bg-orange-100", text: "text-orange-800" },
  "kotlin": { bg: "bg-purple-100", text: "text-purple-800" },
  "scala": { bg: "bg-red-100", text: "text-red-800" },
  "r": { bg: "bg-blue-100", text: "text-blue-800" },
  "perl": { bg: "bg-blue-100", text: "text-blue-800" },
  "haskell": { bg: "bg-purple-100", text: "text-purple-800" },
  "clojure": { bg: "bg-green-100", text: "text-green-800" },
  "erlang": { bg: "bg-red-100", text: "text-red-800" },
  "elixir": { bg: "bg-purple-100", text: "text-purple-800" },
  
  // Frameworks & Libraries
  "react": { bg: "bg-sky-100", text: "text-sky-800" },
  "angular": { bg: "bg-red-100", text: "text-red-800" },
  "vue": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "svelte": { bg: "bg-orange-100", text: "text-orange-800" },
  "node": { bg: "bg-green-100", text: "text-green-800" },
  "express": { bg: "bg-gray-100", text: "text-gray-800" },
  "django": { bg: "bg-teal-100", text: "text-teal-800" },
  "flask": { bg: "bg-slate-100", text: "text-slate-800" },
  "laravel": { bg: "bg-pink-100", text: "text-pink-800" },
  "spring": { bg: "bg-lime-100", text: "text-lime-800" },
  "rails": { bg: "bg-red-100", text: "text-red-800" },
  "jquery": { bg: "bg-blue-100", text: "text-blue-800" },
  "bootstrap": { bg: "bg-purple-100", text: "text-purple-800" },
  "tailwind": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "material": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "redux": { bg: "bg-purple-100", text: "text-purple-800" },
  "graphql": { bg: "bg-pink-100", text: "text-pink-800" },
  "gatsby": { bg: "bg-purple-100", text: "text-purple-800" },
  "next": { bg: "bg-slate-100", text: "text-slate-800" },
  "nuxt": { bg: "bg-emerald-100", text: "text-emerald-800" },
  
  // Databases
  "sql": { bg: "bg-amber-100", text: "text-amber-800" },
  "mysql": { bg: "bg-blue-100", text: "text-blue-800" },
  "postgresql": { bg: "bg-blue-100", text: "text-blue-800" },
  "postgres": { bg: "bg-blue-100", text: "text-blue-800" },
  "mongodb": { bg: "bg-green-100", text: "text-green-800" },
  "mongo": { bg: "bg-green-100", text: "text-green-800" },
  "redis": { bg: "bg-red-100", text: "text-red-800" },
  "oracle": { bg: "bg-red-100", text: "text-red-800" },
  "sqlite": { bg: "bg-blue-100", text: "text-blue-800" },
  "firebase": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "dynamodb": { bg: "bg-blue-100", text: "text-blue-800" },
  "cassandra": { bg: "bg-blue-100", text: "text-blue-800" },
  "elasticsearch": { bg: "bg-yellow-100", text: "text-yellow-800" },
  
  // Cloud & DevOps
  "aws": { bg: "bg-orange-100", text: "text-orange-800" },
  "amazon": { bg: "bg-orange-100", text: "text-orange-800" },
  "azure": { bg: "bg-blue-100", text: "text-blue-800" },
  "microsoft": { bg: "bg-blue-100", text: "text-blue-800" },
  "google": { bg: "bg-red-100", text: "text-red-800" },
  "gcp": { bg: "bg-red-100", text: "text-red-800" },
  "cloud": { bg: "bg-sky-100", text: "text-sky-800" },
  "docker": { bg: "bg-sky-100", text: "text-sky-800" },
  "kubernetes": { bg: "bg-blue-100", text: "text-blue-800" },
  "k8s": { bg: "bg-blue-100", text: "text-blue-800" },
  "jenkins": { bg: "bg-red-100", text: "text-red-800" },
  "terraform": { bg: "bg-purple-100", text: "text-purple-800" },
  "ansible": { bg: "bg-red-100", text: "text-red-800" },
  "ci/cd": { bg: "bg-green-100", text: "text-green-800" },
  "devops": { bg: "bg-emerald-100", text: "text-emerald-800" },
  
  // AI & Data
  "ai": { bg: "bg-purple-100", text: "text-purple-800" },
  "ml": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "machine learning": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "deep learning": { bg: "bg-violet-100", text: "text-violet-800" },
  "data science": { bg: "bg-sky-100", text: "text-sky-800" },
  "analytics": { bg: "bg-blue-100", text: "text-blue-800" },
  "tensorflow": { bg: "bg-orange-100", text: "text-orange-800" },
  "pytorch": { bg: "bg-red-100", text: "text-red-800" },
  "pandas": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "numpy": { bg: "bg-blue-100", text: "text-blue-800" },
  "scikit": { bg: "bg-orange-100", text: "text-orange-800" },
  "nlp": { bg: "bg-green-100", text: "text-green-800" },
  "computer vision": { bg: "bg-purple-100", text: "text-purple-800" },
  
  // Other
  "blockchain": { bg: "bg-amber-100", text: "text-amber-800" },
  "crypto": { bg: "bg-amber-100", text: "text-amber-800" },
  "web3": { bg: "bg-purple-100", text: "text-purple-800" },
  "iot": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "mobile": { bg: "bg-blue-100", text: "text-blue-800" },
  "android": { bg: "bg-green-100", text: "text-green-800" },
  "ios": { bg: "bg-slate-100", text: "text-slate-800" },
  "security": { bg: "bg-red-100", text: "text-red-800" },
  "cyber": { bg: "bg-red-100", text: "text-red-800" },
  "testing": { bg: "bg-amber-100", text: "text-amber-800" },
  "qa": { bg: "bg-amber-100", text: "text-amber-800" },
  "ui": { bg: "bg-pink-100", text: "text-pink-800" },
  "ux": { bg: "bg-pink-100", text: "text-pink-800" },
  "frontend": { bg: "bg-sky-100", text: "text-sky-800" },
  "backend": { bg: "bg-indigo-100", text: "text-indigo-800" },
  "fullstack": { bg: "bg-violet-100", text: "text-violet-800" },
  "api": { bg: "bg-green-100", text: "text-green-800" },
  "rest": { bg: "bg-green-100", text: "text-green-800" },
  "soap": { bg: "bg-blue-100", text: "text-blue-800" },
  "microservice": { bg: "bg-teal-100", text: "text-teal-800" },
  "serverless": { bg: "bg-orange-100", text: "text-orange-800" },
  "saas": { bg: "bg-blue-100", text: "text-blue-800" },
  "paas": { bg: "bg-green-100", text: "text-green-800" },
  "iaas": { bg: "bg-red-100", text: "text-red-800" },
};

// Define columns that should have text truncation
const TRUNCATE_COLUMNS = [
  'address', 'website', 'company_linkedin_url', 'person_linkedin_url', 
  'company_address', 'description', 'bio', 'notes', 'summary',
  'company', 'company_name', 'account_name' // Adding company columns to truncated list
];

// Define columns that should not wrap but also not truncate
const NOWRAP_COLUMNS = [
  'first_name', 'last_name', 'full_name', 'contact_name'
  // Removed company columns as they should now be truncated
];

interface DataRow {
  [key: string]: string;  // Make it a dynamic object that can hold any string keys
}

interface DataTableProps {
  selectedFileIndex: number
  activeFilters: Record<string, string[]>
  setIsFilterOpen: (isOpen: boolean) => void
  allFilesData?: DataRow[]
  onRowClick?: (row: DataRow) => void
  renderDrawer?: (ctx: { row: DataRow | null, isOpen: boolean, onClose: () => void }) => React.ReactNode
  preferredColumns?: string[]
  enableExport?: boolean
}

// Map column names to icons
const COLUMN_ICONS: Record<string, React.ComponentType<any>> = {
  'email': Mail,
  'email_id': Mail,
  'phone': Phone,
  'contact_number': Phone,
  'contact_number_personal': Phone,
  'personal_phone': Phone,
  'company': Building2,
  'company_name': Building2,
  'account_name': Building2,
  'website': Globe,
  'linkedin': LinkedinIcon,
  'industry': Briefcase,
  'industry_client': Briefcase,
  'location': MapPin,
  'country': MapPin,
  'country_contact_person': MapPin,
  'first_name': User,
  'last_name': User,
  'contact_name': User,
  'designation': Users,
  'revenue': DollarSign,
};

// Determine which columns should be treated as links
const URL_COLUMNS = ['website', 'person_linkedin_url', 'company_linkedin_url'];

// Determine which columns might contain comma-separated values
const MULTI_VALUE_COLUMNS = ['technologies'];

// Determine if a column is an internal id column that should always be hidden
const isIdColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === '_id' || key === 'id';
}

// Function to check if a column is an industry column
const isIndustryColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === "industry" || 
         key === "industry_client" || 
         key === "industry_nexuses" ||
         key.includes("industry");
}

// Function to check if a column is an S.No. column
const isSerialNumberColumn = (columnKey: string): boolean => {
  const key = columnKey.toLowerCase();
  return key === "s_no" || 
         key === "s_no." || 
         key === "sno" || 
         key === "serial_number" ||
         key === "serial_no" ||
         key === "sl_no" ||
         key === "sl_no." ||
         key === "sr_no" ||
         key === "sr_no." ||
         key === "sr" ||
         key === "#";
}

export function DataItems({ selectedFileIndex, activeFilters, setIsFilterOpen, allFilesData, onRowClick, renderDrawer, preferredColumns, enableExport = true }: DataTableProps) {
  const [userData, setUserData] = useState<any>(null)
  const [filteredData, setFilteredData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [columnVisibilityMode, setColumnVisibilityMode] = useState<'essential' | 'all' | 'none'>('essential')
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState(false)
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [exporting, setExporting] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [exportedRecordsCount, setExportedRecordsCount] = useState(0)
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null)
  const [isRowDetailsOpen, setIsRowDetailsOpen] = useState(false)
  const dataFetchedRef = useRef(false);

  // 1. Apply filters when activeFilters change
  useEffect(() => {
    if (!userData) return;
    
    // Apply filters to the data
    let data = allFilesData || 
               (userData.dataFiles && userData.dataFiles[selectedFileIndex]?.data) || [];
    
    // Apply active filters if any
    if (Object.keys(activeFilters).length > 0) {
      data = data.filter((row: DataRow) => {
        // For each filter category
        return Object.entries(activeFilters).every(([column, allowedValues]) => {
          // If no values selected, don't filter this column
          if (!allowedValues.length) return true;
          
          // Get the value from the row
          const cellValue = row[column];
          
          // If the cell value is in the allowed values, keep the row
          return allowedValues.includes(cellValue);
        });
      });
    }
    
    setFilteredData(data);
  }, [userData, activeFilters, selectedFileIndex, allFilesData]);
  
  // 2. Fetch data when component mounts or selectedFileIndex/allFilesData changes
  useEffect(() => {
    // Reset state when component mounts or selectedFileIndex/allFilesData changes
    setLoading(true);
    setError(null);
    setFilteredData([]);
    
    const fetchData = async () => {
      try {
        // If allFilesData is provided, use it directly instead of fetching
        if (allFilesData) {
          setUserData({
            title: "All Files",
            logoUrl: "",
            credits: 0,
            dataFiles: [{
              id: "all-files",
              title: "All Files",
              filename: "all-files.csv",
              columns: [],
              data: allFilesData
            }]
          });
          setFilteredData(allFilesData);
          setLoading(false);
          return;
        }
        
        // Skip fetching if we already have userData with the right file
        if (userData && userData.dataFiles && userData.dataFiles[selectedFileIndex]) {
          setFilteredData(userData.dataFiles[selectedFileIndex].data);
          setLoading(false);
          return;
        }
        
        // Add cache-busting parameter to prevent browser caching
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/user/data?_=${cacheBuster}`, {
          // Ensure fresh data with cache control headers
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          // Add a timeout to prevent infinite loading
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        setUserData(data);
        
        // Set filtered data based on the selected file index
        if (data.dataFiles && data.dataFiles[selectedFileIndex]) {
          setFilteredData(data.dataFiles[selectedFileIndex].data);
        } else {
          setFilteredData([]);
        }
      } catch (error) {
        console.error("DataItems: Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        setFilteredData([]);
      } finally {
        setLoading(false);
        dataFetchedRef.current = true;
      }
    };
    
    // Execute the fetch only if we don't have data yet
    if (!dataFetchedRef.current || !userData) {
      fetchData();
    } else if (userData && userData.dataFiles && userData.dataFiles[selectedFileIndex]) {
      // If we already have data, just update the filtered data
      setFilteredData(userData.dataFiles[selectedFileIndex].data);
      setLoading(false);
    }
  }, [allFilesData, selectedFileIndex]);
  
  // 3. Update column visibility when data changes
  useEffect(() => {
    if (userData?.dataFiles[selectedFileIndex]?.data[0]) {
      // Get the first row to determine available columns
      const firstRow = userData.dataFiles[selectedFileIndex].data[0];
      const originalColumns = Object.keys(firstRow);
      
      // Detect if this is Workmate data
      const isWorkmateUser = originalColumns.some(col => 
        col.toLowerCase().includes('workmate') ||
        col.toLowerCase().includes('tm_remark') ||
        col.toLowerCase().includes('industry_client') ||
        col.toLowerCase().includes('industry_nexuse')
      ) || (
        originalColumns.includes('s_no') || 
        originalColumns.includes('s_no.') || 
        originalColumns.includes('account_name') || 
        originalColumns.includes('workmates_remark')
      );
      
      // Initialize visibility with essential columns only
      const initialVisibility: VisibilityState = {};
      
      // Define essential columns based on data type or preferredColumns override
      const defaultEssentials = isWorkmateUser ? [
        'contact_name',
        'designation',
        'account_name',
        'industry_client',
        'website'
      ] : [
        'first_name', 
        'last_name', 
        'title',
        'company_name', 
        'industry',
        'website',
        'email', 
        'email_id',
        'phone', 
        'personal_phone', 
        'contact_number_personal'
      ];
      const essentialColumns = (preferredColumns && preferredColumns.length > 0) ? preferredColumns : defaultEssentials;
      
      // Set visibility for essential columns
      originalColumns.forEach(col => {
        // Special handling for serial number columns - always hide them
        if (isSerialNumberColumn(col) || isIdColumn(col)) {
          initialVisibility[col] = false;
          return;
        }
        
        // Check if this column is in the essential list (case-insensitive)
        const isEssential = essentialColumns.some(
          essential => col.toLowerCase() === essential.toLowerCase()
        );
        
        initialVisibility[col] = isEssential;
      });
      
      setColumnVisibility(initialVisibility);
      setColumnVisibilityMode('essential');
    }
  }, [userData, selectedFileIndex]);
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <Card className="border border-gray-100 rounded-xl shadow-sm w-full bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Card className="border border-gray-100 rounded-xl shadow-sm w-full bg-white">
        <CardContent className="p-6">
          <div className="text-center py-6 text-red-500">
            <p>Error loading data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no data, show message
  if (!userData || !userData.dataFiles[selectedFileIndex]) {
    return (
      <Card className="border border-gray-100 rounded-xl shadow-sm w-full bg-white">
        <CardContent className="p-6">
          <div className="text-center py-6">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // After this point, we know userData and filteredData are available
  
  // Create a TableComponent that handles all the table-specific logic
  return <TableComponent 
    userData={userData} 
    selectedFileIndex={selectedFileIndex}
    filteredData={filteredData}
    preferredColumns={preferredColumns}
    enableExport={enableExport}
    sorting={sorting}
    setSorting={setSorting}
    columnFilters={columnFilters}
    setColumnFilters={setColumnFilters}
    rowSelection={rowSelection}
    setRowSelection={setRowSelection}
    globalFilter={globalFilter}
    setGlobalFilter={setGlobalFilter}
    columnVisibility={columnVisibility}
    setColumnVisibility={setColumnVisibility}
    pageSize={pageSize}
    setPageSize={setPageSize}
    pageIndex={pageIndex}
    setPageIndex={setPageIndex}
    columnVisibilityMode={columnVisibilityMode}
    setColumnVisibilityMode={setColumnVisibilityMode}
    showExportConfirm={showExportConfirm}
    setShowExportConfirm={setShowExportConfirm}
    showNoSelectionWarning={showNoSelectionWarning}
    setShowNoSelectionWarning={setShowNoSelectionWarning}
    exportFormat={exportFormat}
    setExportFormat={setExportFormat}
    exporting={exporting}
    setExporting={setExporting}
    showExportSuccess={showExportSuccess}
    setShowExportSuccess={setShowExportSuccess}
    exportedRecordsCount={exportedRecordsCount}
    setExportedRecordsCount={setExportedRecordsCount}
    selectedRow={selectedRow}
    setSelectedRow={setSelectedRow}
    isRowDetailsOpen={isRowDetailsOpen}
    setIsRowDetailsOpen={setIsRowDetailsOpen}
    setIsFilterOpen={setIsFilterOpen}
    activeFilters={activeFilters}
    setUserData={setUserData}
    onRowClick={onRowClick}
    renderDrawer={renderDrawer}
  />;
}

// Separate component to handle table logic
function TableComponent({
  userData,
  selectedFileIndex,
  filteredData,
  preferredColumns,
  enableExport = true,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
  rowSelection,
  setRowSelection,
  globalFilter,
  setGlobalFilter,
  columnVisibility,
  setColumnVisibility,
  pageSize,
  setPageSize,
  pageIndex,
  setPageIndex,
  columnVisibilityMode,
  setColumnVisibilityMode,
  showExportConfirm,
  setShowExportConfirm,
  showNoSelectionWarning,
  setShowNoSelectionWarning,
  exportFormat,
  setExportFormat,
  exporting,
  setExporting,
  showExportSuccess,
  setShowExportSuccess,
  exportedRecordsCount,
  setExportedRecordsCount,
  selectedRow,
  setSelectedRow,
  isRowDetailsOpen,
  setIsRowDetailsOpen,
  setIsFilterOpen,
  activeFilters,
  setUserData,
  onRowClick,
  renderDrawer
}: {
  userData: any;
  selectedFileIndex: number;
  filteredData: DataRow[];
  preferredColumns?: string[];
  enableExport?: boolean;
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  rowSelection: any;
  setRowSelection: React.Dispatch<React.SetStateAction<{}>>;
  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  columnVisibilityMode: 'essential' | 'all' | 'none';
  setColumnVisibilityMode: React.Dispatch<React.SetStateAction<'essential' | 'all' | 'none'>>;
  showExportConfirm: boolean;
  setShowExportConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  showNoSelectionWarning: boolean;
  setShowNoSelectionWarning: React.Dispatch<React.SetStateAction<boolean>>;
  exportFormat: 'xlsx' | 'csv';
  setExportFormat: React.Dispatch<React.SetStateAction<'xlsx' | 'csv'>>;
  exporting: boolean;
  setExporting: React.Dispatch<React.SetStateAction<boolean>>;
  showExportSuccess: boolean;
  setShowExportSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  exportedRecordsCount: number;
  setExportedRecordsCount: React.Dispatch<React.SetStateAction<number>>;
  selectedRow: DataRow | null;
  setSelectedRow: React.Dispatch<React.SetStateAction<DataRow | null>>;
  isRowDetailsOpen: boolean;
  setIsRowDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFilterOpen: (isOpen: boolean) => void;
  activeFilters: Record<string, string[]>;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  onRowClick?: (row: DataRow) => void;
  renderDrawer?: (ctx: { row: DataRow | null, isOpen: boolean, onClose: () => void }) => React.ReactNode;
}) {
  const selectedFile = userData.dataFiles[selectedFileIndex];
  
  // Define columns for the table
  const columns = userData?.dataFiles[selectedFileIndex]?.data[0]
    ? Object.keys(userData.dataFiles[selectedFileIndex].data[0]).map((key): ColumnDef<DataRow> => {
        // Handle the special case for s_no. column
        const columnId = key === 's_no.' ? 's_no' : key;
        
        // Special handling for s_no/s_no. columns - always hide them
        const isSNoColumn = isSerialNumberColumn(key);
        
        // If this is an S.No. column, update the visibility state to hide it
        if (isSNoColumn && columnVisibility[columnId] !== false) {
          // Schedule an update to hide this column
          setTimeout(() => {
            setColumnVisibility(prev => ({
              ...prev,
              [columnId]: false
            }));
          }, 0);
        }
        
        // Determine column order based on workmate data schema
        let columnOrder = 1000; // Default high number for columns not in the priority list
        
        // Check if this is workmate data
        const isWorkmateUser = Object.keys(userData.dataFiles[selectedFileIndex].data[0]).some(col => 
          col.toLowerCase().includes('workmate') ||
          col.toLowerCase().includes('tm_remark') ||
          col.toLowerCase().includes('industry_client')
        );
        
        if (isWorkmateUser) {
          // Define the order for workmate columns
          const orderMap: Record<string, number> = {
            'contact_name': 1,
            'designation': 2,
            'account_name': 3,
            'industry_client': 4,
            'website': 5,
            'email_id': 6,
            'contact_number_personal': 7,
            'person_linkedin_url': 8,
            'company_linkedin_url': 9,
            'technologies': 10,
            'country_contact_person': 11,
            'city': 12,
            'state': 13,
            'company_address': 14,
            'company_headquarter': 15,
            'workmates_remark': 16,
            'tm_remarks': 17
          };
          
          // Find the order for this column (case-insensitive)
          const lowerKey = key.toLowerCase();
          for (const [orderKey, orderValue] of Object.entries(orderMap)) {
            if (lowerKey === orderKey.toLowerCase()) {
              columnOrder = orderValue;
              break;
            }
          }
        } else {
          // Define the order for general user columns
          const orderMap: Record<string, number> = {
            'first_name': 1,
            'last_name': 2,
            'title': 3,
            'company_name': 4,
            'industry': 5,
            'website': 6,
            'email': 7,
            'personal_phone': 8,
            'company_phone': 9,
            'person_linkedin_url': 10,
            'technologies': 11
          };
          
          // Find the order for this column (case-insensitive)
          const lowerKey = key.toLowerCase();
          for (const [orderKey, orderValue] of Object.entries(orderMap)) {
            if (lowerKey === orderKey.toLowerCase()) {
              columnOrder = orderValue;
              break;
            }
          }
        }
        
        return {
          accessorKey: key,
          id: columnId, // Use consistent ID for s_no/s_no.
          header: () => {
            // Get the appropriate icon for this column
            const IconComponent = COLUMN_ICONS[columnId.toLowerCase()];
            
            return (
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">
                  {columnId.replace(/_/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
            );
          },
          cell: ({ row }) => {
            // Get value directly from row.original to avoid any issues
            const value = row.original[key];
            const lowerKey = key.toLowerCase();
            const toTitle = (s: string) => String(s || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const stageColor = (s: string) => {
              const k = String(s || '').toLowerCase();
              if (k === 'hot') return 'bg-red-100 text-red-800';
              if (k === 'meeting scheduled') return 'bg-yellow-100 text-yellow-800';
              if (k === 'meeting done') return 'bg-green-100 text-green-800';
              if (k === 'opportunity') return 'bg-blue-100 text-blue-800';
              return 'bg-gray-100 text-gray-800';
            };
            const solutionColor = (s: string) => {
              const k = String(s || '').toLowerCase();
              if (k === 'risk') return 'bg-purple-100 text-purple-800';
              if (k === 'cyber training') return 'bg-amber-100 text-amber-800';
              if (k === 'cyber advisory') return 'bg-indigo-100 text-indigo-800';
              return 'bg-gray-100 text-gray-800';
            };
            
            // Skip rendering if no value
            if (!value) return null;
            
            // Stage and Solution badges
            if (lowerKey === 'stage') {
              return <Badge className={`${stageColor(String(value))} font-medium`}>{toTitle(String(value))}</Badge> as any;
            }
            if (lowerKey === 'solution') {
              return <Badge className={`${solutionColor(String(value))} font-medium`}>{toTitle(String(value))}</Badge> as any;
            }

            // Handle industry columns with badges
            if (isIndustryColumn(key)) {
              const colors = getIndustryBadgeColors(value);
              return (
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] ${colors.bg} ${colors.text}`}
                  title={value} // Show full text on hover
                >
                  {value}
                </span>
              );
            }
            
            // Handle URL columns
            if (URL_COLUMNS.includes(key.toLowerCase()) && value) {
              return (
                <a 
                  href={value.startsWith('http') ? value : `https://${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px] inline-block"
                  title={value} // Show full URL on hover
                >
                  {value}
                </a>
              );
            }
            
            // Handle email columns
            if (key.toLowerCase().includes('email') && value) {
              return <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] inline-block" title={value}>{value}</span>;
            }
            
            // Handle phone columns - keep monospace for numbers
            if ((key.toLowerCase().includes('phone') || 
                key.toLowerCase().includes('contact_number')) && value) {
              return <span className="font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] inline-block" title={value}>{value}</span>;
            }
            
            // Handle multi-value columns (like technologies)
            if (MULTI_VALUE_COLUMNS.includes(key.toLowerCase()) && value && value.includes(',')) {
              const values = value.split(',').map(v => v.trim()).filter(Boolean);
              
              return (
                <div className="flex items-center whitespace-nowrap">
                  {values.slice(0, 2).map((val, i) => {
                    const colors = getTechBadgeColors(val);
                    return (
                      <span 
                        key={i}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1 overflow-hidden text-ellipsis max-w-[120px] ${colors.bg} ${colors.text}`}
                        title={val} // Show full text on hover
                      >
                        {val}
                      </span>
                    );
                  })}
                  {values.length > 2 && (
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-500"
                    >
                      +{values.length - 2}
                    </span>
                  )}
                </div>
              );
            }
            
            // Handle columns that should be truncated
            if (TRUNCATE_COLUMNS.some(col => key.toLowerCase().includes(col)) && value) {
              return (
                <div 
                  className="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]" 
                  title={value} // Show full text on hover
                >
                  {value}
                </div>
              );
            }
            
            // Handle columns that should not wrap but also not truncate (names, company)
            if (NOWRAP_COLUMNS.some(col => key.toLowerCase().includes(col)) && value) {
              return (
                <div className="font-medium text-gray-800 whitespace-nowrap">
                  {value}
                </div>
              );
            }
            
            // Check if the value is numeric
            const isNumeric = !isNaN(Number(value)) && !isNaN(parseFloat(value));
            
            // Default rendering - prevent wrapping for all other columns
            // Use monospace font only for numeric values
            return <div className={`font-medium text-gray-800 whitespace-nowrap ${isNumeric ? 'font-mono' : ''}`}>{value}</div>;
          },
          // Add meta property for column ordering
          meta: {
            order: columnOrder
          }
        };
      }).sort((a, b) => {
        // Sort columns based on their order property
        const orderA = (a.meta as any)?.order || 1000;
        const orderB = (b.meta as any)?.order || 1000;
        return orderA - orderB;
      })
    : [];
    
  // Use filtered data for the table
  const data = filteredData;
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    filterFns: {} as any, // Minimal implementation to satisfy TypeScript
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' 
        ? updater({ pageIndex, pageSize }) 
        : updater;
      
      setPageIndex(newState.pageIndex);
      setPageSize(newState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  const handleExport = () => {
    if (table.getSelectedRowModel().rows.length === 0) {
      setShowNoSelectionWarning(true);
      return;
    }
    
    // Check if user has enough credits
    if (userData && userData.credits < table.getSelectedRowModel().rows.length) {
      alert(`Not enough credits! You need ${table.getSelectedRowModel().rows.length} credits but only have ${userData.credits}`);
      return;
    }
    
    setShowExportConfirm(true);
  };

  // Add utility functions for row selection
  const selectAllRows = () => {
    const newSelection: Record<string, boolean> = {};
    // Select all filtered rows across all pages (not just current page)
    filteredData.forEach((row, index) => {
      newSelection[index] = true;
    });
    setRowSelection(newSelection);
  };

  const deselectAllRows = () => {
    setRowSelection({});
  };

  // Add a function to toggle all rows selection
  const toggleAllRowsSelection = () => {
    // Check if all filtered rows are selected
    const allSelected = 
      table.getFilteredRowModel().rows.length > 0 &&
      table.getFilteredSelectedRowModel().rows.length === table.getFilteredRowModel().rows.length;
    
    if (allSelected) {
      deselectAllRows();
    } else {
      selectAllRows();
    }
  };
  
  return (
    <>
      <Card className="border-none shadow-none w-full bg-white">
        <CardContent className="p-0">
          {/* Title and Actions - Reduced padding */}
          <div className="p-3 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between">
              <div>
                {selectedFile.title !== 'All Files' && (
                  <h1 className="text-xl font-semibold text-[#111827]">{selectedFile.title}</h1>
                )}
                <p className="text-sm text-[#6B7280] mt-0.5">
                  {table.getFilteredRowModel().rows.length} leads total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-8 border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
                >
                  <Filter className="w-4 h-4 mr-1.5" />
                  {Object.keys(activeFilters).length > 0 
                    ? `Filters (${Object.keys(activeFilters).length})` 
                    : "Filters"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    >
                      <Columns3 className="w-4 h-4 mr-1.5" />
                      Columns
                      <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-[#F3F4F6] shadow-md rounded-md w-56">
                    <DropdownMenuLabel className="text-sm text-[#6B7280] font-normal">Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#F3F4F6]" />
                    
                    {/* Quick selection options */}
                    <div className="p-2 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[#6B7280]">Presets</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button 
                          variant={columnVisibilityMode === 'essential' ? 'default' : 'outline'}
                          size="sm" 
                          className={`h-7 text-xs ${
                            columnVisibilityMode === 'essential' 
                              ? 'bg-[#111827] text-white hover:bg-[#374151]' 
                              : 'border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB]'
                          }`}
                          onClick={() => {
                            // Get the first row to determine data type
                            const firstRow = userData?.dataFiles[selectedFileIndex]?.data[0];
                            if (!firstRow) return;
                            
                            const originalColumns = Object.keys(firstRow);
                            
                            // Detect if this is Workmate data
                            const isWorkmateUser = originalColumns.some(col => 
                              col.toLowerCase().includes('workmate') ||
                              col.toLowerCase().includes('tm_remark') ||
                              col.toLowerCase().includes('industry_client') ||
                              col.toLowerCase().includes('industry_nexuse')
                            ) || (
                              originalColumns.includes('s_no') || 
                              originalColumns.includes('s_no.') || 
                              originalColumns.includes('account_name') || 
                              originalColumns.includes('workmates_remark')
                            );
                            
                            // Define essential columns based on data type or preferredColumns override
                            const defaultEssentials = isWorkmateUser ? [
                              'contact_name',
                              'designation',
                              'account_name',
                              'industry_client',
                              'website'
                            ] : [
                              'first_name', 
                              'last_name', 
                              'title',
                              'company_name', 
                              'industry',
                              'website',
                              'email', 
                              'email_id',
                              'phone', 
                              'personal_phone', 
                              'contact_number_personal'
                            ];
                            const essentialColumns = (preferredColumns && preferredColumns.length > 0) ? preferredColumns : defaultEssentials;
                            
                            const presetVisibility: VisibilityState = {};
                            
                            // Set visibility for all columns
                            table.getAllLeafColumns().forEach(column => {
                              // Special handling for serial number columns - always hide them
                              if (isSerialNumberColumn(column.id)) {
                                presetVisibility[column.id] = false;
                                return;
                              }
                              
                              // Check if this column is in the essential list (case-insensitive)
                              const isEssential = essentialColumns.some(
                                essential => column.id.toLowerCase() === essential.toLowerCase()
                              );
                              
                              presetVisibility[column.id] = isEssential;
                            });
                            
                            // Log the visibility state to debug
                            console.log('Essential Only button clicked. New visibility:', presetVisibility);
                            
                            setColumnVisibilityMode('essential');
                            table.setColumnVisibility(presetVisibility);
                          }}
                        >
                          Essential Only
                        </Button>
                        <Button 
                          variant={columnVisibilityMode === 'all' ? 'default' : 'outline'}
                          size="sm" 
                          className={`h-7 text-xs ${
                            columnVisibilityMode === 'all' 
                              ? 'bg-[#111827] text-white hover:bg-[#374151]' 
                              : 'border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB]'
                          }`}
                          onClick={() => {
                            const presetVisibility: VisibilityState = {};
                            table.getAllLeafColumns().forEach(column => {
                              // Even when showing all columns, hide S.No. and id columns
                              if (isSerialNumberColumn(column.id) || isIdColumn(column.id)) {
                                presetVisibility[column.id] = false;
                              } else {
                                presetVisibility[column.id] = true;
                              }
                            });
                            setColumnVisibilityMode('all');
                            table.setColumnVisibility(presetVisibility);
                          }}
                        >
                          Show All
                        </Button>
                        <Button 
                          variant={columnVisibilityMode === 'none' ? 'default' : 'outline'}
                          size="sm" 
                          className={`h-7 text-xs ${
                            columnVisibilityMode === 'none' 
                              ? 'bg-[#111827] text-white hover:bg-[#374151]' 
                              : 'border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB]'
                          }`}
                          onClick={() => {
                            const presetVisibility: VisibilityState = {};
                            table.getAllLeafColumns().forEach(column => {
                              presetVisibility[column.id] = false;
                            });
                            setColumnVisibilityMode('none');
                            table.setColumnVisibility(presetVisibility);
                          }}
                        >
                          Hide All
                        </Button>
                      </div>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-[#F3F4F6] my-1" />
                    
                    <div className="max-h-[400px] overflow-y-auto p-2">
                      {table.getAllLeafColumns().filter(c => c.id !== '_id' && c.id !== 'id').map(column => (
                        <div key={column.id} className="py-1.5 px-1 flex items-center space-x-2">
                          <Checkbox
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            id={`column-${column.id}`}
                            className="h-4 w-4 rounded border-[#9CA3AF]"
                          />
                          <label 
                            htmlFor={`column-${column.id}`}
                            className="text-sm text-[#374151] cursor-pointer"
                          >
                            {column.id.replace(/_/g, ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Export button (optional) */}
                {enableExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-8 border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    {table.getSelectedRowModel().rows.length > 0 
                      ? `Export (${table.getSelectedRowModel().rows.length})` 
                      : "Export"}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mt-3 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 h-8 border-[#F3F4F6] focus:border-[#9CA3AF] focus:ring-[#F3F4F6]"
              />
            </div>
          </div>

          {/* Table Container - Reduced padding */}
          <div className="p-2">
            <div className="overflow-hidden rounded-md border border-[#F3F4F6] shadow-sm">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="border-[#F3F4F6] hover:bg-transparent">
                      <TableHead className="w-12 pl-6">
                        <Checkbox
                          checked={
                            table.getFilteredRowModel().rows.length > 0 &&
                            table.getFilteredSelectedRowModel().rows.length === table.getFilteredRowModel().rows.length
                          }
                          onCheckedChange={toggleAllRowsSelection}
                          className="border-[#9CA3AF]"
                        />
                      </TableHead>
                      {table.getHeaderGroups()[0].headers.map((header) => (
                        <TableHead 
                          key={header.id}
                          className="font-medium text-[#374151] whitespace-nowrap"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center gap-2",
                                header.column.getCanSort() && "cursor-pointer select-none"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                          data-state={row.getIsSelected() && "selected"}
                          onClick={() => {
                            if (onRowClick) {
                              onRowClick(row.original)
                            } else {
                              setSelectedRow(row.original);
                              setIsRowDetailsOpen(true);
                            }
                          }}
                        >
                          <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={row.getIsSelected()}
                              onCheckedChange={(value) => row.toggleSelected(!!value)}
                              className="border-[#9CA3AF]"
                            />
                          </TableCell>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={table.getAllColumns().length + 1}
                          className="h-24 text-center text-[#6B7280]"
                        >
                          No results found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Pagination - Reduced padding */}
          <div className="px-2 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <span>Rows per page:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[#374151] hover:bg-[#F9FAFB]">
                    {pageSize}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white border border-[#F3F4F6]">
                  {[10, 25, 50, 100].map((size) => (
                    <DropdownMenuItem 
                      key={size} 
                      onClick={() => {
                        table.setPagination({
                          pageSize: size,
                          pageIndex: 0, // Reset to first page when changing page size
                        });
                      }}
                      className="text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-sm text-[#6B7280]">
                {table.getSelectedRowModel().rows.length > 0 && (
                  <span className="mr-4 font-medium">
                    {table.getSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected
                  </span>
                )}
                <span>
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )} of {table.getFilteredRowModel().rows.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 p-0 text-[#374151] hover:bg-[#F9FAFB]",
                    !table.getCanPreviousPage() && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => {
                    if (table.getCanPreviousPage()) {
                      table.setPagination({
                        pageIndex: pageIndex - 1,
                        pageSize,
                      });
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                  const pageCount = table.getPageCount();
                  const currentPage = table.getState().pagination.pageIndex;
                  let pageButtonIndex;
                  
                  if (pageCount <= 5) {
                    // If we have 5 or fewer pages, show all
                    pageButtonIndex = i;
                  } else if (currentPage < 2) {
                    // If we're near the start, show first 3, ellipsis, last
                    if (i < 3) {
                      pageButtonIndex = i;
                    } else if (i === 3) {
                      return (
                        <span key="ellipsis-1" className="px-2 text-[#9CA3AF]">...</span>
                      );
                    } else {
                      pageButtonIndex = pageCount - 1;
                    }
                  } else if (currentPage > pageCount - 3) {
                    // If we're near the end, show first, ellipsis, last 3
                    if (i === 0) {
                      pageButtonIndex = 0;
                    } else if (i === 1) {
                      return (
                        <span key="ellipsis-2" className="px-2 text-[#9CA3AF]">...</span>
                      );
                    } else {
                      pageButtonIndex = pageCount - (5 - i);
                    }
                  } else {
                    // We're in the middle, show first, ellipsis, current & neighbors, ellipsis, last
                    if (i === 0) {
                      pageButtonIndex = 0;
                    } else if (i === 1) {
                      return (
                        <span key="ellipsis-3" className="px-2 text-[#9CA3AF]">...</span>
                      );
                    } else if (i === 4) {
                      pageButtonIndex = pageCount - 1;
                    } else if (i === 3) {
                      return (
                        <span key="ellipsis-4" className="px-2 text-[#9CA3AF]">...</span>
                      );
                    } else {
                      pageButtonIndex = currentPage;
                    }
                  }
                  
                  return (
                    <Button 
                      key={pageButtonIndex} 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-8 px-3",
                        pageButtonIndex === currentPage && "bg-[#F9FAFB] text-[#111827]",
                        pageButtonIndex !== currentPage && "text-[#374151] hover:bg-[#F9FAFB]"
                      )}
                      onClick={() => table.setPagination({
                        pageIndex: pageButtonIndex,
                        pageSize,
                      })}
                    >
                      {pageButtonIndex + 1}
                    </Button>
                  );
                })}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 p-0 text-[#374151] hover:bg-[#F9FAFB]",
                    !table.getCanNextPage() && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => {
                    if (table.getCanNextPage()) {
                      table.setPagination({
                        pageIndex: pageIndex + 1,
                        pageSize,
                      });
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Row Details Drawer (customizable) */}
      {renderDrawer ? (
        renderDrawer({ row: selectedRow, isOpen: isRowDetailsOpen, onClose: () => setIsRowDetailsOpen(false) })
      ) : (
        <RowDetailsDrawer 
          isOpen={isRowDetailsOpen}
          onClose={() => setIsRowDetailsOpen(false)}
          rowData={selectedRow}
        />
      )}
      
      {/* No Selection Warning Dialog */}
      {enableExport && (
      <Dialog open={showNoSelectionWarning} onOpenChange={setShowNoSelectionWarning}>
        <DialogContent className="bg-white border border-[#F3F4F6] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">No Records Selected</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Please select at least one record to export.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setShowNoSelectionWarning(false)}
              className="bg-[#111827] text-white hover:bg-[#374151]"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Export Confirmation Dialog */}
      {enableExport && (
      <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <DialogContent className="bg-white border border-[#F3F4F6] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Confirm Export</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Please review the export details before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(userData.credits < table.getSelectedRowModel().rows.length) ? (
              <Alert className="border-red-100 bg-red-50">
                <AlertTitle className="text-red-800">Insufficient Credits</AlertTitle>
                <AlertDescription className="text-red-700">
                  You don't have enough credits to export {table.getSelectedRowModel().rows.length} records.
                  Please contact your admin to get more credits.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-[#F3F4F6] bg-[#F9FAFB]">
                <AlertTitle className="text-[#111827]">Credit Information</AlertTitle>
                <AlertDescription className="text-[#374151]">
                  This export will cost {table.getSelectedRowModel().rows.length} credits.
                  You currently have {userData.credits} credits available.
                </AlertDescription>
              </Alert>
            )}
            <div className="text-sm text-[#6B7280] space-y-2">
              <div className="flex justify-between">
                <span>Current Credits:</span>
                <span className="font-medium">{userData.credits}</span>
              </div>
              <div className="flex justify-between">
                <span>Export Cost:</span>
                <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
              </div>
              <div className="flex justify-between border-t border-[#F3F4F6] pt-2">
                <span>Remaining Credits:</span>
                <span className={`font-medium ${userData.credits < table.getSelectedRowModel().rows.length ? 'text-red-500' : 'text-green-500'}`}>
                  {userData.credits - table.getSelectedRowModel().rows.length}
                </span>
              </div>
              
              {/* Add format selection */}
              <div className="flex justify-between items-center border-t border-[#F3F4F6] pt-3 mt-3">
                <span>Export Format:</span>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'xlsx' | 'csv')}>
                  <SelectTrigger className="w-32 h-8 text-sm border-[#F3F4F6]">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#F3F4F6]">
                    <SelectGroup>
                      <SelectItem value="xlsx" className="text-sm">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv" className="text-sm">CSV (.csv)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExportConfirm(false)}
              className="border-[#F3F4F6] text-[#374151] hover:bg-[#F9FAFB]"
            >
              Cancel
            </Button>
            <Button 
              disabled={userData.credits < table.getSelectedRowModel().rows.length}
              className="bg-[#111827] text-white hover:bg-[#374151] disabled:bg-[#9CA3AF]"
              onClick={async () => {
                setExporting(true);
                try {
                  // First deduct credits
                  console.log("Starting export process...");
                  console.log(`Exporting ${table.getSelectedRowModel().rows.length} records in ${exportFormat} format`);
                  
                  const creditResponse = await fetch('/api/user/credits', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      credits: -table.getSelectedRowModel().rows.length
                    }),
                  });

                  if (!creditResponse.ok) {
                    throw new Error('Failed to update credits');
                  }

                  // Get the selected row indices
                  const selectedIndices = table.getSelectedRowModel().rows.map(row => {
                    // Get the actual index of the row in the original data array
                    return filteredData.indexOf(row.original);
                  }).filter(index => index !== -1); // Filter out any -1 values
                  
                  console.log("Selected indices:", selectedIndices);
                  
                  // Check if we have valid indices
                  if (selectedIndices.length === 0) {
                    throw new Error("No valid indices found for the selected rows");
                  }
                  
                  // Then trigger the export
                  console.log("Sending export request...");
                  const exportResponse = await fetch('/api/user/export', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'selected',
                      format: exportFormat, // Use the selected format
                      selectedRecords: table.getSelectedRowModel().rows.length,
                      selectedIndices: selectedIndices
                    }),
                  });

                  if (!exportResponse.ok) {
                    // Try to get detailed error message
                    let errorMessage = 'Failed to export data';
                    try {
                      const errorData = await exportResponse.json();
                      console.error("Export API error:", errorData);
                      if (errorData && errorData.error) {
                        errorMessage = `Export failed: ${errorData.error}`;
                        if (errorData.details) {
                          errorMessage += ` (${errorData.details})`;
                        }
                      }
                    } catch (e) {
                      // If we can't parse the error response, use the default message
                    }
                    throw new Error(errorMessage);
                  }

                  // Get the blob from the response
                  const blob = await exportResponse.blob();
                  
                  // Create a download link
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `exported_data.${exportFormat}`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  // Refresh user data to update credits
                  const userResponse = await fetch("/api/user/data");
                  if (userResponse.ok) {
                    const data = await userResponse.json();
                    setUserData(data); // Update the entire user data to ensure UI is in sync
                  }

                  // Clear row selection after successful export
                  table.resetRowSelection();
                  
                  // Store the count of exported records for the success message
                  setExportedRecordsCount(table.getSelectedRowModel().rows.length);
                  
                  setShowExportConfirm(false);
                  setExporting(false);
                  setShowExportSuccess(true);
                } catch (error) {
                  console.error('Export error:', error);
                  // Refund the credits since export failed
                  try {
                    await fetch('/api/user/credits', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        credits: table.getSelectedRowModel().rows.length // Add back the credits
                      }),
                    });
                    
                    // Refresh user data to update credits display
                    const userResponse = await fetch("/api/user/data");
                    if (userResponse.ok) {
                      const data = await userResponse.json();
                      setUserData(data);
                    }
                  } catch (refundError) {
                    console.error('Failed to refund credits:', refundError);
                  }
                  
                  alert(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
                  setShowExportConfirm(false);
                  setExporting(false);
                }
              }}
            >
              {exporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Exporting...
                </>
              ) : (
                "Export"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Export Success Dialog */}
      {enableExport && (
      <Dialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
        <DialogContent className="bg-white border border-[#F3F4F6] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Export Successful</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Your data has been exported successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Alert className="border-green-100 bg-green-50">
              <AlertTitle className="text-green-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Export Complete
              </AlertTitle>
              <AlertDescription className="text-green-700">
                {exportedRecordsCount} records have been exported to {exportFormat.toUpperCase()} format.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowExportSuccess(false)}
              className="bg-[#111827] text-white hover:bg-[#374151]"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
} 