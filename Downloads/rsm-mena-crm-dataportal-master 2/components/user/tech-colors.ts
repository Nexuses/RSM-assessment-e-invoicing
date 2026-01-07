// Define color mapping for technology badges
export const TECH_COLORS: Record<string, { bg: string, text: string }> = {
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
export const TECH_KEYWORDS: Record<string, { bg: string, text: string }> = {
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
};

// Helper function to get technology badge colors
export const getTechBadgeColors = (tech: string): { bg: string, text: string } => {
  // Try to find an exact match first
  if (TECH_COLORS[tech]) {
    return TECH_COLORS[tech];
  }
  
  // If no exact match, try to find a partial match
  const techLower = tech.toLowerCase();
  for (const [key, value] of Object.entries(TECH_COLORS)) {
    if (techLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // If still no match, try to match by keywords
  for (const [keyword, value] of Object.entries(TECH_KEYWORDS)) {
    if (techLower.includes(keyword.toLowerCase())) {
      return value;
    }
  }
  
  // Assign colors based on the first letter of the technology
  const firstChar = tech.charAt(0).toLowerCase();
  const colorMap: Record<string, { bg: string, text: string }> = {
    'a': { bg: "bg-red-100", text: "text-red-800" },
    'b': { bg: "bg-orange-100", text: "text-orange-800" },
    'c': { bg: "bg-amber-100", text: "text-amber-800" },
    'd': { bg: "bg-yellow-100", text: "text-yellow-800" },
    'e': { bg: "bg-lime-100", text: "text-lime-800" },
    'f': { bg: "bg-green-100", text: "text-green-800" },
    'g': { bg: "bg-emerald-100", text: "text-emerald-800" },
    'h': { bg: "bg-teal-100", text: "text-teal-800" },
    'i': { bg: "bg-cyan-100", text: "text-cyan-800" },
    'j': { bg: "bg-sky-100", text: "text-sky-800" },
    'k': { bg: "bg-blue-100", text: "text-blue-800" },
    'l': { bg: "bg-indigo-100", text: "text-indigo-800" },
    'm': { bg: "bg-violet-100", text: "text-violet-800" },
    'n': { bg: "bg-purple-100", text: "text-purple-800" },
    'o': { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
    'p': { bg: "bg-pink-100", text: "text-pink-800" },
    'q': { bg: "bg-rose-100", text: "text-rose-800" },
    'r': { bg: "bg-red-100", text: "text-red-800" },
    's': { bg: "bg-orange-100", text: "text-orange-800" },
    't': { bg: "bg-amber-100", text: "text-amber-800" },
    'u': { bg: "bg-yellow-100", text: "text-yellow-800" },
    'v': { bg: "bg-lime-100", text: "text-lime-800" },
    'w': { bg: "bg-green-100", text: "text-green-800" },
    'x': { bg: "bg-emerald-100", text: "text-emerald-800" },
    'y': { bg: "bg-teal-100", text: "text-teal-800" },
    'z': { bg: "bg-cyan-100", text: "text-cyan-800" },
  };
  
  return colorMap[firstChar] || { bg: "bg-gray-100", text: "text-gray-800" };
};

// Define color mapping for industry badges with Tailwind classes
export const INDUSTRY_COLORS: Record<string, { bg: string, text: string }> = {
  "Staffing & Recruiting": { bg: "bg-purple-100", text: "text-purple-800" },
  "Hospital & Health Care": { bg: "bg-blue-100", text: "text-blue-800" },
  "Information Technology": { bg: "bg-amber-100", text: "text-amber-800" },
  "Banking": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Nonprofit Organization": { bg: "bg-purple-100", text: "text-purple-800" },
  "Real Estate": { bg: "bg-amber-100", text: "text-amber-800" },
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
};

// Helper function to get industry badge colors
export const getIndustryBadgeColors = (industry: string): { bg: string, text: string } => {
  // Try to find an exact match first
  if (INDUSTRY_COLORS[industry]) {
    return INDUSTRY_COLORS[industry];
  }
  
  // If no exact match, try to find a partial match in industry names
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_COLORS)) {
    if (industryLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default color for industries
  return { bg: "bg-purple-100", text: "text-purple-800" };
}; 