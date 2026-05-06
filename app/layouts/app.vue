<template>
  <div class="flex min-h-screen bg-surface">
    <AppSidebar />
    <div class="flex flex-col flex-1 ml-0 md:ml-[240px] min-w-0">
      <AppTopbar />
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
