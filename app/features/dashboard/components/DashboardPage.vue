<!--
  DashboardPage.vue — 1:1 from Stitch export "Dashboard"
  Source: projects/13247784430269981727/screens/5d657f2b035845f1a67d8d91edbb30fc
  DO NOT redesign. Pixel-perfect match required.
-->
<template>
  <div class="p-lg max-w-container-max mx-auto space-y-lg">

    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">Network Overview</h2>
        <p class="text-on-surface-variant font-body-md">Real-time infrastructure performance and billing metrics</p>
      </div>
      <div class="flex space-x-2">
        <button class="px-4 py-2 bg-white border border-outline-variant text-on-surface font-body-md rounded-lg hover:bg-surface-container transition-colors flex items-center">
          <span class="material-symbols-outlined mr-2 text-[18px]">calendar_month</span>
          Last 24 Hours
        </button>
        <button class="px-4 py-2 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition-opacity flex items-center shadow-sm">
          <span class="material-symbols-outlined mr-2 text-[18px]">download</span>
          Export Report
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">

      <!-- Daily Earnings -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <span class="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">+12.5%</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Daily Earnings</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">$4,281.50</h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-blue-200 w-full h-[40%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[60%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[45%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[75%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[55%] rounded-sm"></div>
            <div class="bg-blue-600 w-full h-[90%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Monthly Earnings -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <span class="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">+5.2%</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Monthly Earnings</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">$128,490.00</h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-purple-200 w-full h-[70%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[80%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[65%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[75%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[85%] rounded-sm"></div>
            <div class="bg-purple-600 w-full h-[95%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Active PPP Users -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <span class="material-symbols-outlined">dns</span>
          </div>
          <span class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Stable</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Active PPP Users</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">8,142</h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-emerald-200 w-full h-[85%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[88%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[84%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[86%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[87%] rounded-sm"></div>
            <div class="bg-emerald-600 w-full h-[86%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Active Hotspot Users -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-orange-50 rounded-lg text-orange-600">
            <span class="material-symbols-outlined">wifi</span>
          </div>
          <span class="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold">-2.1%</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Active Hotspot Users</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">1,248</h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-orange-200 w-full h-[60%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[55%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[45%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[40%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[35%] rounded-sm"></div>
            <div class="bg-orange-600 w-full h-[30%] rounded-sm"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Network Traffic Chart -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="p-lg border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-h3 text-h3 text-slate-900">Aggregate Network Traffic</h3>
          <p class="text-body-sm text-slate-500">Core switch traffic monitoring in real-time (Mbps)</p>
        </div>
        <div class="flex items-center space-x-6">
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>
            <span class="text-xs font-semibold text-slate-700">Download (Rx)</span>
          </div>
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-full bg-secondary mr-2"></span>
            <span class="text-xs font-semibold text-slate-700">Upload (Tx)</span>
          </div>
        </div>
      </div>
      <div class="p-lg h-[400px] relative bg-slate-50/30">
        <!-- Grid lines -->
        <div class="absolute inset-x-lg inset-y-lg flex flex-col justify-between pointer-events-none">
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
        </div>
        <div class="relative w-full h-full">
          <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
            <path d="M0 250 Q 100 240, 200 180 T 400 120 T 600 160 T 800 80 T 1000 100" fill="none" stroke="#2563eb" stroke-linecap="round" stroke-width="3" />
            <path d="M0 280 Q 100 270, 200 220 T 400 180 T 600 210 T 800 140 T 1000 160" fill="none" stroke="#006591" stroke-dasharray="8 4" stroke-linecap="round" stroke-width="3" />
          </svg>
          <div class="absolute inset-x-0 bottom-0 flex justify-between px-2 pt-2 text-[10px] font-mono text-slate-400">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- System Logs Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-lg py-md border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-h3 text-h3 text-slate-900">System Logs &amp; Events</h3>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-slate-500">Auto-refresh every 30s</span>
          <button class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200">
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Event Level</th>
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Source</th>
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Description</th>
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-lg py-3 text-body-sm text-slate-600 font-mono">{{ log.timestamp }}</td>
              <td class="px-lg py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="levelClass(log.level)">
                  {{ log.level }}
                </span>
              </td>
              <td class="px-lg py-3 text-body-sm text-slate-900 font-semibold">{{ log.source }}</td>
              <td class="px-lg py-3 text-body-sm text-slate-600">{{ log.description }}</td>
              <td class="px-lg py-3 text-right">
                <button class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all">
                  <span class="material-symbols-outlined text-[18px]">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-lg py-3 border-t border-slate-100 bg-slate-50/50">
        <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center">
          View All Logs
          <span class="material-symbols-outlined text-[14px] ml-1">arrow_forward</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const logs = [
  {
    id: 1,
    timestamp: '2023-10-24 14:32:01',
    level: 'Info',
    source: 'RADIUS_SERVER',
    description: 'User [customer_892] authenticated successfully (PPPoE)',
  },
  {
    id: 2,
    timestamp: '2023-10-24 14:31:45',
    level: 'Warning',
    source: 'BGP_ROUTING',
    description: 'Peer 172.16.0.1 session reset by upstream provider',
  },
  {
    id: 3,
    timestamp: '2023-10-24 14:30:12',
    level: 'Error',
    source: 'UPS_MONITOR',
    description: 'Low battery critical threshold reached in Node-East',
  },
  {
    id: 4,
    timestamp: '2023-10-24 14:28:55',
    level: 'Success',
    source: 'BILLING_SYST',
    description: 'Monthly automated billing cycle completed for Sector 4',
  },
]

function levelClass(level: string) {
  return {
    Info:    'bg-blue-100 text-blue-700',
    Warning: 'bg-orange-100 text-orange-700',
    Error:   'bg-red-100 text-red-700',
    Success: 'bg-green-100 text-green-700',
  }[level] ?? 'bg-slate-100 text-slate-700'
}
</script>
