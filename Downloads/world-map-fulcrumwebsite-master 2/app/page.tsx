"use client"
import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

interface Location {
  id: string
  city: string
  country: string
  flag: string
  coordinates: [number, number] // [longitude, latitude] - adjusted for pin positioning
  originalCoordinates: [number, number] // [longitude, latitude] - actual location for Google Maps
  address: string
  postalCode: string
  region: string
  email: string
  googleMapsUrl?: string // Optional Google Maps URL
}

// Flag component matching the provided circular flag designs
const FlagIcon = ({ countryCode, size = 'normal' }: { countryCode: string; size?: 'small' | 'normal' | 'large' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    normal: 'w-10 h-10',
    large: 'w-14 h-14'

  };
  
  // UAE flag has a special layout: red vertical bar on left, then horizontal stripes
  if (countryCode === 'AE') {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full shadow-md overflow-hidden border border-gray-200 relative`}
        title={countryCode}
      >
        <div className="w-full h-full flex">
          {/* Red vertical bar on the left (1/4 width) */}
          <div className="w-1/4 bg-red-600"></div>
          {/* Three horizontal stripes on the right (3/4 width) */}
          <div className="w-3/4 flex flex-col">
            <div className="flex-1 bg-green-600"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-black"></div>
          </div>


        </div>
      </div>
    );
  }
  
  const flagStyles: { [key: string]: { stripes: string[] } } = {
    'AT': { 
      stripes: ['bg-red-500', 'bg-white', 'bg-red-500'] 
    }, // Austria - Red, White, Red
    'DE': { 
      stripes: ['bg-black', 'bg-red-500', 'bg-yellow-400'] 
    }, // Germany - Black, Red, Yellow
    'NL': { 
      stripes: ['bg-red-500', 'bg-white', 'bg-blue-600'] 
    }, // Netherlands - Red, White, Blue
  };
  
  const flag = flagStyles[countryCode] || { stripes: ['bg-gray-300'] };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full shadow-md overflow-hidden border border-gray-200`}
      title={countryCode}
    >
      <div className="w-full h-full flex flex-col">
        {flag.stripes.map((stripe, index) => (
          <div key={index} className={`flex-1 ${stripe}`}></div>
        ))}
      </div>
    </div>
  );
};

const locations: Location[] = [
  {
    id: "vienna",
    city: "Wien",
    country: "Österreich",
    flag: "🇦🇹",
    // Pin shifted 15px up (north) - offset south by ~0.35 degrees total
    coordinates: [16.3738, 47.8582],
    originalCoordinates: [16.3738, 48.2082],
    address: "Mariahilfer Straße 101/3/48-49, 1060 Vienna",
    postalCode: "1060",
    region: "Vienna",
    email: "office@fulcrum.at",
    googleMapsUrl: "https://maps.app.goo.gl/Ui5x2fcBZ2kst1fr6",
  },
  {
    id: "linz",
    city: "Linz",
    country: "Österreich",
    flag: "🇦🇹",
    coordinates: [14.2858, 47.9569],
    originalCoordinates: [14.2858, 48.3069],
    address: "Peter-Behrens-Platz 10, 2nd floor, 4010 Linz",
    postalCode: "4010",
    region: "Upper Austria",
    email: "office@fulcrum.at",
  },
  {
    id: "munich",
    city: "München",
    country: "Deutschland",
    flag: "🇩🇪",
    coordinates: [11.582, 47.7851],
    originalCoordinates: [11.582, 48.1351],
    address: "Rundfunkplatz 2, 80335 Munich",
    postalCode: "80335",
    region: "Bavaria",
    email: "office@fulcrum.de",
    googleMapsUrl: "https://maps.app.goo.gl/UB8HzKvxSw4nL6Mx5",
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "VAE",
    flag: "🇦🇪",
    coordinates: [55.2708, 24.8548],
    originalCoordinates: [55.2708, 25.2048],
    address: "Boulevard Plaza Tower 2, Downtown Dubai",
    postalCode: "00000",
    region: "Dubai Emirate",
    email: "office@fulcrum-consulting.ae",
    googleMapsUrl: "https://maps.app.goo.gl/kMgS2hRBD7TAuXyc6",
  },
  {
    id: "amstelveen",
    city: "Amstelveen",
    country: "Niederlande",
    flag: "🇳🇱",
    coordinates: [4.8647, 51.9578],
    originalCoordinates: [4.8647, 52.3078],
    address: "B.V. Prof. W.H. Keesomlaan 12, 1183 DJ Amstelveen",
    postalCode: "1183 DJ",
    region: "North Holland",
    email: "office@fulcrum-consulting.nl",
    googleMapsUrl: "https://maps.app.goo.gl/AHijch2RS2SJRfW6A",
  },
]

// World map topology URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const countryMapping: { [key: string]: string[] } = {
  Österreich: ["vienna", "linz"],
  Deutschland: ["munich"],
  "United Arab Emirates": ["dubai"],
  Niederlande: ["amstelveen"],
}

// Map of geography country names to our country names for better matching
const countryNameMap: { [key: string]: string } = {
  "Austria": "Österreich",
  "Germany": "Deutschland",
  "United Arab Emirates": "United Arab Emirates",
  "U.A.E.": "United Arab Emirates",
  "UAE": "VAE",
  "Netherlands": "Niederlande",
  "Österreich": "Österreich",
  "Deutschland": "Deutschland",
  "VAE": "VAE",
  "Niederlande": "Niederlande",
}

const getSelectedCountry = (selectedLocationId: string | null): string | null => {
  if (!selectedLocationId) return null

  for (const [countryName, locationIds] of Object.entries(countryMapping)) {
    if (locationIds.includes(selectedLocationId)) {
      return countryName
    }
  }
  return null
}

// Helper function to check if a geography country matches our selected country
const matchesSelectedCountry = (geoCountryName: string, selectedCountry: string | null): boolean => {
  if (!selectedCountry) return false
  
  // Direct match
  if (geoCountryName === selectedCountry) return true
  
  // Check mapped names
  const mappedName = countryNameMap[geoCountryName]
  if (mappedName === selectedCountry) return true
  
  // Case-insensitive match
  if (geoCountryName.toLowerCase() === selectedCountry.toLowerCase()) return true
  
  return false
}

export default function WorldMapInterface() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [animatingLocation, setAnimatingLocation] = useState<string | null>(null)

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(locationId)
    setAnimatingLocation(locationId)
    setTimeout(() => setAnimatingLocation(null), 3000)
  }

  const handleResetView = () => {
    setSelectedLocation(null)
  }

  const selectedCountry = getSelectedCountry(selectedLocation)

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-[60vh] md:h-[32rem]">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 bg-white p-4 space-y-2 my-0 shadow-none border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto md:overflow-visible">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300 my-4 ${
              selectedLocation === location.id
                ? "bg-red-50 border-2 border-red-200 shadow-md"
                : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
            }`}
            onClick={() => handleLocationClick(location.id)}
          >
            <div className="flex items-center space-x-3">
              <FlagIcon 
                countryCode={location.country === 'Österreich' ? 'AT' : 
                            location.country === 'Deutschland' ? 'DE' : 
                            location.country === 'VAE' ? 'AE' : 
                            location.country === 'Niederlande' ? 'NL' : 'XX'} 
                size="normal"
              />
              <div>
                <div className="font-medium text-gray-900">{location.city},</div>
                <div className="text-sm text-gray-600">{location.country}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500" />
          </div>
        ))}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden bg-white h-[24rem] md:h-auto">
        {selectedLocation && (
          <button
            onClick={handleResetView}
            className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition-all duration-200 hover:shadow-lg"
          >
            Clear Selection
          </button>
        )}

        <div className="relative w-full h-full">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 150,
              center: [0, 20],
            }}
            className="w-full h-full"
            style={{ background: "white" }}
          >
            <defs>
              <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BCBCBC" stopOpacity="1" />
                <stop offset="30%" stopColor="#BCBCBC" stopOpacity="1" />
                <stop offset="70%" stopColor="#BCBCBC" stopOpacity="1" />
                <stop offset="100%" stopColor="#BCBCBC" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="addressBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C00000" />
                <stop offset="50%" stopColor="#A00000" />
                <stop offset="100%" stopColor="#800000" />
              </linearGradient>
              <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C00000" />
                <stop offset="25%" stopColor="#C00000" />
                <stop offset="50%" stopColor="#C00000" />
                <stop offset="75%" stopColor="#C00000" />
                <stop offset="100%" stopColor="#C00000" />
              </linearGradient>
              <radialGradient id="pinHighlight" cx="25%" cy="15%" r="60%">
                <stop offset="0%" stopColor="#C00000" stopOpacity="1" />
                <stop offset="30%" stopColor="#C00000" stopOpacity="1" />
                <stop offset="100%" stopColor="#C00000" stopOpacity="1" />
              </radialGradient>
              <radialGradient id="pinShadow" cx="70%" cy="80%" r="50%">
                <stop offset="0%" stopColor="#434B50" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2C3439" stopOpacity="0.3" />
              </radialGradient>
              <radialGradient id="orbGradient" cx="30%" cy="20%" r="70%">
                <stop offset="0%" stopColor="#D4D4D4" />
                <stop offset="30%" stopColor="#C8C8C8" />
                <stop offset="70%" stopColor="#BCBCBC" />
                <stop offset="100%" stopColor="#B0B0B0" />
              </radialGradient>
              <radialGradient id="orbHighlight" cx="25%" cy="25%" r="40%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
              <filter id="addressBoxShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.3" />
              </filter>
            </defs>

            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const countryName =
                    geo.properties?.NAME ||
                    geo.properties?.name ||
                    geo.properties?.NAME_EN ||
                    geo.properties?.ADMIN ||
                    ""
                  const isSelectedCountry = matchesSelectedCountry(countryName, selectedCountry)

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelectedCountry ? "#C00000" : "#BCBCBC"}
                      stroke={isSelectedCountry ? "#C00000" : "#3e4143"}
                      strokeWidth={isSelectedCountry ? 1 : 0.5}
                      className="transition-all duration-500 ease-out"
                      style={{
                        default: { outline: "none" },
                        hover: {
                          outline: "none",
                          fill: isSelectedCountry ? "#C00000" : "#C00000",
                          stroke: "#C00000",
                          strokeWidth: 0.8,
                          transform: "scale(1.02)",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Location Markers - Only show selected location */}
            {selectedLocation && locations.filter(loc => loc.id === selectedLocation).map((location) => (
              <Marker key={location.id} coordinates={location.coordinates}>
                <g className="cursor-pointer" onClick={() => handleLocationClick(location.id)}>
                  {true && (
                    <g>
                      <g>
                        <rect
                          x={-110}
                          y={-170}
                          width={220}
                          height={100}
                          fill="white"
                          rx={18}
                          ry={18}
                          stroke="#e5e7eb"
                          strokeWidth={1.5}
                          filter="url(#addressBoxShadow)"
                        />

                        <rect x={-105} y={-168} width={210} height={3} fill="#C00000" rx={12} />

                        <foreignObject x={-100} y={-155} width="200" height="75">
                          <div className="text-sm text-gray-700 leading-tight">
                            <div className="mb-2">
                              {location.googleMapsUrl ? (
                                <a 
                                  href={location.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-700 hover:text-red-500 underline"
                                >
                                  {location.address}
                                </a>
                              ) : (
                                <span className="text-gray-700">{location.address}</span>
                              )}
                            </div>
                            <div>
                              <a href={`mailto:${location.email}`} className="text-sm font-medium text-gray-900 hover:text-red-500">
                                {location.email}
                              </a>
                            </div>
                          </div>
                        </foreignObject>

                        <text
                          x={-100}
                          y={-28}
                          textAnchor="start"
                          className="fill-gray-400 font-medium"
                          style={{ fontSize: "11px" }}
                        >
                          {location.region}
                        </text>
                      </g>

                      <g>
                        <polygon
                          points="0,-35 -12,-32 12,-32"
                          fill="white"
                          stroke="#e5e7eb"
                          strokeWidth={1.5}
                          filter="url(#addressBoxShadow)"
                        />
                        <polygon points="0,-33 -10,-30 10,-30" fill="#BCBCBC" />
                      </g>
                    </g>
                  )}

                  {/* Polished 3D Teardrop Pin */}
                  <g transform="translate(0, -20)">
                    {/* Soft ground shadow */}
                    <ellipse
                      cx={0}
                      cy={12}
                      rx={16}
                      ry={8}
                      fill="rgba(0,0,0,0.12)"
                      opacity={0.6}
                      style={{ filter: "blur(3px)" }}
                    />
                    
                    {/* Main pin body - Glossy teardrop */}
                    <path
                      d="M0,-22 C-8,-22 -14,-15 -14,-8 C-14,-4 -12,-1 -9,2 L0,12 L9,2 C12,-1 14,-4 14,-8 C14,-15 8,-22 0,-22 Z"
                      fill="url(#pinGradient)"
                      stroke="none"
                      className="transition-all duration-500 ease-out scale-150"
                      style={{ 
                        filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.3))"
                      }}
                    />
                    
                    {/* Top highlight for glossy effect */}
                    <path
                      d="M0,-22 C-8,-22 -14,-15 -14,-8 C-14,-4 -12,-1 -9,2 L0,12 L9,2 C12,-1 14,-4 14,-8 C14,-15 8,-22 0,-22 Z"
                      fill="url(#pinHighlight)"
                      stroke="none"
                    />
                    
                    {/* Bottom shadow for depth */}
                    <path
                      d="M0,-22 C-8,-22 -14,-15 -14,-8 C-14,-4 -12,-1 -9,2 L0,12 L9,2 C12,-1 14,-4 14,-8 C14,-15 8,-22 0,-22 Z"
                      fill="url(#pinShadow)"
                      stroke="none"
                    />
                    
                    {/* Inner circular cutout with depth */}
                    <circle
                      r={6}
                      fill="#F2F2F2"
                      stroke="#BCBCBC"
                      strokeWidth={1}
                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                    />
                    
                    {/* Spherical orb with 3D effect */}
                    <circle
                      r={4.5}
                      fill="#F2F2F2"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth={0.5}
                      style={{ 
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                      }}
                    />
                    
                    {/* Orb highlight for spherical effect */}
                    <circle
                      r={3}
                      fill="#F2F2F2"
                      stroke="none"
                    />
                    
                    {/* Subtle orb inner shadow */}
                    <circle
                      r={4.5}
                      fill="none"
                      stroke="#BCBCBC"
                      strokeWidth={1}
                    />
                  </g>

                  {/* Info Box Below Pin */}
                  <g>
                    <g>
                      <polygon
                        points="0,10 -12,13 12,13"
                        fill="white"
                        stroke="#e5e7eb"
                        strokeWidth={1.5}
                        filter="url(#addressBoxShadow)"
                      />
                      <polygon points="0,12 -10,15 10,15" fill="#BCBCBC" />
                    </g>

                    <g>
                      <rect
                        x={-90}
                        y={15}
                        width={180}
                        height={80}
                        fill="white"
                        rx={18}
                        ry={18}
                        stroke="#e5e7eb"
                        strokeWidth={1.5}
                        filter="url(#addressBoxShadow)"
                      />

                      <rect x={-85} y={92} width={170} height={3} fill="#C00000" rx={12} />

                      <foreignObject x={-80} y={30} width="40" height="40">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <FlagIcon 
                            countryCode={location.country === 'Österreich' ? 'AT' : 
                                        location.country === 'Deutschland' ? 'DE' : 
                                        location.country === 'VAE' ? 'AE' : 
                                        location.country === 'Niederlande' ? 'NL' : 'XX'} 
                            size="normal"
                          />
                          
                        </div>
                      </foreignObject>

                      <text
                        x={-30}
                        y={47}
                        textAnchor="start"
                        className="fill-gray-900 font-bold"
                        style={{ fontSize: "18px" }}
                      >
                        {location.city}
                      </text>

                      <text
                        x={-30}
                        y={65}
                        textAnchor="start"
                        className="fill-gray-500 font-medium"
                        style={{ fontSize: "14px" }}
                      >
                        {location.country}
                      </text>
                    </g>
                  </g>

                  {animatingLocation === location.id && (
                    <g>
                      <circle
                        r={30}
                        fill="none"
                        stroke="#515A5F"
                        strokeWidth={4}
                        opacity={0.9}
                        className="animate-ping"
                      />
                      <circle
                        r={50}
                        fill="none"
                        stroke="#515A5F"
                        strokeWidth={3}
                        opacity={0.6}
                        className="animate-ping"
                        style={{ animationDelay: "0.3s" }}
                      />
                      <circle
                        r={70}
                        fill="none"
                        stroke="#515A5F"
                        strokeWidth={2}
                        opacity={0.3}
                        className="animate-ping"
                        style={{ animationDelay: "0.6s" }}
                      />
                    </g>
                  )}
                </g>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </div>
    </div>
  )
}
