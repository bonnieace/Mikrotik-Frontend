<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>Account Settings</h1>
        <p>Manage your profile and account security.</p>
      </div>
    </div>
    <div class="settings-layout">
      <aside class="panel account-card">
        <div class="account-avatar">
          {{ user?.username?.slice(0, 2).toUpperCase() }}
        </div>
        <h2>{{ user?.username }}</h2>
        <p class="muted">{{ user?.email || 'Operator account' }}</p>
        <span class="badge blue">{{ user?.role }}</span>
        <div class="settings-section">
          <span class="material-symbols-outlined" aria-hidden="true">lock</span>Password &amp;
          Security
        </div>
      </aside>
      <div>
        <form class="panel" @submit.prevent="submit">
          <h2>Change password</h2>
          <p class="muted">Changing your password signs out every session for this account.</p>
          <fieldset :disabled="busy" style="border: 0; padding: 0; margin: 24px 0">
            <div class="form-grid">
              <label class="field"
                >Current password<input
                  v-model="current"
                  type="password"
                  autocomplete="current-password"
                  required
                  maxlength="128"
              /></label>
              <label class="field"
                >New password<input
                  v-model="next"
                  type="password"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="128"
                  required
              /></label>
              <label class="field"
                >Confirm new password<input
                  v-model="confirm"
                  type="password"
                  autocomplete="new-password"
                  required
              /></label>
            </div>
          </fieldset>
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
          <div class="actions">
            <button class="primary" :disabled="busy">Change password</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'app' })
const { user } = useAuth()
const api = useApi()
const resetSession = useSessionReset()
const snackbar = useSnackbar()
const current = ref(''),
  next = ref(''),
  confirm = ref(''),
  error = ref(''),
  busy = ref(false)
async function submit() {
  if (busy.value) return
  error.value = ''
  if (next.value !== confirm.value) {
    error.value = 'The new passwords do not match.'
    return
  }
  busy.value = true
  try {
    await api('users/change-password', {
      method: 'POST',
      body: { current_password: current.value, new_password: next.value },
    })
    resetSession()
    await navigateTo('/login')
    snackbar.show('Password changed. Sign in with your new password.', 'success')
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
    current.value = ''
    next.value = ''
    confirm.value = ''
  }
}
</script>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.account-card {
  text-align: center;
  padding: 32px 20px 0;
}
.account-avatar {
  margin: 0 auto 16px;
  width: 56px;
  height: 56px;
  background: #e5eeff;
  color: #006591;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.account-card .badge {
  margin: 16px 0 24px;
}
.settings-section {
  margin: 0 -20px;
  border-top: 1px solid #e2e8f0;
  padding: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #2563eb;
  background: #f8fafc;
  text-align: left;
}
.settings-section .material-symbols-outlined {
  font-size: 18px;
}
.settings-layout .form-grid {
  grid-template-columns: 1fr;
  max-width: 440px;
}
@media (max-width: 1100px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  .account-card {
    display: none;
  }
}
</style>
