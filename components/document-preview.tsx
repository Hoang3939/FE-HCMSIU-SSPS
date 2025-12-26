"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Dynamic import PDF.js to avoid SSR issues
let pdfjsLib: any = null

interface DocumentPreviewProps {
  documentId: string
  fileName: string
  pageCount: number
  paperSize?: "A4" | "A3"
  orientation?: "PORTRAIT" | "LANDSCAPE"
  pageRange?: string // "all" or "1-5, 8" format
  copies?: number
  doubleSided?: boolean
  pagesPerSheet?: number // Số trang mỗi tờ (1, 2, 4, 6, 9, 16, etc.)
  className?: string
}

export function DocumentPreview({
  documentId,
  fileName,
  pageCount,
  paperSize = "A4",
  orientation = "PORTRAIT",
  pageRange = "all",
  copies = 1,
  doubleSided = false,
  pagesPerSheet = 1,
  className,
}: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [renderedPages, setRenderedPages] = useState<Map<number, string>>(new Map())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<any>(null)

  const previewUrl = `/api/documents/${documentId}/preview`
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Parse page range to get list of pages to display
  const getPagesToDisplay = (): number[] => {
    if (pageRange === "all") {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }
    
    // Parse custom range like "1-5, 8, 10-12"
    const pages: number[] = []
    const parts = pageRange.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= pageCount) {
            pages.push(i)
          }
        }
      } else {
        const page = Number(part)
        if (page >= 1 && page <= pageCount) {
          pages.push(page)
        }
      }
    }
    
    return pages.length > 0 ? pages : [1]
  }

  const pagesToDisplay = getPagesToDisplay()
  // Calculate total sheets needed (considering pages per sheet)
  const totalSheets = Math.ceil((pagesToDisplay.length * copies) / pagesPerSheet)
  const displayPageCount = totalSheets

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      if (typeof window === "undefined") return
      
      setLoading(true)
      setError(null)
      setRenderedPages(new Map())

      try {
        // Dynamically import PDF.js if not loaded
        if (!pdfjsLib) {
          pdfjsLib = await import("pdfjs-dist")
          // Use unpkg CDN (works reliably with Turbopack, no need for local file)
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        }

        const studentId = localStorage.getItem('student-id') || '87338eec-dd46-49ae-a59a-f3d61cc16915'
        
        const response = await fetch(`${apiBaseUrl}${previewUrl}`, {
          headers: {
            'x-student-id': studentId,
          },
        })

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`
          let errorDetails: any = null
          
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
            errorDetails = errorData
          } catch {
            const text = await response.text().catch(() => '')
            if (text) {
              try {
                const parsed = JSON.parse(text)
                errorMessage = parsed.message || parsed.error || errorMessage
                errorDetails = parsed
              } catch {
                errorMessage = text.substring(0, 200)
              }
            }
          }
          
          // Special handling for LibreOffice errors
          if (response.status === 500 && errorMessage.includes('LibreOffice')) {
            if (errorMessage.includes('exit code 1')) {
              errorMessage = 'LibreOffice không thể convert file Word này. Có thể file bị lỗi hoặc có vấn đề về định dạng. Vui lòng thử file khác hoặc kiểm tra file có mở được trong Word không.'
            } else if (errorMessage.includes('không được cài đặt')) {
              errorMessage = 'LibreOffice chưa được cài đặt. Vui lòng cài LibreOffice để xem preview file Word/PPT.'
            }
          }
          
          throw new Error(errorMessage)
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setCurrentPage(1)
        setLoading(false)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải preview. Vui lòng thử lại.')
        setLoading(false)
      }
    }

    loadPDF()
  }, [documentId, previewUrl, apiBaseUrl])

  // Calculate grid layout for pages per sheet
  const getGridLayout = (pagesPerSheet: number) => {
    // Common layouts: 1=1x1, 2=1x2, 4=2x2, 6=2x3, 9=3x3, 16=4x4
    const layouts: Record<number, { cols: number; rows: number }> = {
      1: { cols: 1, rows: 1 },
      2: { cols: 1, rows: 2 },
      4: { cols: 2, rows: 2 },
      6: { cols: 2, rows: 3 },
      9: { cols: 3, rows: 3 },
      16: { cols: 4, rows: 4 },
    }
    
    if (layouts[pagesPerSheet]) {
      return layouts[pagesPerSheet]
    }
    
    // For custom values, calculate best fit
    const cols = Math.ceil(Math.sqrt(pagesPerSheet))
    const rows = Math.ceil(pagesPerSheet / cols)
    return { cols, rows }
  }

  // Render pages to canvas (supports multiple pages per sheet)
  const renderPages = async (pageNums: number[], canvas: HTMLCanvasElement) => {
    if (!pdfDoc || !pdfjsLib || pageNums.length === 0) return

    try {
      // Cancel previous render task if exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      const grid = getGridLayout(pagesPerSheet)
      const dimensions = getPreviewDimensions()
      const dpr = window.devicePixelRatio || 1
      
      // Set canvas size
      canvas.width = dimensions.width * dpr * (zoom / 100)
      canvas.height = dimensions.height * dpr * (zoom / 100)
      
      const context = canvas.getContext('2d')
      if (!context) return

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.scale(dpr, dpr)
      
      // Calculate size for each page in the grid
      const pageWidth = (dimensions.width * (zoom / 100)) / grid.cols
      const pageHeight = (dimensions.height * (zoom / 100)) / grid.rows
      
      // Add padding between pages
      const padding = 4
      const actualPageWidth = pageWidth - padding * 2
      const actualPageHeight = pageHeight - padding * 2

      // Render each page
      const renderPromises: Promise<void>[] = []
      
      for (let i = 0; i < Math.min(pageNums.length, pagesPerSheet); i++) {
        const pageNum = pageNums[i]
        if (!pageNum) continue
        
        const row = Math.floor(i / grid.cols)
        const col = i % grid.cols
        const x = col * pageWidth + padding
        const y = row * pageHeight + padding

        renderPromises.push(
          (async () => {
            try {
              const page = await pdfDoc.getPage(pageNum)
              const viewport = page.getViewport({ scale: 1.0 })
              
              // Calculate scale to fit in allocated space
              const scale = Math.min(
                actualPageWidth / viewport.width,
                actualPageHeight / viewport.height
              )
              
              const scaledViewport = page.getViewport({ scale })
              
              // Save context, translate, render, restore
              context.save()
              context.translate(x, y)
              
              const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
              }
              
              await page.render(renderContext).promise
              context.restore()
            } catch (err) {
              console.error(`Error rendering page ${pageNum}:`, err)
            }
          })()
        )
      }

      await Promise.all(renderPromises)
      renderTaskRef.current = null
    } catch (err) {
      // Ignore cancellation errors
      if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
        return
      }
      console.error('Error rendering pages:', err)
      renderTaskRef.current = null
    }
  }

  // Calculate preview dimensions based on paper size and orientation
  const getPreviewDimensions = () => {
    const a4Width = 210 // mm
    const a4Height = 297 // mm
    const a3Width = 297 // mm
    const a3Height = 420 // mm

    let width = paperSize === "A4" ? a4Width : a3Width
    let height = paperSize === "A4" ? a4Height : a3Height

    if (orientation === "LANDSCAPE") {
      ;[width, height] = [height, width]
    }

    // Convert mm to pixels (96 DPI)
    const mmToPx = 3.779527559
    return {
      width: width * mmToPx,
      height: height * mmToPx,
    }
  }

  // Render current page(s) when PDF doc, page, or settings change
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || pagesToDisplay.length === 0) return

    // Calculate which pages to render on current sheet
    const startIndex = (currentPage - 1) * pagesPerSheet
    const pagesToRender = pagesToDisplay.slice(startIndex, startIndex + pagesPerSheet)
    
    if (pagesToRender.length === 0) return

    // Small delay to ensure previous render is cancelled
    const timeoutId = setTimeout(() => {
      renderPages(pagesToRender, canvasRef.current!)
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      // Cancel render task on cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [pdfDoc, currentPage, paperSize, orientation, zoom, pagesToDisplay, pagesPerSheet])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= displayPageCount) {
      setCurrentPage(page)
    }
  }

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const resetZoom = () => {
    setZoom(100)
  }

  const dimensions = getPreviewDimensions()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Page Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Tờ {currentPage} / {displayPageCount} {pagesPerSheet > 1 && `(${pagesPerSheet} trang/tờ)`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= displayPageCount}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview Container */}
        <div 
          ref={containerRef}
          className="relative border rounded-lg bg-gray-100 overflow-auto flex justify-center items-start p-4" 
          style={{ maxHeight: '600px', minHeight: '400px' }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <p className="text-red-600 text-center px-4">{error}</p>
            </div>
          )}
          {pdfDoc && (
            <canvas
              ref={canvasRef}
              className="border border-gray-300 shadow-lg bg-white"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          )}
        </div>

        {/* Settings Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>
            Khổ giấy: {paperSize} • Hướng: {orientation === "PORTRAIT" ? "Dọc" : "Ngang"}
          </p>
          {pageRange !== "all" && (
            <p>Trang in: {pageRange}</p>
          )}
          {copies > 1 && (
            <p>Số bản: {copies} • {doubleSided ? "Hai mặt" : "Một mặt"}</p>
          )}
          {pagesPerSheet > 1 && (
            <p>Số trang mỗi tờ: {pagesPerSheet}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
