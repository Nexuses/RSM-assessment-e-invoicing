'use client';

import { useState, useEffect } from 'react';
import { XCircle, ChevronDown, X, Search } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataRow {
  [key: string]: any;  // Make it accept any column name
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSection {
  title: string;
  options: FilterOption[];
  multiSelect: boolean;
}

interface FilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, string[]>) => void;
  data: DataRow[];
}

// Helper function to get unique values from an array
const getUniqueValues = (arr: any[]): string[] => {
  return Array.from(new Set(arr.filter(Boolean))).sort();
};

// Helper function to check if a value is numeric
const isNumeric = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value.replace(/[^0-9.-]+/g, "")));
};

// Helper function to check if a string might contain a number range
const isRange = (value: string): boolean => {
  return /\d+\s*-\s*\d+/.test(value) || /^[<>]\s*\d+/.test(value);
};

// Helper function to parse numeric values for sorting
const parseNumericValue = (value: string): number => {
  const num = value.replace(/[^0-9.-]+/g, "");
  return parseFloat(num) || 0;
};

// Helper function to determine if a column should be filterable
const isFilterableColumn = (columnName: string, values: any[]): boolean => {
  // Always include these columns regardless of unique value count
  const alwaysInclude = ['Title', 'Technologies', 'Industry', 'Employees_Size', 'Annual_Revenue', 'Country'];
  const lower = columnName.toLowerCase();
  // Always include pipeline-centric fields
  if (lower === 'stage' || lower === 'solution') return true;
  
  // Explicitly exclude these columns
  const alwaysExclude = ['first_name', 'First_Name', 'FirstName', 'first name', 'First Name'];
  
  // Check if this column should be explicitly excluded
  if (alwaysExclude.includes(columnName) || alwaysExclude.includes(columnName.toLowerCase())) {
    return false;
  }
  
  if (alwaysInclude.includes(columnName)) {
    return true;
  }

  // Skip columns that are likely to be unique identifiers or URLs
  const nonFilterablePatterns = [
    /id$/i,
    /url/i,
    /link/i,
    /^_/,
    /password/i,
    /email/i,
    /phone/i,
    /address/i,
  ];
  
  // Explicitly exclude "First Name" filter and its variations
  const lowerColumnName = columnName.toLowerCase();
  
  // Check for exact matches first
  if (lowerColumnName === "first name" || 
      lowerColumnName === "first_name" || 
      lowerColumnName === "firstname" ||
      lowerColumnName === "first") {
    return false;
  }
  
  // Check if the column name contains both "first" and "name" as separate words
  if (lowerColumnName.includes("first") && lowerColumnName.includes("name")) {
    return false;
  }

  if (nonFilterablePatterns.some(pattern => pattern.test(columnName))) {
    return false;
  }

  // Get unique values count
  const uniqueValues = new Set(values.filter(Boolean));
  
  // Column should be filterable if:
  // 1. It has some values (not all null/empty)
  // 2. It has more than 1 unique value
  // 3. It has fewer unique values than 50% of total rows (to avoid columns with mostly unique values)
  return uniqueValues.size > 1 && uniqueValues.size < values.length * 0.5;
};

// Add these predefined categories
const EMPLOYEE_SIZE_CATEGORIES = [
  { label: "1-10", value: "1-10" },
  { label: "11-20", value: "11-20" },
  { label: "21-50", value: "21-50" },
  { label: "51-100", value: "51-100" },
  { label: "101-200", value: "101-200" },
  { label: "201-500", value: "201-500" },
  { label: "501-1000", value: "501-1000" },
  { label: "1001-2000", value: "1001-2000" },
  { label: "2001-5000", value: "2001-5000" },
  { label: "5001-10000", value: "5001-10000" },
  { label: "10001+", value: "10001+" }
];

const REVENUE_CATEGORIES = [
  { label: "< 1M", value: "lt1M" },
  { label: "1M - 50M", value: "1M-50M" },
  { label: "50M+", value: "gt50M" }
];

// Helper function to categorize employee size
const categorizeEmployeeSize = (size: string): string => {
  const count = parseInt(size.replace(/[^0-9]/g, '')) || 0;
  
  if (count <= 10) return "1-10";
  if (count <= 20) return "11-20";
  if (count <= 50) return "21-50";
  if (count <= 100) return "51-100";
  if (count <= 200) return "101-200";
  if (count <= 500) return "201-500";
  if (count <= 1000) return "501-1000";
  if (count <= 2000) return "1001-2000";
  if (count <= 5000) return "2001-5000";
  if (count <= 10000) return "5001-10000";
  return "10001+";
};

// Helper function to categorize revenue
const categorizeRevenue = (revenue: string): string => {
  const amount = parseFloat(revenue.replace(/[^0-9.-]+/g, "")) || 0;
  if (amount < 1000000) return "lt1M";
  if (amount <= 50000000) return "1M-50M";
  return "gt50M";
};

export default function Filter({ isOpen, onClose, onApplyFilters, data }: FilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [filterSections, setFilterSections] = useState<FilterSection[]>([]);
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [filteredOptions, setFilteredOptions] = useState<Record<string, FilterOption[]>>({});

  // Generate filter sections from data
  useEffect(() => {
    if (!data || data.length === 0) return;

    const generateFilterSections = () => {
      const sections: FilterSection[] = [];
      
      // Get all columns from the data
      const columns = Object.keys(data[0]);

      columns.forEach(column => {
        const values = data.map(item => item[column]);
        
        // Skip if column shouldn't be filterable
        if (!isFilterableColumn(column, values)) return;

        // Special handling for Technologies column
        if (column === 'Technologies' || column.toLowerCase() === 'technologies') {
          // Get unique technologies from comma-separated values
          const uniqueTechnologies = getUniqueValues(
            values.flatMap(value => 
              value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : []
            )
          );

          if (uniqueTechnologies.length > 0) {
            sections.push({
              title: column,
              options: uniqueTechnologies.map(tech => ({
                label: tech,
                value: tech
              })),
              multiSelect: true
            });
          }
          return;
        }

        // Special handling for Employee Size
        if (column === 'Employees_Size') {
          sections.push({
            title: column,
            options: EMPLOYEE_SIZE_CATEGORIES,
            multiSelect: true
          });
          return;
        }

        // Special handling for Revenue
        if (column === 'Annual_Revenue') {
          sections.push({
            title: column,
            options: REVENUE_CATEGORIES,
            multiSelect: true
          });
          return;
        }

        // Handle other columns
        let uniqueValues = getUniqueValues(
          values.flatMap(value => 
            typeof value === 'string' && value.includes(',') 
              ? value.split(',').map(v => v.trim()) 
              : value
          )
        );

        // Sort values based on their type
        uniqueValues.sort((a, b) => {
          // Check if values are numeric or ranges
          const isNumericValues = isNumeric(a) && isNumeric(b);
          const isRangeValues = isRange(a) && isRange(b);

          if (isNumericValues || isRangeValues) {
            return parseNumericValue(a) - parseNumericValue(b);
          }
          
          // Default to string comparison
          return a.localeCompare(b);
        });

        sections.push({
          title: column,
          options: uniqueValues.map(value => ({ 
            label: value, 
            value: value.toString() 
          })),
          multiSelect: true
        });
      });

      // Ensure Stage and Solution exist and are prioritized when present in the data
      const ensureKey = (key: string) => {
        const hasKey = sections.some(s => s.title.toLowerCase() === key)
        if (!hasKey && columns.some(c => c.toLowerCase() === key)) {
          const col = columns.find(c => c.toLowerCase() === key) as string
          const options = getUniqueValues(data.map(r => r[col]).filter(Boolean))
          sections.push({ title: col, options: options.map(v => ({ label: v, value: v })), multiSelect: true })
        }
      }
      ensureKey('stage')
      ensureKey('solution')

      // Case-insensitive priority ordering; put stage/solution first if present
      const priorityOrderCI = ['stage', 'solution', 'industry', 'title', 'designation', 'account_name', 'company_name', 'country', 'technologies', 'employees_size', 'annual_revenue']
      sections.sort((a, b) => {
        const aKey = a.title.toLowerCase()
        const bKey = b.title.toLowerCase()
        const aIndex = priorityOrderCI.indexOf(aKey)
        const bIndex = priorityOrderCI.indexOf(bKey)
        if (aIndex === -1 && bIndex === -1) return aKey.localeCompare(bKey)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })

      setFilterSections(sections);
      
      // Initialize filtered options with all options
      const initialFilteredOptions: Record<string, FilterOption[]> = {};
      sections.forEach(section => {
        initialFilteredOptions[section.title] = section.options;
      });
      setFilteredOptions(initialFilteredOptions);
    };

    generateFilterSections();
  }, [data]);

  // Function to handle filter selection
  const handleFilterSelect = (section: string, value: string, label: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters[section]) {
        newFilters[section] = [];
      }
      
      if (newFilters[section].includes(value)) {
        // Remove the filter if already selected
        newFilters[section] = newFilters[section].filter(v => v !== value);
      } else {
        // Add the filter
        newFilters[section] = [...newFilters[section], value];
      }
      
      // Remove empty arrays
      if (newFilters[section].length === 0) {
        delete newFilters[section];
      }
      
      return newFilters;
    });
  };

  // Function to remove a filter
  const removeFilter = (section: string, value: string) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (newFilters[section]) {
        newFilters[section] = newFilters[section].filter(v => v !== value);
        
        // Remove empty arrays
        if (newFilters[section].length === 0) {
          delete newFilters[section];
        }
      }
      
      // Use setTimeout to apply filters after the state update is complete
      setTimeout(() => {
        // Create a deep copy to work with
        const processedFilters = JSON.parse(JSON.stringify(newFilters));
        
        // Process Revenue filters
        if (processedFilters['Annual_Revenue']) {
          processedFilters['Annual_Revenue'] = processedFilters['Annual_Revenue'].map((value: string) => {
            switch (value) {
              case 'lt1M': return '< 1M';
              case '1M-50M': return '1M - 50M';
              case 'gt50M': return '50M+';
              default: return value;
            }
          });
        }
        
        // Apply filters
        onApplyFilters(processedFilters);
      }, 0);
      
      return newFilters;
    });
  };

  // Initialize filter sections when data changes
  useEffect(() => {
    // Close any open dropdowns when the filter panel closes
    if (!isOpen) {
      setOpenSection(null);
    }
  }, [isOpen]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({});
    
    // Close any open dropdowns
    setOpenSection(null);
    
    // Apply the empty filters
    onApplyFilters({});
  };

  // Apply filters
  const handleApply = () => {
    // Close any open dropdowns
    const openDropdowns = document.querySelectorAll('[data-state="open"]');
    openDropdowns.forEach((dropdown) => {
      (dropdown as HTMLElement).click();
    });

    // Create a deep copy to work with
    const currentFilters = JSON.parse(JSON.stringify(selectedFilters));
    const processedFilters = { ...currentFilters };
    
    // Process Employee Size filters - no mapping needed as values match labels now
    // The values are already in the correct format (e.g., "1-10", "11-20", etc.)

    // Process Revenue filters
    if (processedFilters['Annual_Revenue']) {
      processedFilters['Annual_Revenue'] = processedFilters['Annual_Revenue'].map((value: string) => {
        switch (value) {
          case 'lt1M': return '< 1M';
          case '1M-50M': return '1M - 50M';
          case 'gt50M': return '50M+';
          default: return value;
        }
      });
    }

    // Apply filters and close the filter modal after a short delay
    setTimeout(() => {
      onApplyFilters(processedFilters);
      onClose();
    }, 10);
  };

  const getSelectedLabel = (section: string, value: string) => {
    const sectionConfig = filterSections.find(s => s.title === section);
    return sectionConfig?.options.find(opt => opt.value === value)?.label || value;
  };

  // Function to handle search input changes
  const handleSearchInputChange = (section: string, value: string) => {
    setSearchInputs(prev => ({ ...prev, [section]: value }));
    
    // Find the section configuration
    const sectionConfig = filterSections.find(s => s.title === section);
    if (!sectionConfig) return;
    
    // Filter options based on search input
    if (value.trim() === '') {
      // If search input is empty, show all options
      setFilteredOptions(prev => ({ ...prev, [section]: sectionConfig.options }));
    } else {
      // Create a regex for flexible matching
      try {
        // Case insensitive search that matches anywhere in the string
        const searchRegex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        
        const filtered = sectionConfig.options.filter(option => 
          searchRegex.test(option.label)
        );
        
        setFilteredOptions(prev => ({ ...prev, [section]: filtered }));
      } catch (e) {
        // If regex fails, fall back to simple includes
        const filtered = sectionConfig.options.filter(option => 
          option.label.toLowerCase().includes(value.toLowerCase())
        );
        
        setFilteredOptions(prev => ({ ...prev, [section]: filtered }));
      }
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] m-0 p-0 ${!isOpen ? 'pointer-events-none' : ''}`} 
      style={{ margin: 0, padding: 0 }}
    >
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[90%] md:w-80 lg:w-96 bg-[#1C1C1C] shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l border-white/20 overflow-hidden ${!isOpen ? 'pointer-events-none' : ''}`}
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-full text-gray-400 hover:text-white touch-manipulation"
              aria-label="Close filter panel"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            {filterSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <div className="text-sm font-medium text-gray-300">
                  {section.title.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                
                <div className="relative">
                  {/* Selected Items Display - Mobile optimized */}
                  <div 
                    className="min-h-[48px] bg-[#1C1C1C] rounded-md px-4 py-3 cursor-pointer border border-gray-800 hover:border-gray-700 active:bg-gray-900/50 transition-colors"
                    onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                  >
                    <div className="flex flex-wrap gap-2 pr-8">
                      {selectedFilters[section.title]?.length ? (
                        selectedFilters[section.title].map(value => (
                          <span 
                            key={value} 
                            className="inline-flex items-center gap-1.5 bg-white/10 text-white text-sm rounded-full px-3 py-1.5"
                          >
                            {getSelectedLabel(section.title, value)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFilter(section.title, value);
                              }}
                              className="hover:text-gray-300 p-0.5 active:bg-white/5 rounded-full"
                              aria-label={`Remove ${getSelectedLabel(section.title, value)} filter`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 py-1">Select {section.title.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}...</span>
                      )}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                        openSection === section.title ? 'transform rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Text Input and Filtered Options - Mobile optimized */}
                  {openSection === section.title && section.options.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-[#1C1C1C] border border-gray-800 rounded-md shadow-lg">
                      {/* Search input field */}
                      <div className="p-2 border-b border-gray-800 relative">
                        <input
                          type="text"
                          placeholder={`Search ${section.title.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}...`}
                          className="w-full bg-[#2C2C2C] text-white px-3 py-2 rounded-md pl-9 focus:outline-none focus:ring-1 focus:ring-gray-700"
                          value={searchInputs[section.title] || ''}
                          onChange={(e) => handleSearchInputChange(section.title, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                      
                      {/* Filtered options */}
                      <div className="py-1.5 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        {filteredOptions[section.title]?.length > 0 ? (
                          filteredOptions[section.title].map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center px-4 py-3 cursor-pointer transition-colors touch-manipulation ${
                                selectedFilters[section.title]?.includes(option.value)
                                  ? 'bg-white/10 text-white'
                                  : 'text-gray-400 hover:bg-gray-900 hover:text-white active:bg-gray-800'
                              }`}
                              onClick={() => handleFilterSelect(section.title, option.value, option.label)}
                            >
                              {option.label}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500">No matching options</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-gray-800 mb-safe">
          <div className="flex justify-between gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-900 active:bg-gray-800 rounded-md transition-colors flex-1 touch-manipulation"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-3 text-sm bg-white text-black hover:bg-gray-200 active:bg-gray-300 rounded-md transition-colors flex-1 font-medium touch-manipulation"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 