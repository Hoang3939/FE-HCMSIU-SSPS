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
  const abortControllerRef = useRef<AbortController | null>(null)

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
    // Create new abort controller for this effect
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    const loadPDF = async (retryCount = 0, isInitialLoad = false) => {
      if (typeof window === "undefined") return
      
      // Check if component was unmounted or documentId changed
      if (abortController.signal.aborted) {
        return
      }
      
      // Small delay on initial load to give backend time to start conversion
      if (isInitialLoad && retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (abortController.signal.aborted) return
      }
      
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
          signal: abortController.signal,
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
          
          // Retry logic for server errors (backend might be converting file)
          // Only retry for 500/503 errors and not for specific LibreOffice errors
          // Backend has 30s timeout for LibreOffice conversion, so we retry up to 5 times with increasing delays
          const isRetryableError = 
            (response.status === 500 || response.status === 503) &&
            !errorMessage.includes('exit code 1') &&
            !errorMessage.includes('không thể convert') &&
            !errorMessage.includes('không được cài đặt') &&
            !errorMessage.includes('chưa được cài đặt') &&
            !errorMessage.includes('timeout') && // Don't retry if backend already timed out
            retryCount < 5 // Max 5 retries (total ~28 seconds)
          
          if (isRetryableError) {
            // Check if aborted before retry
            if (abortController.signal.aborted) {
              return
            }
            
            // Wait before retry with exponential backoff: 2s, 3s, 5s, 8s, 10s
            // This gives backend up to ~28 seconds to convert (backend timeout is 30s)
            const delays = [2000, 3000, 5000, 8000, 10000]
            const delay = delays[retryCount] || 10000
            console.log(`[DocumentPreview] Backend might be converting file. Retrying in ${delay}ms (attempt ${retryCount + 1}/5)...`)
            
            // Wait with abort check
            await new Promise<void>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                if (!abortController.signal.aborted) {
                  resolve()
                } else {
                  reject(new Error('Aborted'))
                }
              }, delay)
              
              abortController.signal.addEventListener('abort', () => {
                clearTimeout(timeoutId)
                reject(new Error('Aborted'))
              })
            }).catch(() => {
              // Aborted, stop retrying
              return
            })
            
            // Check again before retry
            if (!abortController.signal.aborted) {
              return loadPDF(retryCount + 1, false)
            }
          }
          
          // Special handling for LibreOffice errors
          if (response.status === 500 && errorMessage.includes('LibreOffice')) {
            if (errorMessage.includes('exit code 1') || errorMessage.includes('không thể convert')) {
              errorMessage = 'LibreOffice không thể convert file này sang PDF để preview. Có thể file bị lỗi, bị mã hóa, hoặc có vấn đề về định dạng. Vui lòng thử file khác hoặc kiểm tra file có mở được trong Word/PowerPoint không.'
            } else if (errorMessage.includes('không được cài đặt') || errorMessage.includes('chưa được cài đặt')) {
              errorMessage = 'LibreOffice chưa được cài đặt trên server. Vui lòng liên hệ quản trị viên để cài LibreOffice để xem preview file Word/PPT.'
            } else if (errorMessage.includes('timeout')) {
              errorMessage = 'Quá trình convert mất quá nhiều thời gian. File có thể quá lớn hoặc phức tạp. Vui lòng thử lại sau.'
            }
          }
          
          // If it's a 404 or file not found error
          if (response.status === 404) {
            errorMessage = 'Không tìm thấy file để preview. File có thể đã bị xóa hoặc không tồn tại.'
          }
          
          // Only log error after all retries failed
          if (!isRetryableError) {
            console.error('[DocumentPreview] Error loading PDF:', {
              status: response.status,
              errorMessage,
              documentId,
              fileName,
              retryCount,
            })
          }
          
          // Set error and stop loading - don't throw to avoid unhandled errors
          setError(errorMessage)
          setLoading(false)
          setPdfDoc(null)
          return
        }

        // Check content type before processing
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/pdf')) {
          const errorMsg = 'Server không trả về file PDF. Có thể file không thể convert sang PDF.'
          console.error('[DocumentPreview] Invalid content type:', contentType)
          setError(errorMsg)
          setLoading(false)
          setPdfDoc(null)
          return
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        
        // Cancel any existing render tasks before loading new PDF
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setCurrentPage(1)
        setLoading(false)
        setError(null) // Clear any previous errors
      } catch (err) {
        // Ignore abort errors (component unmounted or documentId changed)
        if (err instanceof Error && (err.name === 'AbortError' || err.message === 'Aborted')) {
          return
        }
        
        // Ignore if aborted
        if (abortController.signal.aborted) {
          return
        }
        
        console.error('Error loading PDF:', err)
        
        // Cancel any render tasks on error
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }
        
        setError(err instanceof Error ? err.message : 'Không thể tải preview. Vui lòng thử lại.')
        setLoading(false)
        setPdfDoc(null)
      }
    }

    loadPDF(0, true) // Start with initial load flag to give backend time

    return () => {
      // Abort any ongoing fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      // Cleanup: cancel any render tasks and clear state
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
      setPdfDoc(null)
      setRenderedPages(new Map())
      setError(null)
    }
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
              
              const renderTask = page.render(renderContext)
              // Store render task for cancellation
              if (!renderTaskRef.current) {
                renderTaskRef.current = renderTask
              }
              await renderTask.promise
              context.restore()
            } catch (err) {
              // Ignore cancellation errors
              if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
                return
              }
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
    // Don't render if there's an error or no PDF doc
    if (error || !pdfDoc || !canvasRef.current || pagesToDisplay.length === 0) {
      // Clear canvas if there's an error
      if (error && canvasRef.current) {
        const context = canvasRef.current.getContext('2d')
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      return
    }

    // Calculate which pages to render on current sheet
    const startIndex = (currentPage - 1) * pagesPerSheet
    const pagesToRender = pagesToDisplay.slice(startIndex, startIndex + pagesPerSheet)
    
    if (pagesToRender.length === 0) return

    // Small delay to ensure previous render is cancelled
    const timeoutId = setTimeout(() => {
      // Double check PDF doc still exists and no error before rendering
      if (!error && pdfDoc && canvasRef.current) {
        renderPages(pagesToRender, canvasRef.current)
      }
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      // Cancel render task on cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [pdfDoc, currentPage, paperSize, orientation, zoom, pagesToDisplay, pagesPerSheet, error])

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
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-semibold mb-2">Không thể tải preview</p>
                    <p className="text-red-700 text-sm leading-relaxed mb-3">{error}</p>
                    {error.includes('LibreOffice') && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-red-600 text-xs mb-2 font-medium">Gợi ý:</p>
                        <ul className="text-red-600 text-xs space-y-1 list-disc list-inside">
                          <li>Kiểm tra file có mở được trong Word/PowerPoint không</li>
                          <li>Thử upload lại file hoặc chuyển sang định dạng PDF</li>
                          <li>File có thể bị password bảo vệ hoặc bị lỗi định dạng</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
