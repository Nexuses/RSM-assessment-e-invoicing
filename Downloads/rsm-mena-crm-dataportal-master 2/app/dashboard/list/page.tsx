"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ChevronDown, ChevronUp, Grid, List, LayoutList, Calendar } from "lucide-react"
import { DataItems } from "@/components/user/data-items"
import Filter from "@/app/components/Filter"
import { useQuery } from "@tanstack/react-query"
import { useCacheInvalidation } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ListTable, ListItem } from "@/components/user/list-table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface File {
  id: string
  name: string
  description: string
  data: any[]
}

interface DataRow {
  [key: string]: string;
}

// Function to get a consistent color based on file name
const getFileColor = (fileName: string) => {
  const colors = [
    { bg: "#F3E8FF", text: "#6B21A8" }, // Purple
    { bg: "#DBEAFE", text: "#1E40AF" }, // Blue
    { bg: "#FEF3C7", text: "#92400E" }, // Yellow
    { bg: "#D1FAE5", text: "#065F46" }  // Green
  ];
  
  // Simple hash function to get consistent color for same file name
  const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Function to determine status based on file data
const determineStatus = (file: File): "active" | "pending" | "archived" | "completed" => {
  // This is a placeholder logic - you can implement your own logic based on your data
  const date = new Date(file.description.split(' ').pop() || new Date());
  const now = new Date();
  const daysDifference = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference < 7) return "active";
  if (daysDifference < 30) return "pending";
  if (daysDifference < 90) return "completed";
  return "active";
};

// Function to format the date from file data
const formatDate = (file: File): string => {
  try {
    // Try to extract date from description or use current date
    // In a real implementation, you would extract the actual date from the file metadata
    // For now, we'll use a random date within the last 120 days for demonstration
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 120); // Random number between 0 and 120
    const date = new Date(now);
    date.setDate(now.getDate() - randomDaysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
};

// Function to convert files to list items
const filesToListItems = (files: File[]): ListItem[] => {
  return files.map(file => ({
    id: file.id,
    name: file.name,
    accounts: file.description,
    contacts: file.data?.length || 0,
    date: formatDate(file),
    status: determineStatus(file)
  }));
};

// Define time filter options
type TimeFilterOption = "all" | "last7days" | "last30days" | "last90days";

export default function ListPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [key, setKey] = useState(0) // Add a key to force remount of DataItems
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table")
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("all")
  const [filteredListItems, setFilteredListItems] = useState<ListItem[]>([])
  
  // Track if we've loaded initial data
  const initialDataLoaded = useRef(false)
  
  // Get cache invalidation functions
  const { setUserLoggedIn, userId } = useCacheInvalidation();

  // Use React Query to fetch and cache data
  const { data: files = [], isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['userData', userId],
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
        
        // If we have a user ID, set it in the cache context
        if (data && data.userId) {
          setUserLoggedIn(data.userId);
        }
        
        return data.dataFiles.map((file: any) => ({
          id: file.id,
          name: file.title,
          description: file.filename.replace(/\.csv$/, ''),
          data: file.data
        }))
      } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
      }
    },
    staleTime: Infinity, // Never consider data stale to prevent refetching
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount
    retry: 0, // Don't retry failed requests
    refetchOnReconnect: false,
    refetchInterval: false // Disable polling
  });

  // Extract fileId from URL when component mounts or when URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fileId = urlParams.get('fileId');
      
      // If we have a fileId in the URL and files data is loaded
      if (fileId && files && files.length > 0) {
        // Find the file with matching ID
        const fileToSelect = fileId === 'all-files' 
          ? {
              id: 'all-files',
              name: 'All Contacts',
              description: 'Combined data from all files',
              data: files.reduce((acc: any[], file: File) => [...acc, ...(file.data || [])], [] as any[])
            }
          : files.find((file: File) => file.id === fileId);
          
        if (fileToSelect) {
          // Set selected file and force remount of DataItems
          setSelectedFile(fileToSelect);
          setKey(prevKey => prevKey + 1);
        }
      }
    }
  }, [files]);

  // Define handleFileClick function for card/grid/list view clicks
  const handleFileClick = (file: File) => {
    console.log("File clicked:", file.name);
    
    // Set selected file and force remount of DataItems
    setSelectedFile(file);
    setKey(prevKey => prevKey + 1);
    
    // Update URL without page reload
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('fileId', file.id);
      window.history.pushState({}, '', url);
    }
  }

  // Function to filter list items by date
const filterItemsByDate = (items: ListItem[], filter: TimeFilterOption): ListItem[] => {
  // Always include the "All Contacts" item
  const allContactsItem = items.find(item => item.id === 'all-files');
  
  if (filter === "all") {
    return items;
  }
  
  const now = new Date();
  const filteredItems = items.filter(item => {
    // Always include the "All Contacts" item
    if (item.id === 'all-files') return true;
    
    const itemDate = new Date(item.date);
    const daysDifference = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (filter) {
      case "last7days":
        return daysDifference <= 7;
      case "last30days":
        return daysDifference <= 30;
      case "last90days":
        return daysDifference <= 90;
      default:
        return true;
    }
  });
  
  return filteredItems;
};

// Convert files to list items when files data changes
useEffect(() => {
  if (files && files.length > 0) {
    // Calculate total records
    const recordsCount = files.reduce((acc: number, file: File) => acc + (file.data?.length || 0), 0);
    setTotalRecords(recordsCount);
    
    // Update list items
    const items = filesToListItems(files);
    
    // Add "All Contacts" item to the list items for table view
    const allContactsItem: ListItem = {
      id: 'all-files',
      name: 'All Contacts',
      accounts: 'Combined data from all files',
      contacts: recordsCount,
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    const fullListItems = [allContactsItem, ...items];
    setListItems(fullListItems);
    
    // Apply time filter
    const filtered = filterItemsByDate(fullListItems, timeFilter);
    setFilteredListItems(filtered);
    
    // If this is the first data load, check for fileId in URL
    if (!initialDataLoaded.current) {
      initialDataLoaded.current = true;
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const fileId = urlParams.get('fileId');
        
        if (fileId) {
          // Find the file with matching ID
          const fileToSelect = fileId === 'all-files' 
            ? {
                id: 'all-files',
                name: 'All Contacts',
                description: 'Combined data from all files',
                data: files.reduce((acc: any[], file: File) => [...acc, ...(file.data || [])], [] as any[])
              }
            : files.find((file: File) => file.id === fileId);
            
          if (fileToSelect) {
            // Set selected file and force remount of DataItems
            setSelectedFile(fileToSelect);
            setKey(prevKey => prevKey + 1);
          }
        }
      }
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [files]);

// Apply time filter when it changes
useEffect(() => {
  if (listItems.length > 0) {
    const filtered = filterItemsByDate(listItems, timeFilter);
    setFilteredListItems(filtered);
  }
}, [timeFilter, listItems]);

  const handleApplyFilters = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
  }

  const handleListItemClick = (item: ListItem) => {
    // Special handling for "All Contacts" item
    if (item.id === 'all-files') {
      if (files.length === 0 || totalRecords === 0) return;
      
      const allFilesData: File = {
        id: 'all-files',
        name: 'All Contacts',
        description: 'Combined data from all files',
        data: files.reduce((acc: any[], file: File) => [...acc, ...(file.data || [])], [] as any[])
      }
      
      // Set selected file and force remount of DataItems
      setSelectedFile(allFilesData);
      setKey(prevKey => prevKey + 1);
      
      // Update URL without page reload
      if (typeof window !== 'undefined' && window.history) {
        const url = new URL(window.location.href);
        url.searchParams.set('fileId', 'all-files');
        window.history.pushState({}, '', url);
      }
      
      return;
    }
    
    // Regular file handling
    const file = files.find((f: File) => f.id === item.id);
    if (file) {
      console.log("File selected:", file.name);
      
      // Set selected file and force remount of DataItems
      setSelectedFile(file);
      setKey(prevKey => prevKey + 1);
      
      // Update URL without page reload
      if (typeof window !== 'undefined' && window.history) {
        const url = new URL(window.location.href);
        url.searchParams.set('fileId', file.id);
        window.history.pushState({}, '', url);
      }
    } else {
      console.warn("File not found for ID:", item.id);
    }
  }

  // Determine which files to display based on showAllFiles state
  const displayedFiles = showAllFiles ? files : files.slice(0, 5);

  // Render a file card - used in both grid and list views
  const renderFileCard = (file: File, index: number) => {
    const fileColor = getFileColor(file.name);
    
    if (viewMode === "list") {
      return (
        <div 
          key={file.id}
          className="flex items-center justify-between p-3 border border-[#F3F4F6] hover:border-[#9CA3AF] rounded-lg bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
          onClick={() => {
            if (!file.data || file.data.length === 0) return;
            handleFileClick(file);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ backgroundColor: fileColor.bg }}>
              <FileText className="h-5 w-5" style={{ color: fileColor.text }} />
            </div>
            <div>
              <h3 className="font-medium text-[#111827]">{file.name}</h3>
              <p className="text-sm text-[#6B7280]">{file.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: fileColor.bg, color: fileColor.text }}>
              {file.data?.length || 0} records
            </span>
            <span className="text-xs text-[#9CA3AF]">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      );
    }
    
    return (
      <Card 
        key={file.id} 
        className="group hover:shadow-md transition-all duration-300 cursor-pointer border border-[#F3F4F6] hover:border-[#9CA3AF] bg-white"
        onClick={() => {
          if (!file.data || file.data.length === 0) {
            return; // Don't allow clicking if no data
          }
          handleFileClick(file)
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-[#111827] group-hover:text-black">
              {file.name}
            </CardTitle>
            <p className="text-sm text-[#6B7280] line-clamp-2">
              {file.description}
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ backgroundColor: fileColor.bg, padding: "0.5rem", borderRadius: "0.5rem" }}>
            <FileText className="h-5 w-5" style={{ color: fileColor.text }} />
            <span className="text-sm font-medium" style={{ color: fileColor.text }}>
              {file.data?.length || 0}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fileColor.text }} />
              <span className="text-xs text-[#6B7280]">Click to view details</span>
            </div>
            <div className="text-xs text-[#9CA3AF]">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render the All Contacts card
  const renderAllContactsCard = () => {
    if (viewMode === "list") {
      return (
        <div 
          className="flex items-center justify-between p-3 border border-[#F3F4F6] hover:border-[#9CA3AF] rounded-lg bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
          onClick={() => {
            if (files.length === 0 || totalRecords === 0) return;
            const allFilesData: File = {
              id: 'all-files',
              name: 'All Contacts',
              description: 'Combined data from all files',
              data: files.reduce((acc: any[], file: File) => [...acc, ...(file.data || [])], [] as any[])
            }
            handleFileClick(allFilesData);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md flex items-center justify-center bg-[#DBEAFE]">
              <FileText className="h-5 w-5 text-[#1E40AF]" />
            </div>
            <div>
              <h3 className="font-medium text-[#111827]">All Contacts</h3>
              <p className="text-sm text-[#6B7280]">Combined data from all files</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1E40AF]">
              {totalRecords}
            </span>
            <span className="text-xs text-[#9CA3AF]">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      );
    }
    
    return (
      <Card 
        className="group hover:shadow-md transition-all duration-300 cursor-pointer border border-[#F3F4F6] hover:border-[#9CA3AF] bg-white"
        onClick={() => {
          if (files.length === 0 || totalRecords === 0) {
            return; // Don't allow clicking if no data
          }
          const allFilesData: File = {
            id: 'all-files',
            name: 'All Contacts',
            description: 'Combined data from all files',
            data: files.reduce((acc: any[], file: File) => [...acc, ...(file.data || [])], [] as any[])
          }
          handleFileClick(allFilesData)
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-[#111827] group-hover:text-black">
              All Contacts
            </CardTitle>
            <p className="text-sm text-[#6B7280] line-clamp-2">
              Combined data from all files
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#DBEAFE] p-2 rounded-lg">
            <FileText className="h-5 w-5 text-[#1E40AF]" />
            <span className="text-sm font-medium text-[#1E40AF]">
              {totalRecords} 
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1E40AF]" />
              <span className="text-xs text-[#6B7280]">Click to view all data</span>
            </div>
            <div className="text-xs text-[#9CA3AF]">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || (!files.length && isFetching)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-red-500">
        <div>Error loading data. Please refresh the page or try again later.</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 overflow-hidden max-w-full p-4">
        {!selectedFile ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h1 className="text-2xl font-semibold text-[#111827]">Prospect Lists</h1>
              <div className="flex flex-wrap items-center gap-2">
                {/* Time Filter Dropdown */}
                <div className="flex items-center mr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1 px-3">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {timeFilter === "all" && "All Time"}
                          {timeFilter === "last7days" && "Last 7 Days"}
                          {timeFilter === "last30days" && "Last 30 Days"}
                          {timeFilter === "last90days" && "Last 90 Days"}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTimeFilter("all")}>
                        All Time
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("last7days")}>
                        Last 7 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("last30days")}>
                        Last 30 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("last90days")}>
                        Last 90 Days
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">View as:</span>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list" | "table")} className="rounded-md bg-white">
                    <ToggleGroupItem value="grid" aria-label="Grid View" className="text-gray-700 bg-gray-50 data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:font-medium hover:bg-gray-200 flex items-center gap-1 px-3">
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Tiles</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List View" className="text-gray-700 bg-gray-50 data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:font-medium hover:bg-gray-200 flex items-center gap-1 px-3">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="Table View" className="text-gray-700 bg-gray-50 data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:font-medium hover:bg-gray-200 flex items-center gap-1 px-3">
                      <LayoutList className="h-4 w-4" />
                      <span className="hidden sm:inline">Table</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {renderAllContactsCard()}
                {displayedFiles.map((file: File, index: number) => renderFileCard(file, index))}
                
                {files.length === 0 && (
                  <div className="col-span-3 text-center p-8 text-[#6B7280]">
                    No data files found. Please check back later.
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-2">
                {renderAllContactsCard()}
                {displayedFiles.map((file: File, index: number) => renderFileCard(file, index))}
                
                {files.length === 0 && (
                  <div className="text-center p-8 text-[#6B7280]">
                    No data files found. Please check back later.
                  </div>
                )}
              </div>
            ) : (
              // Table view - using our ListTable component with real data
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Lists Overview</h2>
                  <p className="text-sm text-gray-500">Manage your contact lists and their details</p>
                </div>
                {filteredListItems.length > 0 ? (
                  <ListTable data={filteredListItems} onRowClick={handleListItemClick} />
                ) : (
                  <div className="text-center p-8 text-[#6B7280]">
                    No data files found for the selected time period. Try changing the time filter.
                  </div>
                )}
              </div>
            )}

            {/* Show All / Show Less Button - Only show for grid and list views */}
            {viewMode !== "table" && files.length > 5 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="flex items-center gap-2 border-[#9CA3AF] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
                >
                  {showAllFiles ? (
                    <>
                      Show Less <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show All Files ({files.length}) <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2 w-full overflow-hidden">
            <div className="flex flex-col">
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  
                  // Clear fileId from URL
                  if (typeof window !== 'undefined' && window.history) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('fileId');
                    window.history.pushState({}, '', url);
                  }
                }}
                className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors w-fit group mb-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="lucide lucide-arrow-left group-hover:-translate-x-1 transition-transform"
                >
                  <path d="m12 19-7-7 7-7"/>
                  <path d="M19 12H5"/>
                </svg>
                Back to Files
              </button>
            </div>
            
            {/* Use the key prop to force remount of DataItems when the file changes */}
            <DataItems 
              key={key}
              selectedFileIndex={selectedFile.id === 'all-files' ? 0 : files.findIndex((f: File) => f.id === selectedFile.id)}
              activeFilters={activeFilters}
              setIsFilterOpen={setIsFilterOpen}
              allFilesData={selectedFile.id === 'all-files' ? selectedFile.data : undefined}
            />
          </div>
        )}
      </div>
      
      {/* Filter component positioned at the root level */}
      {selectedFile && (
        <Filter
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApplyFilters={handleApplyFilters}
          data={selectedFile.data}
        />
      )}
    </>
  )
} 