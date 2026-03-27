// API config constants for the NVIDIA-powered assistant

export const CHAT_API_URL = '/api/chat'
export const DOCUMENT_PARSE_API_URL = '/api/document-parse'

// Maximum number of characters allowed when inlining a text file into a prompt
export const MAX_FILE_CHARS = 120000

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

export const TEXT_FILE_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'json',
  'csv',
  'log',
  'yaml',
  'yml',
  'xml',
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'java',
  'c',
  'cpp',
  'cs',
  'html',
  'css',
  'sql',
])

export const DOCUMENT_FILE_EXTENSIONS = new Set([
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
])
