"use client"

import { useState, useEffect } from "react"
import { Printer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { Icon, LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"
import { mapAPI, type PrinterWithLocation, type CreateMapLocationDto } from "@/lib/api/map-api"
import { toast } from "sonner"

interface PrinterMapProps {
  printers: PrinterWithLocation[]
  onLocationUpdate?: () => void
}

const defaultCenter: [number, number] = [10.762622, 106.660172] // Ho Chi Minh City

// Fix for default marker icon in Next.js
// This must run after leaflet is imported
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

// Custom marker colors
const createCustomIcon = (color: string, isSelected: boolean = false) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="${isSelected ? '#3b82f6' : '#ffffff'}" stroke-width="${isSelected ? '3' : '2'}"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function PrinterMap({ printers: initialPrinters, onLocationUpdate }: PrinterMapProps) {
  const [printers, setPrinters] = useState<PrinterWithLocation[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterWithLocation | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [printerPositions, setPrinterPositions] = useState<Map<string, [number, number]>>(new Map())
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter)

  useEffect(() => {
    loadPrintersWithLocations()
  }, [])

  const loadPrintersWithLocations = async () => {
    try {
      setLoading(true)
      const data = await mapAPI.getPrintersWithLocations()
      setPrinters(data)
      
      // Initialize printer positions from data
      // X = latitude, Y = longitude
      const positions = new Map<string, [number, number]>()
      data.forEach(printer => {
        if (printer.X !== null && printer.X !== undefined && printer.Y !== null && printer.Y !== undefined) {
          positions.set(printer.PrinterID, [printer.X, printer.Y])
        }
      })
      setPrinterPositions(positions)

      // Center map on first printer or default
      if (positions.size > 0) {
        const firstPos = Array.from(positions.values())[0]
        setMapCenter(firstPos)
      }
    } catch (error) {
      console.error("Error loading printers with locations:", error)
      toast.error("Không thể tải vị trí máy in")
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!selectedPrinter) return

    const newPositions = new Map(printerPositions)
    newPositions.set(selectedPrinter.PrinterID, [lat, lng])
    setPrinterPositions(newPositions)
  }

  const handleMarkerDragEnd = (printerId: string, e: any) => {
    const lat = e.target.getLatLng().lat
    const lng = e.target.getLatLng().lng

    const newPositions = new Map(printerPositions)
    newPositions.set(printerId, [lat, lng])
    setPrinterPositions(newPositions)

    // Update selected printer if it's the one being dragged
    const printer = printers.find(p => p.PrinterID === printerId)
    if (printer) {
      setSelectedPrinter(printer)
    }
  }

  const handleSaveLocation = async () => {
    if (!selectedPrinter) return

    const position = printerPositions.get(selectedPrinter.PrinterID)
    if (!position) {
      toast.error("Vui lòng đặt vị trí cho máy in trên bản đồ")
      return
    }

    try {
      setSaving(true)
      const data: CreateMapLocationDto = {
        PrinterID: selectedPrinter.PrinterID,
        X: position[0], // Store lat as X
        Y: position[1], // Store lng as Y
        Description: `${selectedPrinter.Name} location`,
      }

      await mapAPI.upsertMapLocation(selectedPrinter.PrinterID, data)
      toast.success("Đã lưu vị trí máy in thành công")
      await loadPrintersWithLocations()
      onLocationUpdate?.()
    } catch (error) {
      toast.error("Không thể lưu vị trí máy in")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#22c55e" // green
      case "BUSY":
        return "#eab308" // yellow
      default:
        return "#6b7280" // gray
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-xl">Bản đồ vị trí máy in</CardTitle>
          <CardDescription>
            Chọn máy in từ danh sách bên dưới, sau đó click vào bản đồ hoặc kéo thả marker để đặt vị trí.
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
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                
                {Array.from(printerPositions.entries()).map(([printerId, position]) => {
                  const printer = printers.find(p => p.PrinterID === printerId)
                  if (!printer) return null

                  const isSelected = selectedPrinter?.PrinterID === printerId
                  
                  return (
                    <Marker
                      key={printerId}
                      position={position}
                      draggable={isSelected}
                      icon={createCustomIcon(getMarkerColor(printer.Status), isSelected)}
                      eventHandlers={{
                        dragend: (e) => handleMarkerDragEnd(printerId, e),
                        click: () => {
                          setSelectedPrinter(printer)
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
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          </div>

          {selectedPrinter && (
            <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-white">{selectedPrinter.Name}</p>
                {printerPositions.has(selectedPrinter.PrinterID) && (
                  <p className="text-sm text-gray-400 mt-1">
                    Vị trí: {printerPositions.get(selectedPrinter.PrinterID)?.[0].toFixed(6)}, {printerPositions.get(selectedPrinter.PrinterID)?.[1].toFixed(6)}
                  </p>
                )}
                <p className="text-sm text-gray-400">
                  Trạng thái: {selectedPrinter.Status}
                </p>
              </div>
              <Button
                onClick={handleSaveLocation}
                disabled={saving || !printerPositions.has(selectedPrinter.PrinterID)}
                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white"
              >
                {saving ? "Đang lưu..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu vị trí
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-xl">Danh sách máy in</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400 py-4">Đang tải...</div>
          ) : printers.length === 0 ? (
            <div className="text-center text-gray-400 py-4">Chưa có máy in nào</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {printers.map((printer) => {
                const hasLocation = printerPositions.has(printer.PrinterID)
                return (
                  <button
                    key={printer.PrinterID}
                    onClick={() => {
                      setSelectedPrinter(printer)
                      if (hasLocation) {
                        const pos = printerPositions.get(printer.PrinterID)!
                        setMapCenter(pos)
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      selectedPrinter?.PrinterID === printer.PrinterID
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-[#2a2a2a] bg-[#0f0f0f] hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      <span className="font-medium">{printer.Name}</span>
                    </div>
                    {hasLocation ? (
                      <p className="text-xs text-gray-400 mt-1">
                        Đã đặt vị trí
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-400 mt-1">
                        Chưa có vị trí
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
