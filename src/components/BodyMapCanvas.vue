<template>
  <div class="body-map-canvas">
    <div class="controls">
      <h3>Body Map Selector</h3>
      <div class="rotation-controls">
        <label>Rotate View: {{ rotationAngle }}°</label>
        <input 
          type="range" 
          v-model.number="rotationAngle" 
          min="0" 
          max="360" 
          step="1"
          class="rotation-slider"
        />
        <div class="rotation-buttons">
          <button @click="setView(0)">Front</button>
          <button @click="setView(90)">Right</button>
          <button @click="setView(180)">Back</button>
          <button @click="setView(270)">Left</button>
        </div>
      </div>
      
      <div class="selection-info">
        <h4>Selected Regions ({{ selectedRegions.length }})</h4>
        <div class="selected-tags">
          <span 
            v-for="region in selectedRegions" 
            :key="region"
            class="tag"
            :class="getScoreClass(regionScores[region])"
            @click.stop="openScoreDialog(region)"
            @dblclick="deselectRegion(region)"
          >
            {{ formatRegionName(region) }}
            <span v-if="regionScores[region]" class="score-badge">{{ regionScores[region] }}</span>
            <span class="remove-btn" @click.stop="deselectRegion(region)">×</span>
          </span>
          <span v-if="selectedRegions.length === 0" class="empty-state">
            Click on body regions to select them
          </span>
        </div>
        <button 
          v-if="selectedRegions.length > 0" 
          @click="clearSelections"
          class="clear-btn"
        >
          Clear All
        </button>
      </div>

    </div>

    <div class="body-view-container">
      <div class="view-indicator">{{ currentViewName }}</div>
      
      <div class="zoom-controls">
        <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomOut" class="zoom-btn" title="Zoom Out">−</button>
        <button @click="resetZoom" class="zoom-btn reset" title="Reset Zoom">⟲</button>
      </div>

      <svg 
        class="body-svg" 
        :viewBox="`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`"
        xmlns="http://www.w3.org/2000/svg"
        @click="handleBackgroundClick"
        @wheel="handleWheel"
        ref="bodySvg"
      >
        <!-- Render the appropriate view based on rotation angle -->
        <g v-if="currentView === 'front'">
          <BodyViewFront 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
          />
        </g>
        <g v-else-if="currentView === 'back'">
          <BodyViewBack 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
          />
        </g>
        <g v-else-if="currentView === 'left'">
          <BodyViewSide 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
            side="left"
          />
        </g>
        <g v-else-if="currentView === 'right'">
          <BodyViewSide 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
            side="right"
          />
        </g>
      </svg>
    </div>

    <!-- Pain Score Dialog -->
    <transition name="dialog-fade">
      <div v-if="showScoreDialog" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog-card">
          <div class="dialog-header">
            <h3>Rate Pain Intensity</h3>
            <button @click="closeDialog" class="close-btn">×</button>
          </div>
          
          <div class="dialog-body">
            <p class="region-name">{{ formatRegionName(currentScoringRegion) }}</p>
            
            <!-- Error Message -->
            <div v-if="errorMessage" class="error-banner">
              <span>⚠️ {{ errorMessage }}</span>
            </div>
            
            <!-- Loading Indicator -->
            <div v-if="isLoading" class="loading-indicator">
              <div class="spinner"></div>
              <span>Saving...</span>
            </div>
            
            <div class="score-input-section" :class="{ 'disabled': isLoading }">
              <label>Pain Score (1-10)</label>
              <div class="score-slider-container">
                <input 
                  type="range" 
                  v-model.number="tempScore" 
                  min="1" 
                  max="10" 
                  step="1"
                  class="score-slider"
                  :style="{ '--slider-value': (tempScore - 1) * 11.11 + '%' }"
                />
                <div class="score-labels">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              
              <div class="score-display">
                <div class="score-value" :class="getScoreClass(tempScore)">
                  {{ tempScore }}
                </div>
                <div class="score-description">{{ getScoreDescription(tempScore) }}</div>
              </div>
              
              <div class="score-input-group">
                <input 
                  type="number" 
                  v-model.number="tempScore" 
                  min="1" 
                  max="10" 
                  class="score-number-input"
                  @blur="validateScore"
                />
                <span class="input-label">Manual entry</span>
              </div>
            </div>
          </div>
          
          <div class="dialog-footer">
            <button @click="deleteScore" class="delete-btn" v-if="regionScores[currentScoringRegion]" :disabled="isLoading">
              Delete Score
            </button>
            <div class="spacer"></div>
            <button @click="closeDialog" class="cancel-btn" :disabled="isLoading">Cancel</button>
            <button @click="saveScore" class="save-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Save Score' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import BodyViewFront from './BodyViewFront.vue'
import BodyViewBack from './BodyViewBack.vue'
import BodyViewSide from './BodyViewSide.vue'
import api from '@/services/api'

export default {
  name: 'BodyMapCanvas',
  components: {
    BodyViewFront,
    BodyViewBack,
    BodyViewSide
  },
  props: {
    initialSelections: {
      type: Array,
      default: () => []
    },
    userId: {
      type: String,
      required: true
    },
    mapId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      rotationAngle: 0,
      selectedRegions: [...this.initialSelections],
      showScoreDialog: false,
      currentScoringRegion: null,
      tempScore: 5,
      regionScores: {}, // Store scores for each region { regionName: score }
      regionIds: {}, // Store API region IDs { regionName: regionId }
      isLoading: false,
      errorMessage: null,
      zoomLevel: 1,
      minZoom: 0.5,
      maxZoom: 3,
      isPinching: false
    }
  },
  computed: {
    currentView() {
      // Determine which view to show based on rotation angle
      const angle = this.rotationAngle % 360
      if (angle >= 315 || angle < 45) return 'front'
      if (angle >= 45 && angle < 135) return 'right'
      if (angle >= 135 && angle < 225) return 'back'
      if (angle >= 225 && angle < 315) return 'left'
      return 'front'
    },
    currentViewName() {
      const names = {
        'front': 'Front View',
        'back': 'Back View',
        'left': 'Left Side View',
        'right': 'Right Side View'
      }
      return names[this.currentView]
    },
    viewBoxWidth() {
      return 400 / this.zoomLevel
    },
    viewBoxHeight() {
      return 800 / this.zoomLevel
    },
    viewBoxX() {
      return (400 - this.viewBoxWidth) / 2
    },
    viewBoxY() {
      return (800 - this.viewBoxHeight) / 2
    }
  },
  methods: {
    async toggleRegion(regionName) {
      const index = this.selectedRegions.indexOf(regionName)
      if (index > -1) {
        // Region is being deselected - delete from API
        await this.removeRegionFromAPI(regionName)
        this.selectedRegions.splice(index, 1)
      } else {
        // Region is being selected - add to API and open dialog
        this.selectedRegions.push(regionName)
        await this.addRegionToAPI(regionName)
        this.openScoreDialog(regionName)
      }
      this.emitSelectionChange()
    },
    
    async addRegionToAPI(regionName) {
      if (!this.mapId) {
        console.warn('No mapId provided, skipping API call')
        return
      }
      
      try {
        this.isLoading = true
        const response = await api.addRegion(this.userId, this.mapId, regionName)
        // Store the region ID returned from the API
        if (response.data && response.data.region) {
          this.regionIds[regionName] = response.data.region
        }
      } catch (error) {
        console.error('Error adding region:', error)
        this.errorMessage = 'Failed to add region. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    async removeRegionFromAPI(regionName) {
      const regionId = this.regionIds[regionName]
      if (!regionId) {
        console.warn('No region ID found, skipping API delete')
        return
      }
      
      try {
        this.isLoading = true
        await api.deleteRegion(this.userId, regionId)
        delete this.regionIds[regionName]
        delete this.regionScores[regionName]
      } catch (error) {
        console.error('Error deleting region:', error)
        this.errorMessage = 'Failed to delete region. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    async loadRegionsFromAPI() {
      if (!this.mapId) {
        console.warn('No mapId provided, skipping API call')
        return
      }
      
      try {
        this.isLoading = true
        const response = await api.getRegionsForMap(this.userId, this.mapId)
        
        if (response.data && Array.isArray(response.data)) {
          // Load regions from API
          response.data.forEach(region => {
            if (region.name && !this.selectedRegions.includes(region.name)) {
              this.selectedRegions.push(region.name)
            }
            if (region._id) {
              this.regionIds[region.name] = region._id
            }
            if (region.score !== undefined) {
              this.regionScores[region.name] = region.score
            }
          })
        }
      } catch (error) {
        console.error('Error loading regions:', error)
        this.errorMessage = 'Failed to load regions. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    openScoreDialog(regionName) {
      this.currentScoringRegion = regionName
      this.tempScore = this.regionScores[regionName] || 5
      this.showScoreDialog = true
    },
    
    closeDialog() {
      this.showScoreDialog = false
      this.currentScoringRegion = null
      this.errorMessage = null
    },
    
    async saveScore() {
      if (!this.currentScoringRegion || this.tempScore < 1 || this.tempScore > 10) {
        return
      }
      
      const regionId = this.regionIds[this.currentScoringRegion]
      if (!regionId) {
        console.warn('No region ID found, skipping API score update')
        this.regionScores[this.currentScoringRegion] = this.tempScore
        this.closeDialog()
        return
      }
      
      try {
        this.isLoading = true
        await api.scoreRegion(this.userId, regionId, this.tempScore)
        this.regionScores[this.currentScoringRegion] = this.tempScore
        this.closeDialog()
      } catch (error) {
        console.error('Error scoring region:', error)
        this.errorMessage = 'Failed to save score. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    async deleteScore() {
      if (!this.currentScoringRegion) return
      
      const regionId = this.regionIds[this.currentScoringRegion]
      if (!regionId) {
        delete this.regionScores[this.currentScoringRegion]
        this.closeDialog()
        return
      }
      
      try {
        this.isLoading = true
        // Score the region with 0 to indicate no score (or you could delete and re-add)
        await api.scoreRegion(this.userId, regionId, 1)
        delete this.regionScores[this.currentScoringRegion]
        this.closeDialog()
      } catch (error) {
        console.error('Error deleting score:', error)
        this.errorMessage = 'Failed to delete score. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    validateScore() {
      if (this.tempScore < 1) this.tempScore = 1
      if (this.tempScore > 10) this.tempScore = 10
      if (isNaN(this.tempScore)) this.tempScore = 5
    },
    getScoreClass(score) {
      if (score <= 3) return 'score-low'
      if (score <= 6) return 'score-medium'
      return 'score-high'
    },
    getScoreDescription(score) {
      if (score <= 2) return 'Mild Pain'
      if (score <= 4) return 'Moderate Pain'
      if (score <= 6) return 'Noticeable Pain'
      if (score <= 8) return 'Severe Pain'
      return 'Very Severe Pain'
    },
    deselectRegion(regionId) {
      const index = this.selectedRegions.indexOf(regionId)
      if (index > -1) {
        this.selectedRegions.splice(index, 1)
      }
      this.emitSelectionChange()
    },
    async clearSelections() {
      // Delete all regions from API
      for (const regionName of this.selectedRegions) {
        await this.removeRegionFromAPI(regionName)
      }
      this.selectedRegions = []
      this.regionScores = {}
      this.regionIds = {}
      this.emitSelectionChange()
    },
    setView(angle) {
      this.rotationAngle = angle
    },
    formatRegionName(regionId) {
      // Convert region IDs to readable names
      return regionId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    handleBackgroundClick(event) {
      // Only clear if clicking directly on SVG background
      if (event.target.tagName === 'svg') {
        // Optionally clear selections on background click
      }
    },
    emitSelectionChange() {
      this.$emit('selection-change', [...this.selectedRegions])
    },
    
    // Zoom controls
    zoomIn() {
      this.zoomLevel = Math.min(this.zoomLevel + 0.2, this.maxZoom)
    },
    
    zoomOut() {
      this.zoomLevel = Math.max(this.zoomLevel - 0.2, this.minZoom)
    },
    
    resetZoom() {
      this.zoomLevel = 1
    },
    
    handleWheel(event) {
      // Handle trackpad pinch-to-zoom and scroll wheel
      if (event.ctrlKey || event.metaKey) {
        // Pinch-to-zoom on trackpad (shows as ctrl+wheel)
        event.preventDefault()
        
        const delta = -event.deltaY * 0.01
        const newZoom = this.zoomLevel + delta
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
      }
    },
    
    // Safari/WebKit gesture events for trackpad pinch
    handleGestureStart(event) {
      event.preventDefault()
      this.isPinching = true
    },
    
    handleGestureChange(event) {
      event.preventDefault()
      if (this.isPinching) {
        const newZoom = this.zoomLevel * event.scale
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
      }
    },
    
    handleGestureEnd(event) {
      event.preventDefault()
      this.isPinching = false
    }
  },
  watch: {
    initialSelections(newVal) {
      this.selectedRegions = [...newVal]
    },
    mapId(newMapId) {
      if (newMapId) {
        this.loadRegionsFromAPI()
      }
    }
  },
  mounted() {
    if (this.mapId) {
      this.loadRegionsFromAPI()
    }
    
    // Add gesture event listeners for trackpad pinch
    const svg = this.$refs.bodySvg
    if (svg) {
      svg.addEventListener('gesturestart', this.handleGestureStart)
      svg.addEventListener('gesturechange', this.handleGestureChange)
      svg.addEventListener('gestureend', this.handleGestureEnd)
    }
  },
  beforeUnmount() {
    // Clean up gesture event listeners
    const svg = this.$refs.bodySvg
    if (svg) {
      svg.removeEventListener('gesturestart', this.handleGestureStart)
      svg.removeEventListener('gesturechange', this.handleGestureChange)
      svg.removeEventListener('gestureend', this.handleGestureEnd)
    }
  }
}
</script>

<style scoped>
.body-map-canvas {
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.controls {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.controls h3 {
  margin: 0;
  color: #2d3748;
}

.rotation-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rotation-controls label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.rotation-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  margin-bottom: 1rem;
}

.rotation-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.rotation-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: none;
}

.rotation-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.rotation-buttons button {
  padding: 0.5rem;
  background-color: #e2e8f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.rotation-buttons button:hover {
  background-color: #bfdbfe;
}

.selection-info {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selection-info h4 {
  margin: 0 0 1rem 0;
  color: #2d3748;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 60px;
  margin-bottom: 1rem;
}

.tag {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.tag:hover {
  opacity: 0.8;
}

.empty-state {
  color: #a0aec0;
  font-style: italic;
  font-size: 0.9rem;
}

.clear-btn {
  width: 100%;
  padding: 0.6rem;
  background-color: #fc8181;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background-color: #f56565;
}

/* Score badges on tags */
.tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding-right: 2rem;
}

.score-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
}

.remove-btn {
  position: absolute;
  right: 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1;
}

/* Pain score colors */
.tag.score-low {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.tag.score-medium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.tag.score-high {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* Dialog styles */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-card,
.dialog-fade-leave-active .dialog-card {
  transition: transform 0.3s ease;
}

.dialog-fade-enter-from .dialog-card,
.dialog-fade-leave-to .dialog-card {
  transform: scale(0.9);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 480px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  line-height: 1;
  padding: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-body {
  padding: 2rem;
}

.region-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2rem 0;
  text-align: center;
}

.score-input-section label {
  display: block;
  font-weight: 600;
  color: #475569;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.score-slider-container {
  margin-bottom: 2rem;
}

.score-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    #10b981 0%,
    #f59e0b 50%,
    #ef4444 100%
  );
  position: relative;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 3px #3b82f6;
  transition: transform 0.2s;
}

.score-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.score-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.score-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.score-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 16px;
}

.score-value {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
  min-width: 80px;
  text-align: center;
  padding: 0.5rem 1rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-value.score-low {
  color: #059669;
  border: 3px solid #10b981;
}

.score-value.score-medium {
  color: #d97706;
  border: 3px solid #f59e0b;
}

.score-value.score-high {
  color: #dc2626;
  border: 3px solid #ef4444;
}

.score-description {
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.score-number-input {
  width: 80px;
  padding: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.score-number-input:focus {
  border-color: #3b82f6;
}

.input-label {
  color: #64748b;
  font-size: 0.95rem;
}

.dialog-footer {
  padding: 1.5rem 2rem;
  background: #f8fafc;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.spacer {
  flex: 1;
}

.cancel-btn,
.save-btn,
.delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.cancel-btn {
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.save-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.cancel-btn:disabled,
.save-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Error Banner */
.error-banner {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #dc2626;
  font-weight: 600;
  text-align: center;
}

/* Loading Indicator */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #1d4ed8;
  font-weight: 600;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #bfdbfe;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.score-input-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.body-view-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  touch-action: none; /* Enable better gesture handling */
}

.view-indicator {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  z-index: 10;
}

/* Zoom Controls */
.zoom-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #3b82f6;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.zoom-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.zoom-btn:active {
  transform: translateY(0);
}

.zoom-btn.reset {
  font-size: 1.25rem;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-weight: 600;
  color: #64748b;
  font-size: 0.9rem;
}

.body-svg {
  max-width: 100%;
  height: auto;
  cursor: default;
}

@media (max-width: 900px) {
  .body-map-canvas {
    flex-direction: column;
  }

  .controls {
    flex: 1;
  }
}
</style>

