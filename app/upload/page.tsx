"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { FileText, Upload, X } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  const allowedTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx"]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      return allowedTypes.includes(ext)
    })

    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase()
        return allowedTypes.includes(ext)
      })
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    if (files.length > 0) {
      // Store files in session/localStorage or pass via query params
      router.push(`/print?files=${files.length}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole="student" balance={50} userName="Nguyễn Văn A" />

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
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileInput}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-5 w-5" />
                    CHỌN CÁC TỆP
                  </span>
                </Button>
              </label>
            </div>

            <div className="text-sm text-blue-100">
              <p className="mb-1">Hoặc kéo các tệp vào đây</p>
              <p className="text-xs">Hỗ trợ: PDF, DOC, DOCX, PPT, PPTX</p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:mb-12">
            <h2 className="mb-4 text-lg font-semibold">Tệp đã chọn ({files.length})</h2>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              Hủy
            </Button>
          </Link>
          <Button
            onClick={handleContinue}
            disabled={files.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
          >
            Tiếp tục ({files.length})
          </Button>
        </div>
      </main>
    </div>
  )
}

