<template>
  <div id="app">
    <header>
      <nav class="navbar">
        <div class="nav-brand">
          <h1>PainPal</h1>
        </div>
        <div class="nav-links">
          <router-link to="/">Current Map</router-link>
          <router-link to="/history">History</router-link>
          <router-link to="/demo">Body Map Demo</router-link>
        </div>
      </nav>
    </header>
    
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.nav-links a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}
</style>

