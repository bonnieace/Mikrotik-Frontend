export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarItem {
  id: number
  message: string
  variant: SnackbarVariant
}

let _seq = 0

export function useSnackbar() {
  const items = useState<SnackbarItem[]>('snackbar', () => [])

  function show(message: string, variant: SnackbarVariant = 'info', duration = 4500) {
    const id = ++_seq
    items.value = [...items.value, { id, message, variant }]
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  function dismiss(id: number) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  return { items, show, dismiss }
}
