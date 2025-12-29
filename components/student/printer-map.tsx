"use client"

import { useState, useEffect } from "react"
import { Printer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { Icon } from "leaflet"
import "leaflet/dist/leaflet.css"
import { mapAPI, type PrinterWithLocation } from "@/lib/api/map-api"

interface PrinterMapProps {
  selectedPrinterId?: string
  onPrinterSelect?: (printerId: string) => void
}

const defaultCenter: [number, number] = [10.762622, 106.660172] // Ho Chi Minh City

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

// Custom marker with label
const createCustomIcon = (color: string, label: string, isSelected: boolean = false) => {
  return new L.DivIcon({
    html: `
      <div style="position: relative; text-align: center;">
        <div style="
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          pointer-events: none;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${label}</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="${isSelected ? '#3b82f6' : '#ffffff'}" stroke-width="${isSelected ? '3' : '2'}"/>
        </svg>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

// const createUserIcon = () => {
//   return new Icon({
//     iconUrl: `data:image/svg+xml;base64,${btoa(`
//       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
//         <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
//       </svg>
//     `)}`,
//     iconSize: [24, 24],
//     iconAnchor: [12, 12],
//   })
// }

// function MapCenter({ center }: { center: [number, number] }) {
//   const map = useMap()
//   useEffect(() => {
//     map.setView(center, map.getZoom())
//   }, [center, map])
//   return null
// }

export function PrinterMap({ selectedPrinterId, onPrinterSelect }: PrinterMapProps) {
  const [printers, setPrinters] = useState<PrinterWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter)

  useEffect(() => {
    loadPrinters()
  }, [])

  useEffect(() => {
    if (selectedPrinterId) {
      const printer = printers.find(p => p.PrinterID === selectedPrinterId)
      if (printer && printer.X !== null && printer.Y !== null) {
        setMapCenter([printer.X, printer.Y])
      }
    }
  }, [selectedPrinterId, printers])

  const loadPrinters = async () => {
    try {
      setLoading(true)
      const data = await mapAPI.getPublicPrintersWithLocations()
      const printersWithLocation = data.filter(p => p.X !== null && p.Y !== null)
      setPrinters(printersWithLocation)
      
      if (printersWithLocation.length > 0 && printersWithLocation[0].X !== null && printersWithLocation[0].Y !== null) {
        setMapCenter([printersWithLocation[0].X, printersWithLocation[0].Y])
      }
    } catch (error) {
      console.error("Error loading printers:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#22c55e"
      case "BUSY":
        return "#eab308"
      default:
        return "#6b7280"
    }
  }

  const selectedPrinter = printers.find(p => p.PrinterID === selectedPrinterId)

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
      <CardHeader>
        <CardTitle>Bản đồ vị trí máy in</CardTitle>
        <CardDescription>
          Click vào máy in để xem hướng dẫn đường đi. Click chuột phải vào bản đồ để đặt vị trí của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <MapCenter center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Printer markers */}
              {printers.map((printer) => {
                if (printer.X === null || printer.Y === null) return null

                const position: [number, number] = [printer.X, printer.Y]
                const isSelected = selectedPrinterId === printer.PrinterID

                // Format label: "name - (BUILDINGROOM)"
                const buildingRoom = printer.Building && printer.Room 
                  ? `${printer.Building}${printer.Room}`
                  : printer.Building || printer.Room || ''
                const label = buildingRoom 
                  ? `${printer.Name} - (${buildingRoom})`
                  : printer.Name

                return (
                  <Marker
                    key={printer.PrinterID}
                    position={position}
                    icon={createCustomIcon(getMarkerColor(printer.Status), label, isSelected)}
                    eventHandlers={{
                      click: () => {
                        onPrinterSelect?.(printer.PrinterID)
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-black">
                        <p className="font-bold">{printer.Name}</p>
                        <p className="text-sm text-gray-600">Trạng thái: {printer.Status}</p>
                        {printer.Building && (
                          <p className="text-sm text-gray-600">Tòa nhà: {printer.Building}</p>
                        )}
                        {printer.Room && (
                          <p className="text-sm text-gray-600">Phòng: {printer.Room}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>


        {loading ? (
          <div className="text-center text-gray-400 py-4">Đang tải...</div>
        ) : printers.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            Không có máy in nào có vị trí trên bản đồ
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer) => (
              <button
                key={printer.PrinterID}
                onClick={() => {
                  onPrinterSelect?.(printer.PrinterID)
                  if (printer.X !== null && printer.Y !== null) {
                    setMapCenter([printer.X, printer.Y])
                  }
                }}
                className={`p-3 rounded-lg border transition-colors text-left ${
                  selectedPrinterId === printer.PrinterID
                    ? "border-blue-500 bg-blue-900/20"
                    : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#2a2a2a]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  <span className="font-medium">{printer.Name}</span>
                </div>
                {printer.Building && (
                  <p className="text-xs text-gray-400 mt-1">
                    {printer.Building}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
