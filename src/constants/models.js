// Model config constants for the NVIDIA-ready assistant

export const MODELS = [
  {
    id: 'meta/llama-3.1-8b-instruct',
    label: 'Llama 3.1 8B Instruct',
    shortLabel: 'Llama 3.1 8B',
    lane: 'chat',
    supportsImages: false,
  },
  {
    id: 'nvidia/llama-3.1-nemotron-nano-8b-v1',
    label: 'Nemotron Nano 8B',
    shortLabel: 'Nemotron 8B',
    lane: 'chat',
    supportsImages: false,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    label: 'Nemotron Nano 12B VL',
    shortLabel: 'Nemotron VL',
    lane: 'vision',
    supportsImages: true,
  },
]

export const DEFAULT_CHAT_MODEL_ID = MODELS[0].id
export const DOCUMENT_PARSE_MODEL_ID = 'nvidia/nemotron-parse'

export const MODEL_LOOKUP = new Map(MODELS.map((model) => [model.id, model]))
