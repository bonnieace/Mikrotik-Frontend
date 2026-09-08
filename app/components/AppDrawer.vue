<template>
  <dialog
    ref="dialog"
    class="operator-drawer"
    :aria-labelledby="titleId"
    @cancel.prevent="requestClose"
    @click="backdrop"
  >
    <header class="drawer-heading">
      <div>
        <p class="drawer-kicker">{{ eyebrow }}</p>
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <button
        type="button"
        class="ghost icon-button"
        aria-label="Close panel"
        :disabled="busy"
        @click="requestClose"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </header>
    <div class="drawer-content"><slot /></div>
  </dialog>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    eyebrow?: string
    busy?: boolean
  }>(),
  { eyebrow: 'Uzanet / Network Admin', busy: false },
)
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (open && !dialog.value?.open) dialog.value?.showModal()
    else if (!open) dialog.value?.close()
  },
  { immediate: true },
)
function requestClose() {
  if (!props.busy) emit('close')
}
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return
  const r = dialog.value.getBoundingClientRect()
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    requestClose()
}
onUnmounted(() => dialog.value?.close())
</script>
<style scoped>
.operator-drawer {
  width: 540px;
  max-width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0 0 0 auto;
  border: 0;
  padding: 0;
  color: #0b1c30;
  background: #fff;
  box-shadow: -12px 0 48px #0f172a1a;
  overflow-y: auto;
}
.operator-drawer::backdrop {
  background: #0f172a66;
  backdrop-filter: blur(2px);
}
.drawer-heading {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}
.drawer-heading h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 4px 0 0;
}
.drawer-kicker {
  color: #94a3b8;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.drawer-content {
  padding: 24px;
}
.drawer-content :deep(.form-grid) {
  grid-template-columns: 1fr;
}
.drawer-content :deep(.actions) {
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid #e2e8f0;
}
.drawer-content :deep(.muted) {
  margin-bottom: 20px;
}
@media (max-width: 640px) {
  .drawer-heading,
  .drawer-content {
    padding: 20px;
  }
}
</style>
