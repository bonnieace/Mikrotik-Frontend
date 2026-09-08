<template>
  <div>
    <div v-if="searchable" class="record-toolbar">
      <label class="record-search"
        ><span class="material-symbols-outlined" aria-hidden="true">search</span
        ><span class="sr-only">Search {{ caption }}</span
        ><input v-model="query" type="search" :placeholder="placeholder"
      /></label>
      <slot name="filters" />
      <span class="record-count">{{ filtered.length }} {{ recordLabel }}</span>
    </div>
    <div v-if="filtered.length" class="table-wrap" role="region" :aria-label="caption" tabindex="0">
      <table>
        <caption class="sr-only">
          {{
            caption
          }}
        </caption>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" scope="col">
              {{ column.label }}
            </th>
            <th v-if="$slots.actions" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visible" :key="String(row[rowKey])">
            <td v-for="column in columns" :key="column.key">
              <slot :name="column.key" :row="row">{{ display(row[column.key]) }}</slot>
            </td>
            <td v-if="$slots.actions">
              <div class="actions"><slot name="actions" :row="row" /></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      <span class="state-icon"
        ><span class="material-symbols-outlined" aria-hidden="true">{{
          query ? 'search_off' : 'inbox'
        }}</span></span
      ><strong>{{ query ? 'No matching records' : emptyTitle }}</strong>
      <p class="muted">
        {{ query ? 'Try another name, reference or phone number.' : emptyDescription }}
      </p>
      <button v-if="query" @click="query = ''">Clear search</button>
    </div>
    <div v-if="filtered.length && paginate" class="table-footer">
      <span class="muted"
        >Showing {{ (page - 1) * 25 + 1 }}–{{ Math.min(page * 25, filtered.length) }} of
        {{ filtered.length }}</span
      >
      <div class="actions">
        <button
          class="icon-button"
          aria-label="Previous page"
          :disabled="page <= 1"
          @click="page--"
        >
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
            >chevron_left</span
          ></button
        ><span class="page-number">{{ page }} / {{ pages }}</span
        ><button
          class="icon-button"
          aria-label="Next page"
          :disabled="page >= pages"
          @click="page++"
        >
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
            >chevron_right</span
          >
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" generic="T extends object">
const props = withDefaults(
  defineProps<{
    rows: T[]
    columns: { key: keyof T & string; label: string }[]
    rowKey: keyof T & string
    caption: string
    placeholder?: string
    emptyTitle?: string
    emptyDescription?: string
    recordLabel?: string
    searchable?: boolean
    paginate?: boolean
  }>(),
  {
    placeholder: 'Search records…',
    emptyTitle: 'No records yet',
    emptyDescription: 'Records will appear here when they are available.',
    recordLabel: 'records',
    searchable: true,
    paginate: true,
  },
)
const query = ref('')
const page = ref(1)
// Search only displayed columns, never hidden IDs or credential objects.
const filtered = computed(() =>
  props.rows.filter((row) =>
    props.columns.some((column) =>
      String(row[column.key] ?? '')
        .toLowerCase()
        .includes(query.value.toLowerCase()),
    ),
  ),
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() =>
  props.paginate ? filtered.value.slice((page.value - 1) * 25, page.value * 25) : filtered.value,
)
watch([query, () => props.rows], () => {
  page.value = 1
})
function display(value: unknown) {
  return value === null || value === undefined || value === ''
    ? '—'
    : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : String(value)
}
</script>
