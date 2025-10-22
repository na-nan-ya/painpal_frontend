<template>
  <div class="history-view">
    <h2>Saved Maps History</h2>
    
    <div v-if="loading" class="loading">
      Loading your saved maps...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="savedMaps.length === 0" class="no-maps">
        <div class="card">
          <h3>No Saved Maps</h3>
          <p>You haven't saved any body maps yet. Start tracking your progress by creating and saving maps!</p>
          <router-link to="/">
            <button class="primary">Go to Current Map</button>
          </router-link>
        </div>
      </div>

      <div v-else class="maps-grid">
        <div v-for="map in sortedMaps" :key="map._id" class="card map-card">
          <div class="map-header">
            <h4>{{ formatDate(map.creationDate) }}</h4>
            <span class="badge saved">Saved</span>
          </div>
          
          <div class="map-image">
            <img v-if="map.imageUrl" :src="map.imageUrl" alt="Body Map" />
            <div v-else class="placeholder-image">
              <p>Body Map Image</p>
            </div>
          </div>

          <div class="map-info">
            <p class="map-id">ID: {{ map._id }}</p>
          </div>
        </div>
      </div>

      <div v-if="savedMaps.length > 0" class="maps-summary">
        <p>Total saved maps: <strong>{{ savedMaps.length }}</strong></p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'History',
  data() {
    return {
      savedMaps: [],
      loading: true,
      error: null,
      // TODO: Replace with actual user ID from authentication
      userId: 'user123'
    }
  },
  computed: {
    sortedMaps() {
      return [...this.savedMaps].sort((a, b) => {
        return new Date(b.creationDate) - new Date(a.creationDate)
      })
    }
  },
  mounted() {
    this.loadSavedMaps()
  },
  methods: {
    async loadSavedMaps() {
      try {
        this.loading = true
        this.error = null
        const response = await api.getSavedMaps(this.userId)
        this.savedMaps = response.data.maps || []
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load saved maps'
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.history-view {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 2rem;
  color: #2d3748;
  font-size: 2rem;
}

.no-maps {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.no-maps h3 {
  margin-bottom: 1rem;
  color: #2d3748;
}

.no-maps p {
  margin-bottom: 1.5rem;
  color: #718096;
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.map-card {
  transition: transform 0.3s ease;
}

.map-card:hover {
  transform: translateY(-4px);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.map-header h4 {
  color: #2d3748;
  margin: 0;
  font-size: 1.1rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge.saved {
  background-color: #c6f6d5;
  color: #22543d;
}

.map-image {
  margin: 1rem 0;
  text-align: center;
}

.map-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.placeholder-image {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
  border-radius: 8px;
  padding: 3rem 1rem;
  color: #718096;
  font-size: 1rem;
}

.map-info {
  margin-top: 1rem;
}

.map-id {
  color: #718096;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
}

.maps-summary {
  text-align: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.maps-summary p {
  color: #2d3748;
  font-size: 1.1rem;
}

.maps-summary strong {
  color: #667eea;
}
</style>

