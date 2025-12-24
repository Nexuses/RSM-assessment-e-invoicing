"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileQuestion, Database, Mail, Phone, CreditCard, FolderOpen, ArrowRight, Flame, CalendarCheck2, CheckCircle2, Rocket } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "@/components/ui/charts"
import { PieChart, Pie, Cell, Legend } from "@/components/ui/charts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RadialBarChart, RadialBar } from "@/components/ui/charts"
import { useQuery } from "@tanstack/react-query"
import { formatNumber } from "@/lib/format-utils"
import { useCacheInvalidation } from "@/app/providers"
import { CompactListTable } from "@/components/user/compact-list-table"
import { ListItem } from "@/components/user/list-table"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UserData {
  totalFiles: number
  requestCount: number
  totalRecords: number
  totalEmails: number
  totalPhones: number
  fileAnalytics: {
    industries: { name: string; value: number }[]
    countries: { name: string; value: number }[]
    technologies: { name: string; value: number }[]
    employeeSize: { name: string; value: number }[]
    revenueSize: { name: string; value: number }[]
    downloadsByMonth: { name: string; total: number }[]
    titleDistribution: { name: string; count: number }[]
    industryDistribution: { name: string; value: number }[]
  }
  credits: number
  dataFiles: {
    id: string
    title?: string
    name?: string
    filename?: string
    description?: string
    data: any[]
  }[]
}

const COLORS = ['#78b3fb', '#4ECDC4', '#5ab8e8', '#45B7D1', '#3da5c4', '#2d8ba3']
const COUNTRY_COLORS = ['#78b3fb', '#4ECDC4', '#5ab8e8', '#45B7D1', '#3da5c4', '#2d8ba3']
const TECH_COLORS = ['#78b3fb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
const REVENUE_COLORS = ['#FFB74D', '#FF8A65', '#F06292', '#7986CB', '#4DB6AC', '#81C784', '#AED581', '#DCE775']
const INDUSTRY_DISTRIBUTION_COLORS = ['#FF8A65', '#4DB6AC', '#7986CB']

// Industry distribution data
const industryDistributionData = [
  { name: "Event", value: 8364 },
  { name: "Healthcare", value: 6577 },
  { name: "Automotive", value: 8115 }
]

// Function to determine status based on file data
const determineStatus = (file: any): "active" | "pending" | "archived" | "completed" => {
  // This is a placeholder logic - you can implement your own logic based on your data
  const date = new Date(file.description?.split(' ').pop() || new Date());
  const now = new Date();
  const daysDifference = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference < 7) return "active";
  if (daysDifference < 30) return "pending";
  if (daysDifference < 90) return "completed";
  return "archived";
};

// Function to format the date from file data
const formatDate = (file: any): string => {
  try {
    // Try to extract date from description or use current date
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
};

// Function to convert files to list items
const filesToListItems = (files: any[]): ListItem[] => {
  return files.map(file => ({
    id: file.id,
    name: file.title || file.name || "Untitled List",
    accounts: file.description || file.filename || "",
    contacts: file.data?.length || 0,
    date: formatDate(file),
    status: determineStatus(file)
  }));
};

export default function DashboardPage() {
  // All state declarations first
  const [showAllTitles, setShowAllTitles] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [showAllTechnologies, setShowAllTechnologies] = useState(false)
  const [showAllEmployeeSizes, setShowAllEmployeeSizes] = useState(false)
  const [showAllRevenues, setShowAllRevenues] = useState(false)
  const [selectedIndustryIndex, setSelectedIndustryIndex] = useState<number | null>(null)
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [recentPipeline, setRecentPipeline] = useState<any[]>([])
  const [pipelineCounts, setPipelineCounts] = useState<{ hot: number; meetingScheduled: number; meetingDone: number; opportunity: number }>({ hot: 0, meetingScheduled: 0, meetingDone: 0, opportunity: 0 })

  // Get cache invalidation functions
  const { setUserLoggedIn, userId } = useCacheInvalidation();

  // Handle responsive sizing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile)
  }, []);

  // Fetch user data with React Query - improved caching
  const { data: userData, isLoading, isError, isFetching } = useQuery({
    queryKey: ['userDashboardData', userId],
    queryFn: async () => {
      try {
        // Add cache-busting parameter to prevent browser caching
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/user/data?_=${cacheBuster}`, {
          // Ensure fresh data with cache control headers
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        
        // We'll process list items in a separate query
        // Just return the data for analytics
        
        // If we have a user ID, set it in the cache context
        if (data && data.userId) {
          setUserLoggedIn(data.userId);
        }
        
        // Process data for analytics
        const titleCounts: { [key: string]: number } = {}
        const industryCounts: { [key: string]: number } = {}
        const countryCounts: { [key: string]: number } = {}
        const technologyCounts: { [key: string]: number } = {}
        const employeeSizeCounts: { [key: string]: number } = {}
        const revenueCounts: { [key: string]: number } = {}
        let totalEmails = 0
        let totalPhones = 0
        
        // Debug counters
        let debugTotalRecords = 0;
        let debugWorkmatePhonesFound = 0;
        let debugGeneralPhonesFound = 0;
        
        data.dataFiles?.forEach((file: any) => {
          // Determine if this is workmate user data by checking for typical workmate columns
          const firstRow = file.data?.[0] || {};
          const originalColumns = Object.keys(firstRow);
          
          const isWorkmateUser = originalColumns.some(col => 
            col.toLowerCase().includes('workmate') ||
            col.toLowerCase().includes('tm_remark') ||
            col.toLowerCase().includes('industry_client') ||
            col.toLowerCase().includes('industry_nexuse')
          ) || (
            originalColumns.includes('s_no') || 
            originalColumns.includes('account_name') || 
            originalColumns.includes('workmates_remark')
          );
          
          file.data?.forEach((record: any) => {
            debugTotalRecords++;
            
            // Count emails - check for various common field names and patterns
            const hasEmail = Object.keys(record).some(key => {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('email') || 
                  lowerKey.includes('e-mail') || 
                  lowerKey.includes('mail') ||
                  lowerKey === 'e_mail' ||
                  lowerKey === 'email_id') {
                // Check if the field actually contains a valid email value
                const value = record[key];
                return value && typeof value === 'string' && value.trim() !== '' && 
                       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
              }
              return false;
            });
            
            if (hasEmail) {
              totalEmails++;
            }
            
            // Count phone numbers differently based on user type
            let hasPhone = false;
            
            if (isWorkmateUser) {
              // For workmate users, only count contact_number_personal
              Object.keys(record).some(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'contact_number_personal' || lowerKey === 'contact_number') {
                  const value = record[key];
                  if (value && typeof value === 'string' && value.trim() !== '') {
                    // More permissive regex that handles formats like "98110 18678 / 120"
                    // Allow digits, spaces, plus, hyphen, parentheses, slashes, and dots
                    const cleanedValue = value.replace(/\s/g, '');
                    if (cleanedValue.length >= 5 && /^[+\d\s\-()\/\.…]+$/.test(value)) {
                      hasPhone = true;
                      debugWorkmatePhonesFound++;
                      return true;
                    }
                  }
                }
                return false;
              });
            } else {
              // For general users, check both personal_phone and company_phone
              Object.keys(record).some(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'personal_phone' || lowerKey === 'company_phone' || 
                    lowerKey === 'phone' || lowerKey === 'mobile') {
                  const value = record[key];
                  if (value && typeof value === 'string' && value.trim() !== '') {
                    // More permissive regex that handles formats like "98110 18678 / 120"
                    // Allow digits, spaces, plus, hyphen, parentheses, slashes, and dots
                    const cleanedValue = value.replace(/\s/g, '');
                    if (cleanedValue.length >= 5 && /^[+\d\s\-()\/\.…]+$/.test(value)) {
                      hasPhone = true;
                      debugGeneralPhonesFound++;
                      return true;
                    }
                  }
                }
                return false;
              });
            }
            
            if (hasPhone) {
              totalPhones++;
            }

            // Process titles based on user type
            // For Workmate users, use "designation" field
            // For General users, use "title" field
            const title = record.designation || record.Designation || 
                         record['designation'] || 
                         record.title || record.Title || 
                         record['title'] ||
                         // Check lowercase versions explicitly
                         record.designation?.toLowerCase?.() || 
                         record.title?.toLowerCase?.() || 
                         "Other"
            titleCounts[title] = (titleCounts[title] || 0) + 1

            // Process industries
            const industry = record.industry || record.Industry ||
                           record.industry_client || record.Industry_client ||
                           record['industry'] || record['industry_client'] ||
                           record.Industry_Nexuses || record.industry_nexuses ||
                           (typeof record.industry === 'string' ? record.industry : null) ||
                           (typeof record.industry_client === 'string' ? record.industry_client : null) ||
                           "Other"
            industryCounts[industry] = (industryCounts[industry] || 0) + 1

            // Process countries
            const country = record.country || record.Country ||
                          record.country_contact_person || record.Country_Contact_Person ||
                          record.company_country || record.Company_Country ||
                          record['country'] || record['country_contact_person'] || record['company_country'] ||
                          (typeof record.country === 'string' ? record.country : null) ||
                          (typeof record.country_contact_person === 'string' ? record.country_contact_person : null) ||
                          (typeof record.company_country === 'string' ? record.company_country : null) ||
                          "Other"
            countryCounts[country] = (countryCounts[country] || 0) + 1

            // Process technologies
            const technologies = record.technologies || record.Technologies || 
                              record['technologies'] ||
                              (typeof record.technologies === 'string' ? record.technologies : null) ||
                              ""
            if (typeof technologies === 'string' && technologies.trim()) {
              technologies.split(',').map(tech => tech.trim()).filter(tech => tech).forEach(tech => {
                technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
              })
            }

            // Process employee size
            const employeeSize = record.No_of_Employees || record.Employees_Size || 
                               record.no_of_employees || record.employees || 
                               record['no_of_employees'] || record['employees'] ||
                               (typeof record.no_of_employees === 'string' ? record.no_of_employees : null) ||
                               (typeof record.employees === 'string' ? record.employees : null) ||
                               null
            if (employeeSize) {
              let sizeRange = "Other"
              const size = parseInt(employeeSize.toString().replace(/[^0-9]/g, ''))
              if (!isNaN(size)) {
                if (size < 50) sizeRange = "< 50"
                else if (size < 100) sizeRange = "50 - 99"
                else if (size < 250) sizeRange = "100 - 249"
                else if (size < 500) sizeRange = "250 - 499"
                else if (size < 1000) sizeRange = "500 - 999"
                else if (size < 5000) sizeRange = "1000 - 4999"
                else sizeRange = "5000+"
              }
              employeeSizeCounts[sizeRange] = (employeeSizeCounts[sizeRange] || 0) + 1
            }

            // Process revenue
            const revenue = record.revenue || record.Revenue || 
                         record.annual_revenue || record.Annual_Revenue || 
                         record['revenue'] || record['annual_revenue'] ||
                         (typeof record.revenue === 'string' ? record.revenue : null) || 
                         (typeof record.annual_revenue === 'string' ? record.annual_revenue : null) || 
                         null
            if (revenue) {
              let revenueRange = "Other"
              const rev = parseFloat(revenue.toString().replace(/[^0-9.]/g, ''))
              if (!isNaN(rev)) {
                if (rev < 1000000) revenueRange = "< $1M"
                else if (rev <= 50000000) revenueRange = "$1M - $50M"
                else revenueRange = "> $50M"
              }
              revenueCounts[revenueRange] = (revenueCounts[revenueRange] || 0) + 1
            }
          })
        })

        // Log debug information to console
        console.log('Phone number validation stats:');
        console.log('Total records processed:', debugTotalRecords);
        console.log('Workmate phones found:', debugWorkmatePhonesFound);
        console.log('General phones found:', debugGeneralPhonesFound);
        console.log('Total phones counted:', totalPhones);

        // Convert counts to arrays and sort
        const titleDistribution = Object.entries(titleCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const industries = Object.entries(industryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const countries = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const technologies = Object.entries(technologyCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const employeeSize = Object.entries(employeeSizeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const revenueSize = Object.entries(revenueCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const totalRecords = data.dataFiles?.reduce((acc: number, file: any) => {
          return acc + (file.data?.length || 0)
        }, 0) || 0

        // Create downloadsByMonth dummy data
        const downloadsByMonth = [
          { name: "Jan", total: 12 },
          { name: "Feb", total: 18 },
          { name: "Mar", total: 5 },
          { name: "Apr", total: 10 },
          { name: "May", total: 8 },
          { name: "Jun", total: 15 },
          { name: "Jul", total: 20 },
          { name: "Aug", total: 12 },
          { name: "Sep", total: 10 },
          { name: "Oct", total: 5 },
          { name: "Nov", total: 8 },
          { name: "Dec", total: 12 },
        ]

        return {
          totalFiles: data.dataFiles?.length || 0,
          requestCount: data.requestCount || 0,
          totalRecords,
          totalEmails,
          totalPhones,
          fileAnalytics: {
            industries,
            countries,
            technologies,
            employeeSize,
            revenueSize,
            downloadsByMonth,
            titleDistribution,
            industryDistribution: industryDistributionData,
          },
          credits: data.credits || 0,
          dataFiles: data.dataFiles || [], // Return the raw dataFiles for the list items query
        } as UserData
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
      }
    },
    staleTime: 60 * 60 * 1000, // 60 minutes - data stays fresh longer
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: "always", // Always refetch on mount to ensure data is fresh
    retry: 2, // Increase retry attempts
    refetchOnReconnect: true // Refetch when reconnecting
  });

  // Separate query for list items with its own caching strategy
  const { data: listItemsData } = useQuery<ListItem[]>({
    queryKey: ['listItems', userId],
    queryFn: () => {
      if (!userData?.dataFiles) return [];
      
      console.log("Processing list items from userData");
      
      // Ensure each file has a title property
      const processedFiles = userData.dataFiles.map((file: any) => {
        return {
          ...file,
          title: file.title || file.name || file.filename?.replace(/\.csv$/, '') || "Untitled List"
        };
      });
      
      return filesToListItems(processedFiles);
    },
    enabled: !!userData?.dataFiles, // Only run this query when userData is available
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Update listItems state when listItemsData changes
  useEffect(() => {
    if (listItemsData) {
      console.log("List items loaded successfully:", listItemsData);
      setListItems(listItemsData);
    }
  }, [listItemsData]);

  // Fetch user's pipeline for stats and recent leads
  const { data: pipelineItems } = useQuery<any[]>({
    queryKey: ['userPipeline'],
    queryFn: async () => {
      const res = await fetch('/api/user/pipeline')
      if (!res.ok) throw new Error('Failed to load pipeline')
      return await res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (!pipelineItems) return
    const counts = pipelineItems.reduce((acc: any, it: any) => {
      const s = (it.stage || '').toLowerCase()
      if (s === 'hot') acc.hot += 1
      else if (s === 'meeting scheduled') acc.meetingScheduled += 1
      else if (s === 'meeting done') acc.meetingDone += 1
      else if (s === 'opportunity') acc.opportunity += 1
      return acc
    }, { hot: 0, meetingScheduled: 0, meetingDone: 0, opportunity: 0 })
    setPipelineCounts(counts)

    const recent = [...pipelineItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((p: any) => ({
        id: p._id,
        name: (p?.meta && p.meta.fullName) || p?.data?.first_name || p?.data?.contact_name || '-',
        company: (p?.meta && p.meta.company) || p?.data?.company_name || p?.data?.account_name || '-',
        email: (p?.meta && p.meta.email) || p?.data?.email || p?.data?.email_id || '-',
        phone: (p?.meta && p.meta.phone) || p?.data?.personal_phone || p?.data?.contact_number_personal || p?.data?.phone || '-',
        industry: (p?.meta && p.meta.industry) || p?.data?.industry || p?.data?.industry_client || '-',
        stage: p.stage,
        createdAt: p.createdAt
      }))
    setRecentPipeline(recent)
  }, [pipelineItems])

  // Show loading state when data is being fetched
  if (isLoading || (!userData && isFetching)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
      </div>
    )
  }

  // Function to get top 8 titles
  const getTop8Titles = () => {
    return userData?.fileAnalytics.titleDistribution.slice(0, 8) || []
  }

  // Function to get top 8 industries
  const getTop8Industries = () => {
    if (!userData?.fileAnalytics.industries) return [];
    
    // Calculate total value
    const totalValue = userData.fileAnalytics.industries.reduce((sum, item) => sum + item.value, 0);
    
    // Define threshold as 2% of total value
    const threshold = totalValue * 0.02;
    
    // Separate significant industries and small industries
    const significantIndustries: { name: string; value: number }[] = [];
    let othersValue = 0;
    
    userData.fileAnalytics.industries.forEach(industry => {
      if (industry.value >= threshold) {
        significantIndustries.push(industry);
      } else {
        othersValue += industry.value;
      }
    });
    
    // Add "Others" category if there are small industries
    const result: { name: string; value: number }[] = [...significantIndustries];
    if (othersValue > 0) {
      result.push({ name: "Others", value: othersValue });
    }
    
    // Sort and limit to top 8
    return result.sort((a, b) => b.value - a.value).slice(0, 8);
  }

  // Function to get top 8 countries
  const getTop8Countries = () => {
    if (!userData?.fileAnalytics.countries) return [];
    
    // Calculate total value
    const totalValue = userData.fileAnalytics.countries.reduce((sum, item) => sum + item.value, 0);
    
    // Define threshold as 2% of total value
    const threshold = totalValue * 0.02;
    
    // Separate significant countries and small countries
    const significantCountries: { name: string; value: number }[] = [];
    let othersValue = 0;
    
    userData.fileAnalytics.countries.forEach(country => {
      if (country.value >= threshold) {
        significantCountries.push(country);
      } else {
        othersValue += country.value;
      }
    });
    
    // Add "Others" category if there are small countries
    const result: { name: string; value: number }[] = [...significantCountries];
    if (othersValue > 0) {
      result.push({ name: "Others", value: othersValue });
    }
    
    // Sort and limit to top 8
    return result.sort((a, b) => b.value - a.value).slice(0, 8);
  }

  // Function to get top 10 technologies
  const getTop10Technologies = () => {
    return userData?.fileAnalytics.technologies?.slice(0, 10) || []
  }

  // Function to get detailed employee size distribution
  const getDetailedEmployeeSizeDistribution = () => {
    if (!userData?.fileAnalytics.employeeSize) return [];
    
    // Direct mapping approach
    // First, map each existing size category to the new size categories
    const sizeMap: { [key: string]: { name: string; value: number } } = {
      "< 50": { name: "< 50", value: 0 },
      "50 - 99": { name: "50 - 99", value: 0 },
      "100 - 249": { name: "100 - 249", value: 0 },
      "250 - 499": { name: "250 - 499", value: 0 },
      "500 - 999": { name: "500 - 999", value: 0 },
      "1000 - 4999": { name: "1000 - 4999", value: 0 },
      "5000+": { name: "5000+", value: 0 },
      "Other": { name: "Other", value: 0 }
    };
    
    // Fill in actual data values
    userData.fileAnalytics.employeeSize.forEach(item => {
      if (sizeMap[item.name]) {
        sizeMap[item.name].value = item.value;
      } else if (item.name === "< 100") {
        // Split < 100 into < 50 and 50-99
        sizeMap["< 50"].value += Math.round(item.value * 0.6);
        sizeMap["50 - 99"].value += Math.round(item.value * 0.4);
      } else if (item.name === "100 - 500") {
        // Split 100-500 into 100-249 and 250-499
        sizeMap["100 - 249"].value += Math.round(item.value * 0.6);
        sizeMap["250 - 499"].value += Math.round(item.value * 0.4);
      } else if (item.name === "500+") {
        // Split 500+ into 500-999, 1000-4999, and 5000+
        sizeMap["500 - 999"].value += Math.round(item.value * 0.4);
        sizeMap["1000 - 4999"].value += Math.round(item.value * 0.4);
        sizeMap["5000+"].value += Math.round(item.value * 0.2);
      } else {
        sizeMap["Other"].value += item.value;
      }
    });
    
    // Convert the map to an array and filter out empty categories
    return Object.values(sizeMap)
      .filter(item => item.value > 0)
      .sort((a, b) => {
        // Custom sort order for employee size ranges
        const order = ["< 50", "50 - 99", "100 - 249", "250 - 499", "500 - 999", "1000 - 4999", "5000+", "Other"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
  };

  // Function to get detailed revenue distribution
  const getDetailedRevenueDistribution = () => {
    if (!userData?.fileAnalytics.revenueSize) return [];
    
    // Direct mapping approach
    // First, map each existing size category to the new size categories
    const revenueMap: { [key: string]: { name: string; value: number } } = {
      "< $1M": { name: "< $1M", value: 0 },
      "$1M - $10M": { name: "$1M - $10M", value: 0 },
      "$10M - $25M": { name: "$10M - $25M", value: 0 },
      "$25M - $50M": { name: "$25M - $50M", value: 0 },
      "$50M - $100M": { name: "$50M - $100M", value: 0 },
      "$100M - $500M": { name: "$100M - $500M", value: 0 },
      "> $500M": { name: "> $500M", value: 0 },
      "Other": { name: "Other", value: 0 }
    };
    
    // Fill in actual data values
    userData.fileAnalytics.revenueSize.forEach(item => {
      if (revenueMap[item.name]) {
        revenueMap[item.name].value = item.value;
      } else if (item.name === "< $1M") {
        revenueMap["< $1M"].value += item.value;
      } else if (item.name === "$1M - $50M") {
        // Split $1M - $50M into more granular ranges
        revenueMap["$1M - $10M"].value += Math.round(item.value * 0.5);
        revenueMap["$10M - $25M"].value += Math.round(item.value * 0.3);
        revenueMap["$25M - $50M"].value += Math.round(item.value * 0.2);
      } else if (item.name === "> $50M") {
        // Split > $50M into more granular ranges
        revenueMap["$50M - $100M"].value += Math.round(item.value * 0.5);
        revenueMap["$100M - $500M"].value += Math.round(item.value * 0.3);
        revenueMap["> $500M"].value += Math.round(item.value * 0.2);
      } else {
        revenueMap["Other"].value += item.value;
      }
    });
    
    // Convert the map to an array and filter out empty categories
    return Object.values(revenueMap)
      .filter(item => item.value > 0)
      .sort((a, b) => {
        // Custom sort order for revenue ranges
        const order = ["< $1M", "$1M - $10M", "$10M - $25M", "$25M - $50M", "$50M - $100M", "$100M - $500M", "> $500M", "Other"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl pl-12 sm:pl-0 sm:text-3xl font-bold text-gray-800">Dashboard</h1>
      </div>
      
      {/* Pipeline Overview */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Pipeline overview</h2>
        <Link href="/dashboard/pipeline" className="text-sm text-blue-600 hover:underline">View full pipeline</Link>
      </div>
      
      {/* Pipeline Stage Cards - first row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-red-100 bg-red-50 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Hot</CardTitle>
            <div className="bg-red-50 text-red-600 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-red-100">
              <Flame className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(pipelineCounts.hot)}</div>
            <p className="text-xs text-gray-600">Leads marked hot</p>
          </CardContent>
        </Card>
        <Card className="group rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-amber-100 bg-amber-50 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Meeting Scheduled</CardTitle>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-amber-100">
              <CalendarCheck2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(pipelineCounts.meetingScheduled)}</div>
            <p className="text-xs text-gray-600">Upcoming meetings</p>
          </CardContent>
        </Card>
        <Card className="group rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-green-100 bg-green-50 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Meeting Done</CardTitle>
            <div className="bg-green-50 text-green-600 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-green-100">
              <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(pipelineCounts.meetingDone)}</div>
            <p className="text-xs text-gray-600">Completed meetings</p>
          </CardContent>
        </Card>
        <Card className="group rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 bg-blue-50 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Opportunity</CardTitle>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-blue-100">
              <Rocket className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(pipelineCounts.opportunity)}</div>
            <p className="text-xs text-gray-600">Active opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pipeline Leads Section - moved under Pipeline Overview */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Pipeline Leads</h2>
          <Link href="/dashboard/pipeline" className="text-sm text-blue-600 hover:underline">View full pipeline</Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-slate-600">Name</TableHead>
                <TableHead className="text-slate-600">Company</TableHead>
                <TableHead className="text-slate-600">Email</TableHead>
                <TableHead className="text-slate-600">Phone</TableHead>
                <TableHead className="text-slate-600">Industry</TableHead>
                <TableHead className="text-slate-600">Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPipeline.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">No pipeline leads yet.</TableCell>
                </TableRow>
              ) : (
                recentPipeline.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                    <TableCell className="text-slate-700">{p.company}</TableCell>
                    <TableCell className="text-slate-600">{p.email}</TableCell>
                    <TableCell className="text-slate-600">{p.phone}</TableCell>
                    <TableCell className="text-slate-700">{p.industry}</TableCell>
                    <TableCell className="text-slate-700 capitalize">{p.stage}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Prospect List Overview */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Prospect list overview</h2>
        <Link href="/dashboard/list" className="text-sm text-blue-600 hover:underline">View all prospects</Link>
      </div>

      {/* Top Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Total Contacts</CardTitle>
            <div className="bg-gray-50 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-200">
              <Database className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(userData?.totalRecords || 0)}</div>
            <p className="text-xs text-gray-600">Total contacts across all lists</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Total Lists</CardTitle>
            <div className="bg-gray-50 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-200">
              <FolderOpen className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{userData?.totalFiles || 0}</div>
            <p className="text-xs text-gray-600">Lists in your database</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Total Emails</CardTitle>
            <div className="bg-gray-50 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-200">
              <Mail className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(userData?.totalEmails || 0)}</div>
            <p className="text-xs text-gray-600">Total email addresses in database</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">Total Phone Numbers</CardTitle>
            <div className="bg-gray-50 p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-200">
              <Phone className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(userData?.totalPhones || 0)}</div>
            <p className="text-xs text-gray-600">Total phone numbers in database</p>
          </CardContent>
        </Card>
      </div>

      

      {/* Analytics Charts */}
      <div className="grid gap-4 grid-cols-1">
        {/* Industry Distribution Pie Chart */}
        {/* <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-800 font-semibold">Industry Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="h-[380px] xs:h-[400px] sm:h-[440px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={isMobile ? 
                  { top: 30, right: 0, bottom: 80, left: 0 } : 
                  { top: 10, right: 120, bottom: 20, left: 10 }
                }>
                  <Pie
                    data={industryDistributionData}
                    cx={isMobile ? "50%" : "40%"}
                    cy="45%"
                    labelLine={isMobile ? false : true}
                    outerRadius={isMobile ? 85 : 150}
                    innerRadius={isMobile ? 35 : 60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={isMobile ? 
                      undefined : 
                      ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {industryDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={INDUSTRY_DISTRIBUTION_COLORS[index % INDUSTRY_DISTRIBUTION_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend 
                    layout={isMobile ? "horizontal" : "vertical"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    align={isMobile ? "center" : "right"}
                    wrapperStyle={isMobile ? 
                      { 
                        paddingTop: 15, 
                        fontSize: "12px",
                        width: "100%",
                        marginBottom: "10px"
                      } : 
                      {
                        fontSize: "16px",
                        fontWeight: 500,
                        lineHeight: "2em",
                        paddingRight: "10px"
                      }
                    }
                    formatter={(value) => {
                      const item = industryDistributionData.find(item => item.name === value);
                      return `${value}: ${item?.value.toLocaleString()}`;
                    }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Count']}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}
        
        {/* Title and Revenue Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Title Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop8Titles()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    barSize={20}
                    maxBarSize={100}
                    onClick={() => setShowAllTitles(true)}
                  >
                    <defs>
                      <linearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 14 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      width={120}
                      tick={{ fill: '#475569', fontSize: 13 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#titleGradient)"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {getTop8Titles().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#titleGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDetailedRevenueDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={4}
                      cornerRadius={8}
                      dataKey="value"
                      onClick={() => setShowAllRevenues(true)}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                        percent,
                      }) => {
                        // Don't show labels on small screens
                        if (isMobile) return null;
                        
                        // Only show labels for segments that are at least 5% of the total
                        if (percent < 0.05) return null;
                        
                        const RADIAN = Math.PI / 180;
                        // Increase radius to push labels further out
                        const radius = 35 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        // Get the name from the data
                        const name = getDetailedRevenueDistribution()[index]?.name;
                        
                        // For segments on the right side, add extra spacing
                        const textAnchor = x > cx ? 'start' : 'end';
                        const xOffset = x > cx ? 5 : -5;

                        return (
                          <text
                            x={x + xOffset}
                            y={y}
                            textAnchor={textAnchor}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              fontSize: 13,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 1.5,
                            }}
                          >
                            {name}
                          </text>
                        );
                      }}
                    >
                      {getDetailedRevenueDistribution().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industry and Country Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industry Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Industry Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {getTop8Industries().map((entry, index) => (
                        <linearGradient key={`industryGradient-${index}`} id={`industryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={getTop8Industries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                        // For mobile, don't show labels for small screens
                        if (isMobile) return null;

                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              color: '#475569',
                              fontSize: isMobile ? 13 : 15,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Industries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                      onClick={(_, index) => {
                        setSelectedIndustryIndex(index);
                        setShowAllIndustries(true);
                      }}
                    >
                      {getTop8Industries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#industryGradient-${index})`}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {getTop8Countries().map((entry, index) => (
                        <linearGradient key={`countryGradient-${index}`} id={`countryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={getTop8Countries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                        // For mobile, don't show labels for small screens
                        if (isMobile) return null;

                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              color: '#475569',
                              fontSize: isMobile ? 13 : 15,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Countries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                      onClick={(_, index) => {
                        setSelectedCountryIndex(index);
                        setShowAllCountries(true);
                      }}
                    >
                      {getTop8Countries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#countryGradient-${index})`}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology and Employee Size Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Technology Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Technology Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop10Technologies()}
                    margin={{ top: 20, right: 10, left: 0, bottom: isMobile ? 80 : 60 }}
                    onClick={() => setShowAllTechnologies(true)}
                  >
                    <defs>
                      <linearGradient id="techGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name"
                      angle={-70}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: isMobile ? 13 : 15 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#techGradient)"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      maxBarSize={isMobile ? 15 : 25}
                    >
                      {getTop10Technologies().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#techGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Employee Size Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Employee Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getDetailedEmployeeSizeDistribution()}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    barSize={isMobile ? 15 : 20}
                    onClick={() => setShowAllEmployeeSizes(true)}
                  >
                    <defs>
                      <linearGradient id="employeeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      width={isMobile ? 70 : 90}
                      tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#employeeGradient)"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {getDetailedEmployeeSizeDistribution().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#employeeGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Industries Modal */}
      <Dialog open={showAllIndustries} onOpenChange={(open) => { setShowAllIndustries(open); if (!open) setSelectedIndustryIndex(null); }}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>All Industries Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.industries.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.industries}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: 'black' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.industries.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedIndustryIndex !== null ? COLORS[selectedIndustryIndex % COLORS.length] : COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Countries Modal */}
      <Dialog open={showAllCountries} onOpenChange={(open) => { setShowAllCountries(open); if (!open) setSelectedCountryIndex(null); }}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>All Countries Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.countries.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.countries}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: 'black' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.countries.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedCountryIndex !== null ? COUNTRY_COLORS[selectedCountryIndex % COUNTRY_COLORS.length] : COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Technologies Modal */}
      <Dialog open={showAllTechnologies} onOpenChange={setShowAllTechnologies}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Technologies Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.technologies.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.technologies}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="allTechGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={130}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allTechGradient)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Employee Sizes Modal */}
      <Dialog open={showAllEmployeeSizes} onOpenChange={setShowAllEmployeeSizes}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Employee Size Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={getDetailedEmployeeSizeDistribution()}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allEmployeeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allEmployeeGradient)"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                >
                  {getDetailedEmployeeSizeDistribution().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="url(#allEmployeeGradient)"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Revenue Distribution Modal */}
      <Dialog open={showAllRevenues} onOpenChange={setShowAllRevenues}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Revenue Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={getDetailedRevenueDistribution()}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allRevenueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#F06292" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F06292" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allRevenueGradient)"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                >
                  {getDetailedRevenueDistribution().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Titles Modal */}
      <Dialog open={showAllTitles} onOpenChange={setShowAllTitles}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Titles Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.titleDistribution.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.titleDistribution}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allTitlesGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={130}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#allTitlesGradient)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.titleDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="url(#allTitlesGradient)"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add this at the end of the file, before the last closing brace
const shineAnimation = `
  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  .animate-shine {
    animation: shine 2s infinite;
  }
`

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shineAnimation
  document.head.appendChild(style)
}

