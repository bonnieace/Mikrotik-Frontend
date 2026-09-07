<template>
  <div>
    <div class="actions" style="margin: 0 0 16px">
      <label class="field" style="flex: 1; max-width: 360px">Search loaded records<input v-model="query" type="search" placeholder="Filter this list…" /></label>
      <span class="muted">{{ filtered.length }} matching records</span>
    </div>
    <div class="table-wrap">
      <table>
        <caption class="sr-only">{{ caption }}</caption>
        <thead><tr><th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th><th v-if="$slots.actions" scope="col">Actions</th></tr></thead>
        <tbody>
          <tr v-for="row in visible" :key="String(row[rowKey])">
            <td v-for="column in columns" :key="column.key"><slot :name="column.key" :row="row">{{ display(row[column.key]) }}</slot></td>
            <td v-if="$slots.actions"><div class="actions"><slot name="actions" :row="row" /></div></td>
          </tr>
          <tr v-if="!filtered.length"><td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="muted">No matching records.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="actions">
      <button :disabled="page <= 1" @click="page--">Previous</button>
      <span class="muted">Page {{ page }} of {{ pages }} · 25 per page</span>
      <button :disabled="page >= pages" @click="page++">Next</button>
    </div>
  </div>
</template>
<script setup lang="ts" generic="T extends object">
const props = withDefaults(defineProps<{ rows: T[]; columns: { key: keyof T & string; label: string }[]; rowKey: keyof T & string; caption: string }>(), {})
const query = ref('')
const page = ref(1)
const filtered = computed(() => props.rows.filter(row => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(query.value.toLowerCase()))))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 25, page.value * 25))
watch([query, () => props.rows], () => { page.value = 1 })
function display(value: unknown) { return value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) }
</script>
