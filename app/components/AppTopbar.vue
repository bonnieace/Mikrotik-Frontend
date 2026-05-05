<template>
  <header class="h-16 w-full sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
    <!-- Search -->
    <div class="flex items-center flex-1">
      <div class="relative w-96 group">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors text-[20px]">
          search
        </span>
        <input
          v-model="searchQuery"
          class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 transition-all outline-none"
          placeholder="Search accounts, IP addresses, or equipment..."
          type="text"
        />
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center space-x-6">
      <!-- Status badge -->
      <div class="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span class="font-mono-label text-[10px] uppercase font-bold tracking-widest">System Status: Online</span>
      </div>

      <div class="flex items-center space-x-4">
        <!-- Notifications -->
        <button class="relative text-slate-600 hover:text-slate-900 transition-colors">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <!-- Help -->
        <button class="text-slate-600 hover:text-slate-900 transition-colors">
          <span class="material-symbols-outlined text-[22px]">help_center</span>
        </button>

        <!-- Avatar -->
        <div class="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
          <img
            alt="Admin User Profile"
            class="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuASLIUWrI1WLntx-qP54uHHVE2pgB7VcfEnul4_g8HL_KCXPhd1aa7OhE29rYHEJNpl96G2p4_3fRLUCyA5vTAR7NWJTfr0fYrNWLqP2EBEzIRXNvUzt-qeLvhGQs289bxeYq0wWvtigGOZ-lqcNxmqld0xPAvqBJXxpCJIYmIMUeYjsLoOkaokx2t3d42asYtUxZIMIRE4Ma7dXI4nfiTT6nrA_Y2m6iNBjkc-nRAbz_i5zMiQq1HODMuGyVYX1Rf7mTwRWF3dDKxj"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const searchQuery = ref('')
</script>
