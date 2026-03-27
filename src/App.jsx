import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CHAT_API_URL,
  DOCUMENT_FILE_EXTENSIONS,
  DOCUMENT_PARSE_API_URL,
  MAX_FILE_CHARS,
  MAX_FILE_SIZE_BYTES,
  TEXT_FILE_EXTENSIONS,
} from './constants/api'
import {
  DEFAULT_CHAT_MODEL_ID,
  DOCUMENT_PARSE_MODEL_ID,
  MODEL_LOOKUP,
  MODELS,
} from './constants/models'
import AssistantResponse from './components/AssistantResponse'
import ErrorBanner from './components/ErrorBanner'
import Header from './components/Header'
import PromptForm from './components/PromptForm'
import QuickActions from './components/QuickActions'
import ThreadSidebar from './components/ThreadSidebar'

const THREADS_STORAGE_KEY = 'rd-nvidia-assistant-threads'
const ACTIVE_THREAD_STORAGE_KEY = 'rd-nvidia-assistant-active-thread'

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createThread = (title = 'New chat') => ({
  id: createId(),
  title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
})

const summarizeTitle = (text) => {
  const cleaned = text.trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'New chat'
  return cleaned.length > 36 ? `${cleaned.slice(0, 36)}...` : cleaned
}

const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() ?? ''

const getFileKind = (file) => {
  const extension = getFileExtension(file?.name)

  if (TEXT_FILE_EXTENSIONS.has(extension)) return 'text'
  if (DOCUMENT_FILE_EXTENSIONS.has(extension)) return 'document'

  return 'unsupported'
}

const buildTextAttachmentPrompt = (fileAttachment) => (
  `File: ${fileAttachment.name}\n\n${fileAttachment.content}`
)

const buildUserMessagePreview = ({ prompt, imageData, fileAttachment }) => {
  const sections = []

  if (prompt.trim()) {
    sections.push(prompt.trim())
  }

  if (imageData) {
    sections.push('[Attached image]')
  }

  if (fileAttachment?.kind === 'text') {
    sections.push(`[Attached text file: ${fileAttachment.name}]`)
  }

  if (fileAttachment?.kind === 'document') {
    sections.push(`[Attached document: ${fileAttachment.name}]`)
  }

  return sections.join('\n\n') || 'Analyze attachment'
}

const loadThreads = () => {
  if (typeof window === 'undefined') {
    return [createThread()]
  }

  try {
    const raw = window.localStorage.getItem(THREADS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    return [createThread()]
  }

  return [createThread()]
}

function App() {
  const [threads, setThreads] = useState(() => loadThreads())
  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY)
  })
  const [selectedModel, setSelectedModel] = useState(MODELS[0])
  const [prompt, setPrompt] = useState('')
  const [imageData, setImageData] = useState(null)
  const [fileAttachment, setFileAttachment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeLane, setActiveLane] = useState('chat')

  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const activeThread = useMemo(() => {
    const preferred = threads.find((thread) => thread.id === activeThreadId)
    return preferred || threads[0] || null
  }, [activeThreadId, threads])

  const supportsImages = selectedModel.supportsImages

  useEffect(() => {
    if (!activeThread && threads.length > 0) {
      setActiveThreadId(threads[0].id)
    }
  }, [activeThread, threads])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads))
  }, [threads])

  useEffect(() => {
    if (typeof window === 'undefined' || !activeThread?.id) return
    window.localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, activeThread.id)
  }, [activeThread])

  const clearImage = () => {
    setImageData(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const clearFile = () => {
    setFileAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetComposer = () => {
    setPrompt('')
    clearImage()
    clearFile()
  }

  const clearAll = () => {
    setError('')
    resetComposer()
  }

  const upsertThreadMessages = (threadId, nextMessages, nextTitle) => {
    setThreads((currentThreads) => currentThreads.map((thread) => {
      if (thread.id !== threadId) return thread

      return {
        ...thread,
        title: nextTitle || thread.title,
        updatedAt: new Date().toISOString(),
        messages: nextMessages,
      }
    }))
  }

  const handleCreateThread = () => {
    const thread = createThread()
    setThreads((currentThreads) => [thread, ...currentThreads])
    setActiveThreadId(thread.id)
    setError('')
    setActiveLane('chat')
    resetComposer()
  }

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId)
    setError('')
  }

  const handleDeleteThread = (threadId) => {
    setThreads((currentThreads) => {
      const remainingThreads = currentThreads.filter((thread) => thread.id !== threadId)

      if (remainingThreads.length === 0) {
        const replacementThread = createThread()
        setActiveThreadId(replacementThread.id)
        return [replacementThread]
      }

      if (activeThreadId === threadId) {
        setActiveThreadId(remainingThreads[0].id)
      }

      return remainingThreads
    })
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageData(reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File too large. Please attach a file under 2MB.')
      return
    }

    const kind = getFileKind(file)
    if (kind === 'unsupported') {
      setFileAttachment(null)
      setError('This file type is not supported. Use a text file or a document such as PDF, DOCX, or PPTX.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (kind === 'text') {
        const content = typeof reader.result === 'string' ? reader.result : ''
        const truncated = content.slice(0, MAX_FILE_CHARS)
        const notice = content.length > MAX_FILE_CHARS
          ? '\n\n[Content truncated to avoid exceeding model limits.]'
          : ''

        setFileAttachment({
          name: file.name,
          kind,
          mimeType: file.type,
          content: `${truncated}${notice}`,
        })
      } else {
        setFileAttachment({
          name: file.name,
          kind,
          mimeType: file.type,
          dataUrl: typeof reader.result === 'string' ? reader.result : '',
        })
      }

      setError('')
    }

    if (kind === 'text') {
      reader.readAsText(file)
      return
    }

    reader.readAsDataURL(file)
  }

  const postJson = async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errJson = await response.json().catch(() => null)
      const errMsg = errJson?.error?.message || response.statusText || 'Request failed'
      throw new Error(errMsg)
    }

    return response.json()
  }

  const normalizeReply = (data) => {
    const choice = data?.choices?.[0]

    if (choice?.error?.message) {
      throw new Error(choice.error.message)
    }

    let reply = choice?.message?.content
    if (Array.isArray(reply)) {
      reply = reply
        .map((part) => {
          if (typeof part === 'string') return part
          if (part?.text) return part.text
          if (part?.output_text) return part.output_text
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }

    if (!reply || (typeof reply === 'string' && reply.trim() === '')) {
      const backendError = data?.error?.message || 'No response from model (empty content)'
      throw new Error(backendError)
    }

    return reply
  }

  const submitChatLane = async ({ textPrompt, modelId }) => {
    const data = await postJson(CHAT_API_URL, {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: textPrompt }],
        },
      ],
      stream: false,
    })

    return normalizeReply(data)
  }

  const submitVisionLane = async ({ textPrompt, modelId, imageUrl }) => {
    const data = await postJson(CHAT_API_URL, {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      stream: false,
    })

    return normalizeReply(data)
  }

  const submitDocumentLane = async ({ userPrompt, file }) => {
    const parsePayload = {
      model: DOCUMENT_PARSE_MODEL_ID,
      input: [
        {
          type: 'input_file',
          mime_type: file.mimeType || 'application/pdf',
          filename: file.name,
          data: file.dataUrl,
        },
      ],
    }

    const parsedData = await postJson(DOCUMENT_PARSE_API_URL, parsePayload)
    const extractedText =
      parsedData?.output_text ||
      parsedData?.text ||
      parsedData?.content ||
      parsedData?.result?.text ||
      parsedData?.results?.[0]?.text

    if (!extractedText || `${extractedText}`.trim() === '') {
      throw new Error('Document parser returned no text. A backend asset-upload flow may be required for this file.')
    }

    return submitChatLane({
      modelId: DEFAULT_CHAT_MODEL_ID,
      textPrompt: [
        'You are analyzing extracted document content.',
        userPrompt?.trim() ? `User request: ${userPrompt.trim()}` : 'User request: Summarize the document.',
        '',
        'Extracted document text:',
        `${extractedText}`,
      ].join('\n'),
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!activeThread) return

    const hasText = !!prompt.trim()
    const hasImage = !!imageData
    const hasFile = !!fileAttachment

    if (loading) return
    if (!hasText && !hasImage && !hasFile) return

    setError('')
    setLoading(true)

    const userMessage = {
      id: createId(),
      role: 'user',
      content: buildUserMessagePreview({ prompt, imageData, fileAttachment }),
      lane: hasFile && fileAttachment?.kind === 'document' ? 'document' : hasImage ? 'vision' : 'chat',
      modelId: selectedModel.id,
      createdAt: new Date().toISOString(),
    }

    const currentMessages = activeThread.messages || []
    const nextTitle = currentMessages.length === 0 ? summarizeTitle(prompt || userMessage.content) : activeThread.title
    upsertThreadMessages(activeThread.id, [...currentMessages, userMessage], nextTitle)
    resetComposer()

    try {
      let reply = ''
      let nextLane = 'chat'

      if (hasFile && fileAttachment.kind === 'document') {
        nextLane = 'document'
        reply = await submitDocumentLane({
          userPrompt: prompt,
          file: fileAttachment,
        })
      } else if (hasImage) {
        nextLane = 'vision'

        if (!supportsImages) {
          throw new Error('The selected model does not support image input. Choose Nemotron VL for image analysis.')
        }

        reply = await submitVisionLane({
          modelId: selectedModel.id,
          imageUrl: imageData,
          textPrompt: prompt.trim() || 'Please analyze the attached image.',
        })
      } else {
        const promptParts = []

        if (hasText) {
          promptParts.push(prompt.trim())
        }

        if (hasFile && fileAttachment.kind === 'text') {
          promptParts.push(buildTextAttachmentPrompt(fileAttachment))
        }

        reply = await submitChatLane({
          modelId: selectedModel.id,
          textPrompt: promptParts.join('\n\n') || 'Please analyze the attached text file.',
        })
      }

      const assistantMessage = {
        id: createId(),
        role: 'assistant',
        content: reply,
        lane: nextLane,
        modelId: nextLane === 'document' ? DEFAULT_CHAT_MODEL_ID : selectedModel.id,
        createdAt: new Date().toISOString(),
      }

      setActiveLane(nextLane)
      setThreads((currentThreads) => currentThreads.map((thread) => {
        if (thread.id !== activeThread.id) return thread

        const baseMessages = [...(thread.messages || []), assistantMessage]
        return {
          ...thread,
          title: nextTitle || thread.title,
          updatedAt: new Date().toISOString(),
          messages: baseMessages,
        }
      }))
    } catch (err) {
      setError(err?.message || 'Something went wrong while contacting NVIDIA services.')
    } finally {
      setLoading(false)
    }
  }

  const handleModelChange = (modelId) => {
    const nextModel = MODEL_LOOKUP.get(modelId)
    if (nextModel) setSelectedModel(nextModel)
  }

  const handleQuickActionSelect = (text) => setPrompt(text)

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="relative z-10 flex min-h-screen">
        <ThreadSidebar
          threads={threads}
          activeThreadId={activeThread?.id}
          onCreateThread={handleCreateThread}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
        />

        <div className="flex flex-1 flex-col min-w-0">
          <Header selectedModel={selectedModel} activeLane={activeLane} />

          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4">
              <ErrorBanner message={error} />

              <AssistantResponse
                messages={activeThread?.messages || []}
                selectedModel={selectedModel}
                activeLane={activeLane}
                loading={loading}
              />

              {!activeThread?.messages?.length && (
                <QuickActions onSelect={handleQuickActionSelect} />
              )}

              <PromptForm
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleSubmit}
                onClearAll={clearAll}
                models={MODELS}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                supportsImages={supportsImages}
                onImageChange={handleImageChange}
                onFileChange={handleFileChange}
                imageData={imageData}
                fileAttachment={fileAttachment}
                clearImage={clearImage}
                clearFile={clearFile}
                loading={loading}
                imageInputRef={imageInputRef}
                fileInputRef={fileInputRef}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
