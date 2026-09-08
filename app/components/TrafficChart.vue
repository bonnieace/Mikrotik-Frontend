<template>
  <section class="panel table-panel traffic-panel">
    <div class="panel-heading">
      <div>
        <h2>Aggregate Network Traffic</h2>
        <p class="muted">Bridge interface · readings collected on this page</p>
      </div>
      <div class="traffic-legend">
        <span><i class="rx" />Download (Rx)</span><span><i class="tx" />Upload (Tx)</span>
      </div>
    </div>
    <div class="traffic-summary">
      <div>
        <span class="muted">Receive</span
        ><strong>{{ rate(latest?.rx) }} <small>Mbps</small></strong>
      </div>
      <div>
        <span class="muted">Transmit</span
        ><strong>{{ rate(latest?.tx) }} <small>Mbps</small></strong>
      </div>
      <span class="traffic-frequency"
        ><span class="material-symbols-outlined" aria-hidden="true">sync</span
        >{{ loading ? 'Updating…' : 'Updates every 30s' }}</span
      >
    </div>
    <ResourceState
      v-if="!selected || error || (!samples.length && loading)"
      :loading="loading"
      :error="error"
      :selected="selected"
      label="traffic"
      @retry="$emit('retry')"
    />
    <div v-else class="traffic-canvas">
      <div class="chart-labels">
        <span v-for="value in ticks" :key="value">{{ value.toFixed(1) }}</span>
      </div>
      <div class="chart-plot">
        <div class="chart-grid" aria-hidden="true">
          <i v-for="i in 5" :key="i" />
        </div>
        <svg
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          role="img"
          :aria-label="
            samples.length +
            ' measured traffic samples; download ' +
            rate(latest?.rx) +
            ' Mbps, upload ' +
            rate(latest?.tx) +
            ' Mbps'
          "
        >
          <polyline
            v-if="samples.length > 1"
            :points="points('rx')"
            fill="none"
            stroke="#2563eb"
            stroke-width="2.5"
            vector-effect="non-scaling-stroke"
          />
          <polyline
            v-if="samples.length > 1"
            :points="points('tx')"
            fill="none"
            stroke="#006591"
            stroke-width="2.5"
            stroke-dasharray="6 4"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <p v-if="samples.length < 2" class="chart-waiting">
          <span class="material-symbols-outlined" aria-hidden="true">monitoring</span
          >{{
            samples.length
              ? 'First reading received. The chart fills as new readings arrive.'
              : 'Waiting for traffic readings.'
          }}
        </p>
        <div class="chart-times">
          <span>{{ time(samples[0]?.time) }}</span
          ><span>{{ samples.length > 1 ? time(latest?.time) : 'Now' }}</span>
        </div>
      </div>
    </div>
    <div class="traffic-footnote">
      {{
        error
          ? 'Traffic history restarts after an interrupted reading.'
          : samples.length + ' measured samples · Mbps · EAT'
      }}
    </div>
  </section>
</template>
<script setup lang="ts">
interface Traffic {
  rx_bits_per_second: number
  tx_bits_per_second: number
}
interface Sample {
  time: number
  rx: number
  tx: number
}
const props = defineProps<{
  data: Traffic | null
  loading: boolean
  error: string
  selected: boolean
}>()
defineEmits<{ retry: [] }>()
const samples = ref<Sample[]>([])
watch(
  () => props.data,
  (data) => {
    if (!data) return
    if (
      ![data.rx_bits_per_second, data.tx_bits_per_second].every(
        (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0,
      )
    ) {
      samples.value = []
      return
    }
    samples.value = [
      ...samples.value,
      {
        time: Date.now(),
        rx: data.rx_bits_per_second / 1e6,
        tx: data.tx_bits_per_second / 1e6,
      },
    ].slice(-20)
  },
  { immediate: true },
)
watch(
  () => props.error,
  (error) => {
    if (error) samples.value = []
  },
)
const latest = computed(() => samples.value.at(-1))
const maximum = computed(() => Math.max(1, ...samples.value.flatMap((s) => [s.rx, s.tx])) * 1.2)
const ticks = computed(() => [1, 0.75, 0.5, 0.25, 0].map((n) => maximum.value * n))
function points(key: 'rx' | 'tx') {
  const start = samples.value[0]?.time || 0
  const span = Math.max(1, (latest.value?.time || 0) - start)
  return samples.value
    .map((s) => `${((s.time - start) / span) * 1000},${236 - (s[key] / maximum.value) * 232}`)
    .join(' ')
}
function rate(value?: number) {
  return value === undefined ? '—' : value.toFixed(2)
}
function time(value?: number) {
  return value
    ? new Intl.DateTimeFormat('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Africa/Nairobi',
      }).format(new Date(value))
    : '—'
}
</script>
<style scoped>
.traffic-legend {
  display: flex;
  gap: 24px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}
.traffic-legend span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.traffic-legend i {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}
.rx {
  background: #2563eb;
}
.tx {
  background: #006591;
}
.traffic-summary {
  display: flex;
  gap: 40px;
  align-items: center;
  padding: 20px 24px 0;
}
.traffic-summary strong {
  display: block;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.traffic-summary small {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 400;
}
.traffic-frequency {
  margin-left: auto;
  color: #94a3b8;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.traffic-frequency .material-symbols-outlined {
  font-size: 14px;
}
.traffic-canvas {
  display: flex;
  gap: 16px;
  padding: 24px 24px 8px;
  height: 286px;
  background: #f8fafc30;
}
.chart-labels {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 26px;
  color: #94a3b8;
  font:
    10px/1 ui-monospace,
    monospace;
  text-align: right;
}
.chart-plot {
  position: relative;
  flex: 1;
  min-width: 0;
}
.chart-grid {
  position: absolute;
  inset: 0 0 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.chart-grid i {
  height: 1px;
  background: #e2e8f0;
}
.chart-plot svg {
  position: relative;
  display: block;
  height: calc(100% - 26px);
  width: 100%;
}
.chart-times {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font:
    10px/1 ui-monospace,
    monospace;
  color: #94a3b8;
}
.chart-waiting {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
}
.chart-waiting .material-symbols-outlined {
  font-size: 28px;
  color: #94a3b8;
}
.traffic-footnote {
  color: #94a3b8;
  font-size: 10px;
  padding: 10px 24px 16px;
  text-align: right;
}
@media (max-width: 640px) {
  .traffic-summary {
    padding: 16px 16px 0;
    gap: 24px;
    flex-wrap: wrap;
  }
  .traffic-frequency {
    width: 100%;
  }
  .traffic-canvas {
    padding: 24px 16px 8px;
    height: 220px;
    gap: 10px;
  }
  .traffic-legend {
    gap: 16px;
  }
}
</style>
