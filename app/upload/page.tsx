"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { FileText, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { uploadDocument, getUserBalance } from "@/lib/api"
import { getUploadLimits } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"

interface UploadedDocument {
  id: string
  fileName: string
  pageCount: number
  fileSize: number
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})
  const [balance, setBalance] = useState(0)
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number | null>(null)
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt"])
  const [fileErrors, setFileErrors] = useState<{ [key: number]: string }>({})
  const router = useRouter()

  // Load balance and max file size on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const balanceData = await getUserBalance()
        setBalance(balanceData.balancePages)
      } catch (error) {
        console.error('Error loading balance:', error)
      }
      
      try {
        const limits = await getUploadLimits()
        setMaxFileSizeMB(limits.max_file_size_mb)
        // Cập nhật allowed file types từ config (thêm dấu chấm vào đầu)
        const typesWithDot = limits.allowed_file_types.map(type => `.${type.toLowerCase()}`)
        setAllowedFileTypes(typesWithDot)
      } catch (error) {
        console.error('Error loading upload limits:', error)
        // Fallback to default if can't load config
        setMaxFileSizeMB(100)
        setAllowedFileTypes([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt"])
      }
    }
    loadData()
  }, [])

  // allowedTypes giờ được lấy từ SystemConfigs (state allowedFileTypes)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type - sử dụng allowedFileTypes từ SystemConfigs
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowedFileTypes.includes(ext)) {
      return {
        valid: false,
        error: `Định dạng file "${ext.toUpperCase()}" không được phép upload. Chỉ được phép upload các loại tệp: ${allowedFileTypes.map(t => t.toUpperCase()).join(", ")}`
      }
    }

    // Check file size if maxFileSizeMB is loaded
    if (maxFileSizeMB !== null) {
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > maxFileSizeMB) {
        return {
          valid: false,
          error: `File quá lớn! Kích thước tối đa là ${maxFileSizeMB}MB (file hiện tại: ${fileSizeMB.toFixed(2)}MB)`
        }
      }
    }

    return { valid: true }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const newErrors: { [key: number]: string } = {}
    
    droppedFiles.forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      // Kiểm tra extension trước
      if (!allowedFileTypes.includes(ext)) {
        const fileIndex = files.length + validFiles.length
        newErrors[fileIndex] = `Định dạng file "${ext.toUpperCase()}" không được phép upload`
        toast.error(`File "${file.name}" không được phép upload!`, {
          description: `Chỉ được phép upload các loại tệp: ${allowedFileTypes.map(t => t.toUpperCase()).join(", ")}`,
          duration: 5000,
          icon: <AlertCircle className="h-5 w-5" />,
        })
        return
      }
      
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        const fileIndex = files.length + validFiles.length
        newErrors[fileIndex] = validation.error || 'File không hợp lệ'
        if (validation.error?.includes('quá lớn')) {
          toast.error(`File "${file.name}" quá lớn!`, {
            description: validation.error,
            duration: 5000,
            icon: <AlertCircle className="h-5 w-5" />,
          })
        } else if (validation.error?.includes('không được phép')) {
          toast.error(`File "${file.name}" không được phép upload!`, {
            description: validation.error,
            duration: 5000,
            icon: <AlertCircle className="h-5 w-5" />,
          })
        } else {
          toast.error(`File "${file.name}" không hợp lệ`, {
            description: validation.error,
            duration: 4000,
          })
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setFileErrors((prev) => ({ ...prev, ...newErrors }))
    }
    setFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles: File[] = []
      const newErrors: { [key: number]: string } = {}
      
      selectedFiles.forEach((file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase()
        // Kiểm tra extension trước
        if (!allowedFileTypes.includes(ext)) {
          const fileIndex = files.length + validFiles.length
          newErrors[fileIndex] = `Định dạng file "${ext.toUpperCase()}" không được phép upload`
          toast.error(`File "${file.name}" không được phép upload!`, {
            description: `Chỉ được phép upload các loại tệp: ${allowedFileTypes.map(t => t.toUpperCase()).join(", ")}`,
            duration: 5000,
            icon: <AlertCircle className="h-5 w-5" />,
          })
          return
        }
        
        const validation = validateFile(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          const fileIndex = files.length + validFiles.length
          newErrors[fileIndex] = validation.error || 'File không hợp lệ'
          if (validation.error?.includes('quá lớn')) {
            toast.error(`File "${file.name}" quá lớn!`, {
              description: validation.error,
              duration: 5000,
              icon: <AlertCircle className="h-5 w-5" />,
            })
          } else if (validation.error?.includes('không được phép')) {
            toast.error(`File "${file.name}" không được phép upload!`, {
              description: validation.error,
              duration: 5000,
              icon: <AlertCircle className="h-5 w-5" />,
            })
          } else {
            toast.error(`File "${file.name}" không hợp lệ`, {
              description: validation.error,
              duration: 4000,
            })
          }
        }
      })
      
      if (Object.keys(newErrors).length > 0) {
        setFileErrors((prev) => ({ ...prev, ...newErrors }))
      }
      setFiles((prev) => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    const newUploadedDocs: UploadedDocument[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }))

        try {
          const result = await uploadDocument(file)
          newUploadedDocs.push({
            id: result.document.id,
            fileName: result.document.originalFileName,
            pageCount: result.document.detectedPageCount,
            fileSize: result.document.fileSize,
          })
          setUploadProgress((prev) => ({ ...prev, [i]: 100 }))
          toast.success(`Đã upload: ${file.name} (${result.document.detectedPageCount} trang)`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error uploading ${file.name}:`, error)
          
          // Improved error toast with better formatting
          if (errorMessage.includes('quá lớn') || errorMessage.includes('File quá lớn')) {
            toast.error(`File "${file.name}" quá lớn!`, {
              description: errorMessage,
              duration: 6000,
              icon: <AlertCircle className="h-5 w-5" />,
            })
          } else {
            toast.error(`Lỗi upload "${file.name}"`, {
              description: errorMessage,
              duration: 5000,
            })
          }
        }
      }

      setUploadedDocs(newUploadedDocs)
      
      if (newUploadedDocs.length > 0) {
        // Store uploaded documents in sessionStorage
        sessionStorage.setItem('uploadedDocuments', JSON.stringify(newUploadedDocs))
        toast.success(`Đã upload thành công ${newUploadedDocs.length} file`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Có lỗi xảy ra khi upload')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const handleContinue = () => {
    if (uploadedDocs.length > 0) {
      router.push(`/print`)
    } else if (files.length > 0) {
      toast.info('Vui lòng upload file trước khi tiếp tục')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={balance} userName="Nguyễn Văn A" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Tải lên tài liệu</h1>
          <p className="text-gray-600">Chọn tệp cần in và tiếp tục để cấu hình</p>
        </div>

        {/* Upload Area */}
        <div
          className={`mb-8 rounded-3xl border-4 border-dashed bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-center transition-colors sm:mb-12 sm:p-16 ${
            dragActive ? "border-white" : "border-blue-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            <div className="flex justify-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400 sm:h-16 sm:w-16">
                <FileText className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-300 sm:h-16 sm:w-16">
                <FileText className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400 sm:h-16 sm:w-16">
                <FileText className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
            </div>

            <div>
              <input
                type="file"
                id="file-upload"
                multiple
                accept={allowedFileTypes.join(',')}
                onChange={handleFileInput}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 cursor-pointer" 
                  asChild
                  disabled={uploading}
                >
                  <span>
                    <Upload className="mr-2 h-5 w-5" />
                    CHỌN CÁC TỆP
                  </span>
                </Button>
              </label>
            </div>

            <div className="text-sm text-blue-100">
              <p className="mb-1">Hoặc kéo các tệp vào đây</p>
              <p className="text-xs">
                Hỗ trợ: {allowedFileTypes.map(t => t.toUpperCase().replace('.', '')).join(', ')}
                {maxFileSizeMB !== null && ` (tối đa ${maxFileSizeMB}MB)`}
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:mb-12">
            <h2 className="mb-4 text-lg font-semibold">Tệp đã chọn ({files.length})</h2>
            <div className="space-y-3">
              {files.map((file, index) => {
                const progress = uploadProgress[index] || 0
                const uploaded = uploadedDocs.find((doc) => doc.fileName === file.name)
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        {uploading && progress < 100 ? (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : uploaded ? (
                          <FileText className="h-5 w-5 text-green-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {uploaded && ` • ${uploaded.pageCount} trang`}
                        </div>
                        {fileErrors[index] && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>{fileErrors[index]}</span>
                          </div>
                        )}
                        {uploading && progress < 100 && (
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeFile(index)
                          setUploadedDocs((prev) => prev.filter((doc) => doc.fileName !== file.name))
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
            {!uploading && files.length > 0 && uploadedDocs.length < files.length && (
              <div className="mt-4">
                <Button
                  onClick={handleUpload}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length - uploadedDocs.length} file
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto" disabled={uploading}>
              Hủy
            </Button>
          </Link>
          <Button
            onClick={handleContinue}
            disabled={uploadedDocs.length === 0 || uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              `Tiếp tục (${uploadedDocs.length} file)`
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

