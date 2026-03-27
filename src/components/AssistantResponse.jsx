import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FaRobot, FaUser } from 'react-icons/fa'
import markdownComponents from './markdown/markdownComponents.jsx'

const laneLabelMap = {
  chat: 'Chat',
  vision: 'Vision',
  document: 'Document',
}

const MessageBubble = ({ message, isLatestAssistantMessage }) => {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? 'items-start' : 'items-start justify-end'}`}>
      {isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
          <FaRobot className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={[
          'max-w-3xl rounded-2xl border px-4 py-3 shadow-xl sm:px-5 sm:py-4',
          isAssistant
            ? 'border-zinc-700/50 bg-linear-to-br from-zinc-900/90 to-zinc-800/85 text-zinc-100'
            : 'border-blue-500/20 bg-linear-to-br from-blue-500/15 to-cyan-500/10 text-zinc-100',
        ].join(' ')}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-200">
            {isAssistant ? 'Assistant' : 'You'}
          </span>
          <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
            {laneLabelMap[message.lane] || 'Chat'}
          </span>
          {message.modelId && (
            <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-500">
              {message.modelId}
            </span>
          )}
        </div>

        <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:overflow-x-auto prose-code:break-words">
          {isAssistant ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap break-words text-zinc-100">
              {message.content}
            </div>
          )}
        </div>

        {isLatestAssistantMessage && (
          <div className="mt-3 h-1.5 w-20 rounded-full bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-80" />
        )}
      </div>

      {!isAssistant && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 shadow-lg">
          <FaUser className="h-4 w-4 text-zinc-200" />
        </div>
      )}
    </div>
  )
}

const AssistantResponse = ({ messages, loading }) => {
  if (!messages.length) {
    return (
      <div className="flex flex-1 min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-10 text-center">
        <div>
          <p className="text-lg font-medium text-zinc-200">Start a new thread</p>
          <p className="mt-2 text-sm text-zinc-500">
            Each chat keeps its own context, so you can branch ideas without losing older work.
          </p>
        </div>
      </div>
    )
  }

  const latestAssistantId = [...messages].reverse().find((message) => message.role === 'assistant')?.id

  return (
    <div className="flex flex-1 min-h-[280px] flex-col gap-4 overflow-y-auto rounded-3xl border border-zinc-800/60 bg-zinc-950/35 p-3 sm:p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLatestAssistantMessage={!loading && message.id === latestAssistantId}
        />
      ))}

      {loading && (
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
            <FaRobot className="h-4 w-4 text-white" />
          </div>
          <div className="rounded-2xl border border-zinc-700/50 bg-linear-to-br from-zinc-900/90 to-zinc-800/85 px-4 py-3 shadow-xl">
            <p className="text-sm text-zinc-300">Thinking...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssistantResponse
