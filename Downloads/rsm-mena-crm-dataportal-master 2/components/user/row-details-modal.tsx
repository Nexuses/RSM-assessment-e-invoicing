import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface RowDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rowData: any
}

// Simple text-based icons for different field types
const FIELD_ICONS: Record<string, string> = {
  // Contact information
  contact_name: "👤",
  name: "👤",
  contact: "👤",
  
  // Company/organization
  account_name: "🏢",
  company: "🏢",
  organization: "🏢",
  company_headquarter: "🏢",
  company_address: "🏢",
  
  // Phone related
  contact_number: "📞",
  phone: "📞",
  phone_status: "📞",
  
  // Location related
  city: "📍",
  state: "📍",
  country: "🌍",
  address: "📍",
  
  // Email related
  email: "✉️",
  email_status: "✉️",
  
  // Web related
  website: "🌐",
  url: "🌐",
  linkedin: "🔗",
  
  // Numbers/metrics
  revenue: "💰",
  employees: "👥",
  no_of_employees: "👥",
  
  // Priority/status
  priority: "⭐",
  status: "📊",
  
  // Industries
  industry: "🏭",
  
  // Job roles
  designation: "🔖",
  manager: "👔",
  sales_manager: "👔",
  
  // Technologies
  technologies: "⚙️",
  tech: "⚙️",
  
  // Notes/remarks
  remark: "📝",
  note: "📝",
  
  // Default
  default: "ℹ️"
};

// Country color mapping with unique colors for each country
const COUNTRY_COLORS: Record<string, string> = {
  "canada": "bg-yellow-200 text-yellow-800",
  "usa": "bg-blue-200 text-blue-800",
  "united states": "bg-blue-200 text-blue-800",
  "germany": "bg-purple-200 text-purple-800",
  "uk": "bg-pink-200 text-pink-800",
  "united kingdom": "bg-pink-200 text-pink-800",
  "australia": "bg-green-200 text-green-800",
  "france": "bg-indigo-200 text-indigo-800",
  "japan": "bg-red-200 text-red-800",
  "china": "bg-orange-300 text-orange-900",
  "india": "bg-amber-200 text-amber-800",
  "brazil": "bg-lime-200 text-lime-800",
  "south africa": "bg-emerald-200 text-emerald-800",
  "mexico": "bg-cyan-200 text-cyan-800",
  "italy": "bg-violet-200 text-violet-800",
  "spain": "bg-fuchsia-200 text-fuchsia-800",
  "russia": "bg-rose-200 text-rose-800",
  // Default color for other countries
  "default": "bg-gray-200 text-gray-800"
};

export function RowDetailsModal({ isOpen, onClose, rowData }: RowDetailsModalProps) {
  if (!rowData) return null
  const [showAllTech, setShowAllTech] = useState(false)
  
  // Get all fields from the data
  const allFields = Object.keys(rowData).filter(key => rowData[key]);
  
  // Get the appropriate icon for a field
  const getFieldIcon = (key: string): string => {
    const lowercaseKey = key.toLowerCase();
    
    // Check if any key in FIELD_ICONS is contained in the field name
    for (const [iconKey, icon] of Object.entries(FIELD_ICONS)) {
      if (lowercaseKey.includes(iconKey)) {
        return icon;
      }
    }
    
    // Default icon if no match
    return FIELD_ICONS.default;
  };
  
  // Format field name to proper case with first letter of each word capitalized
  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get color for a country
  const getCountryColor = (country: string): string => {
    const countryLower = country.toLowerCase().trim();
    
    for (const [key, color] of Object.entries(COUNTRY_COLORS)) {
      if (countryLower.includes(key)) {
        return color;
      }
    }
    
    return COUNTRY_COLORS.default;
  };

  // Get contact name or account name for the title
  const getContactTitle = (): string => {
    // First check for contact name or full name
    if (rowData.contact_name) return rowData.contact_name;
    if (rowData.full_name) return rowData.full_name;
    if (rowData.first_name && rowData.last_name) return `${rowData.first_name} ${rowData.last_name}`;
    
    // Then check for account or company name
    if (rowData.account_name) return rowData.account_name;
    if (rowData.company_name) return rowData.company_name;
    if (rowData.company) return rowData.company;
    
    // Default if nothing found
    return "Contact";
  };

  // Get subtitle information
  const getContactSubtitle = (): string => {
    let subtitle = "";
    
    // Add designation/title if available
    if (rowData.designation) subtitle = rowData.designation;
    else if (rowData.title) subtitle = rowData.title;
    
    // Add company if contact name was used as title
    if ((rowData.contact_name || rowData.full_name || (rowData.first_name && rowData.last_name)) && 
        (rowData.account_name || rowData.company_name || rowData.company)) {
      const company = rowData.account_name || rowData.company_name || rowData.company;
      subtitle = subtitle ? `${subtitle} at ${company}` : company;
    }
    
    return subtitle || "Contact details and information";
  };

  // Get the contact title and subtitle
  const contactTitle = getContactTitle();
  const contactSubtitle = getContactSubtitle();
  
  // Render a simple field row
  const renderField = (key: string, value: string) => {
    // Format the display name from the key with proper capitalization
    const displayName = formatFieldName(key);
      
    // Check if value is a URL
    const isUrl = 
      value.startsWith('http://') || 
      value.startsWith('https://') ||
      key.toLowerCase().includes('url') || 
      key.toLowerCase().includes('website') ||
      key.toLowerCase().includes('linkedin');
    
    // Check if this is a country field or contains country data
    const isCountry = 
      key.toLowerCase().includes('country') || 
      key.toLowerCase() === 'nation' || 
      key.toLowerCase() === 'nationality' || 
      (value && typeof value === 'string' && 
        Object.keys(COUNTRY_COLORS).some(countryName => 
          value.toLowerCase().includes(countryName) && countryName !== 'default'
        )
      );
    
    // Get the appropriate icon
    const icon = getFieldIcon(key);
    
    return (
      <div className="flex items-start gap-3 p-3 rounded-md">
        <div className="w-7 h-7 min-w-[1.75rem] rounded-full bg-[#4f9eb2]/15 flex items-center justify-center mt-0.5">
          <span className="text-[#4f9eb2] text-sm">{icon}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-medium text-gray-500 mb-0.5">{displayName}</p>
          {isUrl ? (
            <a 
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium truncate block text-sm"
            >
              {value}
            </a>
          ) : isCountry ? (
            <span className={cn(
              "px-2.5 py-1 rounded-full text-sm font-medium inline-block", 
              getCountryColor(value)
            )}>
              {value}
            </span>
          ) : (
            <p className="text-gray-900 font-medium text-sm">{value}</p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto bg-white rounded-lg p-0 shadow-xl !border-0">
        <DialogTitle className="sr-only">Contact Details</DialogTitle>
        <div className="px-6 py-5 bg-gradient-to-r from-[#4f9eb2] to-[#4f9eb2]/90">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">{contactTitle}</h2>
              <p className="text-white/80 text-sm">{contactSubtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="px-5 py-5 overflow-y-auto -mt-px">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {allFields.map((key, index) => (
              <div key={key} className="bg-white border border-gray-100 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                {renderField(key, rowData[key])}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 