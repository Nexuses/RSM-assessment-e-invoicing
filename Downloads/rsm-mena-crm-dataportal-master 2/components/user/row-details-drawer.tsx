"use client"

import { useEffect, useState } from "react"
import { X, ChevronLeft, Mail, Phone, Building2, Globe, MapPin, User, Briefcase, LinkedinIcon, Info, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

// Import the technology color functions from data-items.tsx
import { getTechBadgeColors, getIndustryBadgeColors } from "./tech-colors"

interface DataRow {
  [key: string]: string;
}

interface RowDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: DataRow | null;
}

// Helper function to get a nice label from a column key
const formatColumnName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Helper function to check if a value is a URL
const isUrl = (value: string): boolean => {
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`);
    return true;
  } catch {
    return false;
  }
};

// Helper function to check if a value is an email
const isEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// Helper function to determine the appropriate icon for a field
const getFieldIcon = (key: string, value: string) => {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('email')) return <Mail className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('phone') || keyLower.includes('contact_number')) return <Phone className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('company') || keyLower.includes('account_name')) return <Building2 className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('website') || keyLower.includes('url')) return <Globe className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('address') || keyLower.includes('location') || keyLower.includes('country')) return <MapPin className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('name') || keyLower.includes('person')) return <User className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('title') || keyLower.includes('designation') || keyLower.includes('position')) return <Briefcase className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('linkedin')) return <LinkedinIcon className="h-5 w-5 text-gray-500" />;
  if (keyLower.includes('date') || keyLower.includes('last')) return <Calendar className="h-5 w-5 text-gray-500" />;
  
  return <Info className="h-5 w-5 text-gray-500" />;
};

// Helper function to check if a field is important
const isImportantField = (key: string): boolean => {
  const importantKeys = [
    'name', 'first_name', 'last_name', 'contact_name',
    'email', 'email_id', 
    'phone', 'contact_number',
    'company', 'company_name', 'account_name',
    'title', 'designation', 'position',
    'industry', 'technologies',
    'website', 'linkedin'
  ];
  
  return importantKeys.some(k => key.toLowerCase().includes(k));
};

// Helper function to get badge colors for industry and technology fields
const getBadgeColors = (key: string, value: string): { bg: string, text: string, borderColor: string } => {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('industry')) {
    const colors = getIndustryBadgeColors(value);
    return { ...colors, borderColor: colors.bg.replace('bg-', 'border-') };
  }
  
  if (keyLower.includes('technologies') || keyLower.includes('tech')) {
    const colors = getTechBadgeColors(value);
    return { ...colors, borderColor: colors.bg.replace('bg-', 'border-') };
  }
  
  return { bg: "bg-gray-50", text: "text-gray-700", borderColor: "border-gray-200" };
};

// Helper function to get person's name from row data
const getPersonName = (rowData: DataRow): string => {
  if (rowData['contact_name']) return rowData['contact_name'];
  if (rowData['first_name'] && rowData['last_name']) return `${rowData['first_name']} ${rowData['last_name']}`;
  if (rowData['name']) return rowData['name'];
  if (rowData['full_name']) return rowData['full_name'];
  
  // If no name field found, try to find any field containing 'name'
  const nameField = Object.keys(rowData).find(key => 
    key.toLowerCase().includes('name') && 
    !key.toLowerCase().includes('company') && 
    !key.toLowerCase().includes('account')
  );
  
  return nameField ? rowData[nameField] : 'Contact Details';
};

// Helper function to get company name from row data
const getCompanyName = (rowData: DataRow): string => {
  if (rowData['company']) return rowData['company'];
  if (rowData['company_name']) return rowData['company_name'];
  if (rowData['account_name']) return rowData['account_name'];
  
  // If no company field found, try to find any field containing 'company'
  const companyField = Object.keys(rowData).find(key => 
    key.toLowerCase().includes('company') || 
    key.toLowerCase().includes('account')
  );
  
  return companyField ? rowData[companyField] : '';
};

// Helper function to get industry from row data
const getIndustry = (rowData: DataRow): string => {
  if (rowData['industry']) return rowData['industry'];
  if (rowData['industry_client']) return rowData['industry_client'];
  
  // If no industry field found, try to find any field containing 'industry'
  const industryField = Object.keys(rowData).find(key => 
    key.toLowerCase().includes('industry')
  );
  
  return industryField ? rowData[industryField] : '';
};

export function RowDetailsDrawer({ isOpen, onClose, rowData }: RowDetailsDrawerProps) {
  const [animateIn, setAnimateIn] = useState(false);
  
  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the drawer is rendered before animating in
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);
  
  // Early return if no data or not open
  if (!isOpen || !rowData) return null;
  
  // Get person name and company name
  const personName = getPersonName(rowData);
  const companyName = getCompanyName(rowData);
  const industry = getIndustry(rowData);
  
  // Find email and phone in the data
  const emailKey = Object.keys(rowData).find(key => 
    key.toLowerCase().includes('email') && rowData[key]
  );
  const emailValue = emailKey ? rowData[emailKey] : '';
  
  const phoneKey = Object.keys(rowData).find(key => 
    (key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact_number')) && rowData[key]
  );
  const phoneValue = phoneKey ? rowData[phoneKey] : '';
  
  // Handle email click
  const handleEmailClick = () => {
    if (emailValue) {
      window.location.href = `mailto:${emailValue}`;
    }
  };
  
  // Handle call click
  const handleCallClick = () => {
    if (phoneValue) {
      window.location.href = `tel:${phoneValue.replace(/\D/g, '')}`;
    }
  };

  // Organize fields into categories
  const contactFields: string[] = [];
  const companyFields: string[] = [];
  const additionalFields: string[] = [];
  
  Object.keys(rowData).forEach(key => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('email') || keyLower.includes('phone') || keyLower.includes('contact_number')) {
      contactFields.push(key);
    } else if (keyLower.includes('company') || keyLower.includes('account') || keyLower.includes('industry')) {
      companyFields.push(key);
    } else if (!keyLower.includes('name') && !keyLower.includes('first_name') && !keyLower.includes('last_name')) {
      additionalFields.push(key);
    }
  });
  
  // Sort fields alphabetically within their categories
  const sortFields = (a: string, b: string) => formatColumnName(a).localeCompare(formatColumnName(b));
  contactFields.sort(sortFields);
  companyFields.sort(sortFields);
  additionalFields.sort(sortFields);
  
  return (
    <div 
      className={`fixed inset-0 z-[1000] m-0 p-0 ${!isOpen ? 'pointer-events-none' : ''}`}
      aria-modal={isOpen}
      role="dialog"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          animateIn ? 'opacity-50' : 'opacity-0'
        } ${!isOpen ? 'pointer-events-none' : ''}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[90%] md:w-[450px] lg:w-[500px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l border-gray-200 overflow-hidden`}
        style={{ height: '100%' }}
      >
        {/* Header with close button */}
        <div className="flex-none p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-8 w-8 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-grow">
          <div className="px-6 py-4">
            {/* Person Name and Company */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">{personName}</h1>
              {companyName && (
                <p className="text-gray-600 mt-1">{companyName}</p>
              )}
              {industry && (
                <div className="mt-2">
                  <Badge className={cn(
                    getIndustryBadgeColors(industry).bg,
                    getIndustryBadgeColors(industry).text,
                    "border",
                    getIndustryBadgeColors(industry).bg.replace('bg-', 'border-'),
                    "font-normal"
                  )}>
                    {industry}
                  </Badge>
                </div>
              )}
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Contact Information
              </h2>
              <div className="space-y-4">
                {contactFields.map(key => {
                  const value = rowData[key];
                  if (!value) return null;
                  
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getFieldIcon(key, value)}
                      </div>
                      <div className="flex-grow">
                        {key.toLowerCase().includes('email') ? (
                          <a 
                            href={`mailto:${value}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {value}
                          </a>
                        ) : key.toLowerCase().includes('phone') || key.toLowerCase().includes('contact_number') ? (
                          <a 
                            href={`tel:${value.replace(/\D/g, '')}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {value}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-900">{value}</span>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">{formatColumnName(key)}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Add website if it exists */}
                {Object.keys(rowData).some(key => key.toLowerCase().includes('website')) && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Globe className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <a 
                        href={rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('website')) || '']?.startsWith('http') 
                          ? rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('website')) || ''] 
                          : `https://${rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('website')) || '']}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('website')) || '']}
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">Website</p>
                    </div>
                  </div>
                )}

                {/* Add LinkedIn if it exists */}
                {Object.keys(rowData).some(key => key.toLowerCase().includes('linkedin')) && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <LinkedinIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <a 
                        href={rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('linkedin')) || '']?.startsWith('http') 
                          ? rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('linkedin')) || ''] 
                          : `https://${rowData[Object.keys(rowData).find(key => key.toLowerCase().includes('linkedin')) || '']}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        LinkedIn Profile
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">LinkedIn</p>
                    </div>
                  </div>
                )}

                {/* Add location if it exists */}
                {Object.keys(rowData).some(key => key.toLowerCase().includes('location') || key.toLowerCase().includes('country') || key.toLowerCase().includes('address')) && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <span className="text-sm text-gray-900">
                        {rowData[Object.keys(rowData).find(key => 
                          key.toLowerCase().includes('location') || 
                          key.toLowerCase().includes('country') || 
                          key.toLowerCase().includes('address')
                        ) || '']}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Location</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information Section */}
            {companyFields.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Company Information
                </h2>
                <div className="space-y-4">
                  {companyFields.map(key => {
                    const value = rowData[key];
                    if (!value || key === 'company' || key === 'company_name' || key === 'account_name') return null;
                    
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getFieldIcon(key, value)}
                        </div>
                        <div className="flex-grow">
                          {key.toLowerCase().includes('industry') ? (
                            <Badge className={cn(
                              getIndustryBadgeColors(value).bg,
                              getIndustryBadgeColors(value).text,
                              "border",
                              getIndustryBadgeColors(value).bg.replace('bg-', 'border-'),
                              "font-normal"
                            )}>
                              {value}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-900">{value}</span>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">{formatColumnName(key)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Details Section */}
            {additionalFields.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Additional Details
                </h2>
                <div className="space-y-4">
                  {additionalFields.map(key => {
                    const value = rowData[key];
                    if (!value || key === 'id' || key === 'select') return null;
                    
                    // Handle technologies field specially
                    if (key.toLowerCase().includes('technologies') && value.includes(',')) {
                      return (
                        <div key={key} className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getFieldIcon(key, value)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex flex-wrap gap-2">
                              {value.split(',').map((tech, i) => {
                                const trimmedTech = tech.trim();
                                if (!trimmedTech) return null;
                                const colors = getTechBadgeColors(trimmedTech);
                                return (
                                  <Badge key={i} className={cn(
                                    colors.bg,
                                    colors.text,
                                    "border",
                                    colors.bg.replace('bg-', 'border-'),
                                    "font-normal"
                                  )}>
                                    {trimmedTech}
                                  </Badge>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{formatColumnName(key)}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getFieldIcon(key, value)}
                        </div>
                        <div className="flex-grow">
                          <span className="text-sm text-gray-900">{value}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{formatColumnName(key)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Section - Only show if notes are available */}
            {(rowData['notes'] || rowData['description'] || rowData['comments']) && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Notes
                </h2>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-700">
                    {rowData['notes'] || rowData['description'] || rowData['comments']}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer with Action Buttons */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-700 border-gray-200 hover:bg-gray-50"
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={`text-blue-600 border-blue-200 hover:bg-blue-50 ${!emailValue ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleEmailClick}
                disabled={!emailValue}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                className={`bg-blue-600 text-white hover:bg-blue-700 ${!phoneValue ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleCallClick}
                disabled={!phoneValue}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 