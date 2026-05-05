<template>
  <Teleport to="body">
    <div class="snackbar-region" role="region" aria-live="polite" aria-label="Notifications">
      <TransitionGroup name="snack" tag="div" class="snackbar-stack">
        <div
          v-for="item in items"
          :key="item.id"
          class="snackbar-item"
          :class="`snackbar-item--${item.variant}`"
          role="alert"
        >
          <!-- Leading icon -->
          <span class="material-symbols-outlined snackbar-icon" :class="iconClass(item.variant)">
            {{ iconName(item.variant) }}
          </span>

          <!-- Message -->
          <p class="snackbar-message">{{ item.message }}</p>

          <!-- Dismiss -->
          <button class="snackbar-close" :aria-label="`Dismiss: ${item.message}`" @click="dismiss(item.id)">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { SnackbarVariant } from '~/composables/useSnackbar'

const { items, dismiss } = useSnackbar()

function iconName(variant: SnackbarVariant) {
  return {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }[variant]
}

function iconClass(variant: SnackbarVariant) {
  return {
    success: 'snackbar-icon--success',
    error: 'snackbar-icon--error',
    warning: 'snackbar-icon--warning',
    info: 'snackbar-icon--info',
  }[variant]
}
</script>

<style scoped>
/* ── Container ────────────────────────────────────────────────────────────── */
.snackbar-region {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: min(480px, calc(100vw - 2rem));
}

.snackbar-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;
}

/* ── Item ─────────────────────────────────────────────────────────────────── */
.snackbar-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  /* Material Design 3 — inverse-surface dark bg */
  background-color: #213145;
  color: #eaf1ff;
  min-width: 280px;
  max-width: 480px;
  width: 100%;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 1px 3px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.snackbar-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}

.snackbar-icon--success { color: #4fdbc8; } /* tertiary-fixed-dim */
.snackbar-icon--error   { color: #ffb4ab; } /* M3 error on dark */
.snackbar-icon--warning { color: #ffcf44; } /* amber */
.snackbar-icon--info    { color: #89ceff; } /* secondary-fixed-dim */

/* ── Message ──────────────────────────────────────────────────────────────── */
.snackbar-message {
  flex: 1;
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #eaf1ff;
  margin: 0;
}

/* ── Dismiss ──────────────────────────────────────────────────────────────── */
.snackbar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-left: 4px;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(234, 241, 255, 0.5);
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.snackbar-close:hover {
  color: #eaf1ff;
  background-color: rgba(234, 241, 255, 0.1);
}

.snackbar-close .material-symbols-outlined {
  font-size: 18px;
  line-height: 1;
}

/* ── Optional left accent border per variant ─────────────────────────────── */
.snackbar-item--success { border-left: 3px solid #4fdbc8; }
.snackbar-item--error   { border-left: 3px solid #ffb4ab; }
.snackbar-item--warning { border-left: 3px solid #ffcf44; }
.snackbar-item--info    { border-left: 3px solid #89ceff; }

/* ── TransitionGroup animations ──────────────────────────────────────────── */
.snack-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.05, 0.7, 0.1, 1);
}

.snack-leave-active {
  transition:
    opacity 0.2s ease-in,
    transform 0.2s ease-in;
  /* keep leaving items in flow so siblings animate smoothly */
  position: absolute;
}

.snack-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.snack-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

.snack-move {
  transition: transform 0.3s ease;
}
</style>
