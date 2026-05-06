export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarItem {
  id: number
  message: string
  variant: SnackbarVariant
  onDismiss?: () => void
}

let _seq = 0

export function useSnackbar() {
  const items = useState<SnackbarItem[]>('snackbar', () => [])

  function show(
    message: string,
    variant: SnackbarVariant = 'info',
    duration = 4500,
    onDismiss?: () => void,
  ): number {
    const id = ++_seq
    items.value = [...items.value, { id, message, variant, onDismiss }]
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: number) {
    const item = items.value.find((i) => i.id === id)
    item?.onDismiss?.()
    items.value = items.value.filter((i) => i.id !== id)
  }

  return { items, show, dismiss }
}
