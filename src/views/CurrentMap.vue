<template>
  <div class="current-map-view">
    <h2>Current Body Map</h2>
    
    <div v-if="loading" class="loading">
      Loading your current map...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="!currentMap" class="no-map">
        <div class="card">
          <h3>No Current Map</h3>
          <p>You don't have a current body map. Generate one to get started!</p>
          <button class="primary" @click="generateNewMap" :disabled="generating">
            {{ generating ? 'Generating...' : 'Generate New Map' }}
          </button>
        </div>
      </div>

      <div v-else class="map-container">
        <div class="card">
          <div class="map-header">
            <div>
              <h3>Map ID: {{ currentMap._id }}</h3>
              <p class="map-date">Created: {{ formatDate(currentMap.creationDate) }}</p>
              <p class="map-status">
                <span :class="currentMap.isSaved ? 'badge saved' : 'badge current'">
                  {{ currentMap.isSaved ? 'Saved' : 'Current' }}
                </span>
              </p>
            </div>
          </div>

          <div class="map-image">
            <BodyMapCanvas 
              :initial-selections="mapSelections"
              :user-id="userId"
              :map-id="currentMap._id"
              @selection-change="handleSelectionChange"
            />
          </div>

          <div class="map-actions">
            <button class="primary" @click="generateNewMap" :disabled="generating">
              {{ generating ? 'Generating...' : 'Generate New Map' }}
            </button>
            <button class="secondary" @click="saveCurrentMap" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Map' }}
            </button>
            <button class="danger" @click="clearCurrentMap" :disabled="clearing">
              {{ clearing ? 'Clearing...' : 'Clear Map' }}
            </button>
          </div>

          <div v-if="successMessage" class="success">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'

export default {
  name: 'CurrentMap',
  components: {
    BodyMapCanvas
  },
  data() {
    return {
      currentMap: null,
      loading: true,
      error: null,
      generating: false,
      saving: false,
      clearing: false,
      successMessage: '',
      mapSelections: [],
      // TODO: Replace with actual user ID from authentication
      userId: 'user123'
    }
  },
  mounted() {
    this.loadCurrentMap()
  },
  methods: {
    async loadCurrentMap() {
      try {
        this.loading = true
        this.error = null
        const response = await api.getCurrentMap(this.userId)
        this.currentMap = response.data.map
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load current map'
      } finally {
        this.loading = false
      }
    },
    async generateNewMap() {
      try {
        this.generating = true
        this.error = null
        this.successMessage = ''
        await api.generateMap(this.userId)
        this.successMessage = 'New map generated successfully!'
        await this.loadCurrentMap()
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to generate new map'
      } finally {
        this.generating = false
      }
    },
    async saveCurrentMap() {
      try {
        this.saving = true
        this.error = null
        this.successMessage = ''
        await api.saveMap(this.userId)
        this.successMessage = 'Map saved successfully!'
        await this.loadCurrentMap()
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to save map'
      } finally {
        this.saving = false
      }
    },
    async clearCurrentMap() {
      if (!confirm('Are you sure you want to clear your current map? This action cannot be undone.')) {
        return
      }
      
      try {
        this.clearing = true
        this.error = null
        this.successMessage = ''
        await api.clearMap(this.userId)
        this.successMessage = 'Map cleared successfully!'
        await this.loadCurrentMap()
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to clear map'
      } finally {
        this.clearing = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    handleSelectionChange(selections) {
      this.mapSelections = selections
      // Optionally auto-save selections or emit to parent
      console.log('Selected regions:', selections)
    }
  }
}
</script>

<style scoped>
.current-map-view {
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 2rem;
  color: #2d3748;
  font-size: 2rem;
}

.no-map {
  text-align: center;
}

.no-map h3 {
  margin-bottom: 1rem;
  color: #2d3748;
}

.no-map p {
  margin-bottom: 1.5rem;
  color: #718096;
}

.map-container {
  margin-bottom: 2rem;
}

.map-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.map-header h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.map-date {
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.map-status {
  margin-top: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge.current {
  background-color: #bee3f8;
  color: #2c5282;
}

.badge.saved {
  background-color: #c6f6d5;
  color: #22543d;
}

.map-image {
  margin: 1.5rem 0;
  width: 100%;
}

.map-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.map-actions button {
  flex: 1;
  min-width: 150px;
}
</style>

