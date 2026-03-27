import { FaCommentDots, FaPlus, FaTrash } from 'react-icons/fa'

const formatPreview = (thread) => {
  const lastMessage = thread.messages?.[thread.messages.length - 1]
  if (!lastMessage?.content) return 'No messages yet'

  const cleaned = lastMessage.content.replace(/\s+/g, ' ').trim()
  return cleaned.length > 52 ? `${cleaned.slice(0, 52)}...` : cleaned
}

const ThreadSidebar = ({
  threads,
  activeThreadId,
  onCreateThread,
  onSelectThread,
  onDeleteThread,
}) => (
  <aside className="border-b border-zinc-800/80 bg-zinc-950/95 lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
    <div className="border-b border-zinc-800/80 p-4 lg:p-4">
      <button
        type="button"
        onClick={onCreateThread}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700/60 bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg transition hover:from-blue-500 hover:to-cyan-400"
      >
        <FaPlus className="h-4 w-4" />
        <span>New chat</span>
      </button>
    </div>

    <div className="flex-1 overflow-x-auto p-3 lg:overflow-y-auto lg:overflow-x-hidden">
      <div className="mb-3 px-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
        Threads
      </div>

      <div className="flex gap-2 lg:block lg:space-y-2">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId

          return (
            <div
              key={thread.id}
              className={[
                'group min-w-64 rounded-2xl border transition lg:min-w-0',
                isActive
                  ? 'border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                  : 'border-zinc-800/70 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/70',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className="flex w-full items-start gap-3 px-3 py-3 text-left"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300">
                  <FaCommentDots className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-100">
                    {thread.title}
                  </div>
                  <div className="mt-1 max-h-9 overflow-hidden text-xs leading-relaxed text-zinc-500">
                    {formatPreview(thread)}
                  </div>
                </div>
              </button>

              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => onDeleteThread(thread.id)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <FaTrash className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </aside>
)

export default ThreadSidebar
