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

      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <h4>Zoom Controls</h4>
        <div class="zoom-buttons">
          <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button @click="zoomOut" class="zoom-btn" title="Zoom Out">−</button>
          <button @click="resetZoom" class="zoom-btn reset" title="Reset Zoom">⟲</button>
        </div>
      </div>

    </div>

    <div class="body-view-container">
      <div class="view-indicator">{{ currentViewName }}</div>

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
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
          />
        </g>
        <g v-else-if="currentView === 'back'">
          <BodyViewBack 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
          />
        </g>
        <g v-else-if="currentView === 'left'">
          <BodyViewSide 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
            side="left"
          />
        </g>
        <g v-else-if="currentView === 'right'">
          <BodyViewSide 
            :selected-regions="selectedRegions"
            @region-click="toggleRegion"
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
            side="right"
          />
        </g>
      </svg>
      
      <!-- Hover Tooltip -->
      <div 
        v-if="hoveredRegion" 
        class="region-tooltip"
        :style="{
          left: tooltipX + 'px',
          top: tooltipY + 'px'
        }"
      >
        {{ formatRegionName(hoveredRegion) }}
      </div>
    </div>

    <!-- Pain Score Dialog -->
    <transition name="dialog-fade">
      <div v-if="showScoreDialog" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog-card" @click.stop>
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
            
            <div class="score-input-section" :class="{ 'disabled': isLoading }" @mousedown.stop @click.stop>
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
                  @mousedown.stop
                  @mouseup.stop
                  @click.stop
                  @change.stop="handleSliderChange"
                  @input.stop="handleSliderInput"
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
                  @mousedown.stop
                  @mouseup.stop
                  @click.stop
                  @change.stop="handleNumberChange"
                  @input.stop="handleNumberInput"
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
    savedRegions: {
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
      isPinching: false,
      // Hover functionality
      hoveredRegion: null,
      tooltipX: 0,
      tooltipY: 0
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
      console.log('\n==== TOGGLE REGION START ====');
      console.log('💆 BodyMapCanvas: toggleRegion called for:', regionName)
      console.log('💆 BodyMapCanvas: Current selectedRegions:', this.selectedRegions)
      
      const index = this.selectedRegions.indexOf(regionName)
      console.log('💆 BodyMapCanvas: Region index in selectedRegions:', index)
      
      if (index > -1) {
        // Region is being deselected - delete from API
        console.log('❌ BodyMapCanvas: Deselecting region:', regionName)
        await this.removeRegionFromAPI(regionName)
        this.selectedRegions.splice(index, 1)
        console.log('❌ BodyMapCanvas: Region removed. New selectedRegions:', this.selectedRegions)
      } else {
        // Region is being selected - add to API and open dialog
        console.log('✅ BodyMapCanvas: Selecting new region:', regionName)
        this.selectedRegions.push(regionName)
        console.log('✅ BodyMapCanvas: Region added. New selectedRegions:', this.selectedRegions)
        
        await this.addRegionToAPI(regionName)
        
        console.log('📝 BodyMapCanvas: About to open scoring dialog for:', regionName)
        console.log('📝 BodyMapCanvas: showScoreDialog before openScoreDialog:', this.showScoreDialog)
        this.openScoreDialog(regionName)
        console.log('📝 BodyMapCanvas: showScoreDialog after openScoreDialog:', this.showScoreDialog)
      }
      
      this.emitSelectionChange()
      console.log('==== TOGGLE REGION END ====\n');
    },
    
    async addRegionToAPI(regionName) {
      if (!this.mapId) {
        console.warn('No mapId provided, skipping API call')
        return
      }
      
      // Check if we're in mock mode (mapId starts with 'map-')
      if (this.mapId && this.mapId.startsWith('map-')) {
        console.log('Mock mode: Simulating region addition for', regionName)
        // Generate a mock region ID
        this.regionIds[regionName] = `${this.mapId}-${regionName}-${Date.now()}`
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
      
      // Check if we're in mock mode
      if (this.mapId && this.mapId.startsWith('map-')) {
        console.log('Mock mode: Simulating region removal for', regionName)
        delete this.regionIds[regionName]
        delete this.regionScores[regionName]
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
      
      // Check if we're in mock mode (mapId starts with 'map-')
      if (this.mapId && this.mapId.startsWith('map-')) {
        console.log('Mock mode: Using initialSelections for regions', this.initialSelections)
        
        // Use initialSelections as the source of truth in mock mode
        this.selectedRegions = [...this.initialSelections]
        
        // Ensure we have mock region IDs and scores
        this.initialSelections.forEach(regionName => {
          if (!this.regionIds[regionName]) {
            this.regionIds[regionName] = `${this.mapId}-${regionName}-${Date.now()}`
          }
          if (!this.regionScores[regionName]) {
            this.regionScores[regionName] = Math.floor(Math.random() * 8) + 3 // Random score 3-10
          }
        })
        
        this.emitSelectionChange()
        return
      }
      
      try {
        this.isLoading = true
        const response = await api.getRegionsForMap(this.userId, this.mapId)
        
        if (response.data && Array.isArray(response.data)) {
          // Clear existing data
          this.selectedRegions = []
          this.regionIds = {}
          this.regionScores = {}
          
          // Load regions from API
          response.data.forEach(region => {
            if (region.name) {
              this.selectedRegions.push(region.name)
            }
            if (region._id) {
              this.regionIds[region.name] = region._id
            }
            if (region.score !== undefined) {
              this.regionScores[region.name] = region.score
            }
          })
          this.emitSelectionChange()
        }
      } catch (error) {
        console.error('Error loading regions:', error)
        this.errorMessage = 'Failed to load regions. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    openScoreDialog(regionName) {
      console.log('📝 BodyMapCanvas: openScoreDialog called for:', regionName)
      console.log('📝 BodyMapCanvas: Current regionScores:', this.regionScores)
      console.log('📝 BodyMapCanvas: Existing score for', regionName, ':', this.regionScores[regionName])
      
      this.currentScoringRegion = regionName
      this.tempScore = this.regionScores[regionName] || 5
      this.showScoreDialog = true
      
      console.log('📝 BodyMapCanvas: Dialog should now be visible. showScoreDialog =', this.showScoreDialog)
      console.log('📝 BodyMapCanvas: currentScoringRegion =', this.currentScoringRegion)
      console.log('📝 BodyMapCanvas: tempScore =', this.tempScore)
      
      // Prevent any background clicks from interfering
      this.$nextTick(() => {
        const dialog = document.querySelector('.dialog-overlay')
        if (dialog) {
          dialog.addEventListener('click', this.preventDialogClose, true)
        }
      })
    },
    
    preventDialogClose(event) {
      // Only prevent if clicking on dialog elements
      if (event.target.closest('.score-slider-container') || 
          event.target.closest('.score-input-group') ||
          event.target.closest('.score-display')) {
        event.stopPropagation()
      }
    },
    
    closeDialog() {
      this.showScoreDialog = false
      this.currentScoringRegion = null
      this.errorMessage = null
      
      // Clean up event listeners
      const dialog = document.querySelector('.dialog-overlay')
      if (dialog) {
        dialog.removeEventListener('click', this.preventDialogClose, true)
      }
    },
    
    async saveScore() {
      console.log('\n==== SAVE SCORE START ====');
      console.log('💾 BodyMapCanvas: saveScore called')
      console.log('💾 BodyMapCanvas: currentScoringRegion:', this.currentScoringRegion)
      console.log('💾 BodyMapCanvas: tempScore:', this.tempScore)
      console.log('💾 BodyMapCanvas: regionScores before:', this.regionScores)
      
      if (!this.currentScoringRegion || this.tempScore < 1 || this.tempScore > 10) {
        console.log('❌ BodyMapCanvas: Invalid data - currentScoringRegion:', this.currentScoringRegion, 'tempScore:', this.tempScore)
        return
      }
      
      const regionId = this.regionIds[this.currentScoringRegion]
      console.log('💾 BodyMapCanvas: regionId for', this.currentScoringRegion, ':', regionId)
      
      if (!regionId) {
        console.warn('No region ID found, skipping API score update')
        this.regionScores[this.currentScoringRegion] = this.tempScore
        console.log('💾 BodyMapCanvas: Score saved locally. regionScores after:', this.regionScores)
        
        // Close dialog first, then emit change
        this.closeDialog()
        
        // Use $nextTick to ensure the score is saved before emitting
        this.$nextTick(() => {
          console.log('💾 BodyMapCanvas: About to emit selection change with locally saved score')
          this.emitSelectionChange() // Notify parent of score update
        })
        
        console.log('==== SAVE SCORE END (no regionId) ====\n');
        return
      }
      
      // Check if we're in mock mode
      if (this.mapId && this.mapId.startsWith('map-')) {
        console.log('🎭 Mock mode: Simulating score save for', this.currentScoringRegion, 'with score', this.tempScore)
        this.regionScores[this.currentScoringRegion] = this.tempScore
        console.log('🎭 Mock mode: Score saved. regionScores after:', this.regionScores)
        
        // Close dialog first, then emit change
        this.closeDialog()
        
        // Use $nextTick to ensure the score is saved before emitting
        this.$nextTick(() => {
          console.log('🎭 Mock mode: About to emit selection change with updated scores')
          this.emitSelectionChange() // Notify parent of score update
        })
        
        console.log('==== SAVE SCORE END (mock mode) ====\n');
        return
      }
      
      try {
        this.isLoading = true
        console.log('🌐 BodyMapCanvas: Making API call to save score...')
        await api.scoreRegion(this.userId, regionId, this.tempScore)
        this.regionScores[this.currentScoringRegion] = this.tempScore
        console.log('🌐 BodyMapCanvas: API call successful. regionScores after:', this.regionScores)
        
        // Close dialog first, then emit change
        this.closeDialog()
        
        // Use $nextTick to ensure the score is saved before emitting
        this.$nextTick(() => {
          console.log('🌐 BodyMapCanvas: About to emit selection change after API success')
          this.emitSelectionChange() // Notify parent of score update
        })
        
        console.log('==== SAVE SCORE END (API success) ====\n');
      } catch (error) {
        console.error('Error scoring region:', error)
        this.errorMessage = 'Failed to save score. Please try again.'
        console.log('==== SAVE SCORE END (API error) ====\n');
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
        this.emitSelectionChange() // Notify parent of score deletion
        return
      }
      
      try {
        this.isLoading = true
        // Score the region with 0 to indicate no score (or you could delete and re-add)
        await api.scoreRegion(this.userId, regionId, 1)
        delete this.regionScores[this.currentScoringRegion]
        this.closeDialog()
        this.emitSelectionChange() // Notify parent of score deletion
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
    
    formatRegionName(regionName) {
      if (!regionName) return ''
      return regionName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    
    handleBackgroundClick() {
      console.log('🖱️ BodyMapCanvas: handleBackgroundClick called')
      console.log('🖱️ BodyMapCanvas: showScoreDialog:', this.showScoreDialog)
      
      // Close dialog if open and click is not on a region
      if (this.showScoreDialog) {
        console.log('🖱️ BodyMapCanvas: Closing dialog due to background click')
        this.closeDialog()
      }
    },
    
    handleSliderChange(event) {
      event.stopPropagation()
      event.preventDefault()
      console.log('🎯 BodyMapCanvas: Slider change event - tempScore:', this.tempScore)
      // Just update the score, don't emit any selection changes
    },
    
    handleSliderInput(event) {
      event.stopPropagation()
      event.preventDefault()
      console.log('🎯 BodyMapCanvas: Slider input event - tempScore:', this.tempScore)
      // Just update the score, don't emit any selection changes
    },
    
    handleNumberChange(event) {
      event.stopPropagation()
      event.preventDefault()
      console.log('🔢 BodyMapCanvas: Number input change event - tempScore:', this.tempScore)
      // Just update the score, don't emit any selection changes
    },
    
    handleNumberInput(event) {
      event.stopPropagation()
      event.preventDefault()
      console.log('🔢 BodyMapCanvas: Number input input event - tempScore:', this.tempScore)
      // Just update the score, don't emit any selection changes
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
    },
    
    // Hover functionality methods
    handleRegionHover(event) {
      const { regionName, mouseEvent } = event
      this.hoveredRegion = regionName
      
      // Position tooltip near mouse cursor
      const rect = this.$refs.bodySvg.getBoundingClientRect()
      this.tooltipX = mouseEvent.clientX - rect.left + 10
      this.tooltipY = mouseEvent.clientY - rect.top - 30
    },
    
    handleRegionLeave() {
      this.hoveredRegion = null
    },
    
    emitSelectionChange() {
      // Emit both selections and their scores to parent component
      const regionsWithScores = this.selectedRegions.map(regionName => ({
        name: regionName,
        score: this.regionScores[regionName] || null
      }))
      
      console.log('🔄 BodyMapCanvas: Emitting selection change:', {
        selections: this.selectedRegions,
        regionsWithScores: regionsWithScores,
        allRegionScores: this.regionScores
      })
      
      // Add safeguard to prevent excessive emissions
      if (!this._emitTimeout) {
        this._emitTimeout = setTimeout(() => {
          this.$emit('selection-change', this.selectedRegions, regionsWithScores)
          this._emitTimeout = null
        }, 10) // Small delay to batch multiple rapid changes
      }
    },
    
    loadRegionsFromAPI() {
      // This method would load regions from the real API
      // For now, we're in mock mode, so this is a placeholder
      console.log('🔄 BodyMapCanvas: loadRegionsFromAPI called (mock mode - no action needed)')
    }
  },
  watch: {
    initialSelections(newVal, oldVal) {
      console.log('🎨 BodyMapCanvas: initialSelections changed from', oldVal, 'to', newVal)
      
      // Clear existing selections first
      this.selectedRegions = []
      this.regionIds = {}
      this.regionScores = {}
      
      // Then set new selections (without automatic scoring)
      this.selectedRegions = [...newVal]
      console.log('🎨 BodyMapCanvas: selectedRegions updated to:', this.selectedRegions)
      
      // In mock mode, ensure we have region IDs but DON'T assign automatic scores
      // Scores should only be assigned through the scoring dialog or when loading saved map data
      if (this.mapId && this.mapId.startsWith('map-')) {
        newVal.forEach(regionName => {
          if (!this.regionIds[regionName]) {
            this.regionIds[regionName] = `${this.mapId}-${regionName}-${Date.now()}`
          }
          // NOTE: Do not assign automatic scores here - let user score manually through dialog
        })
      }
      
      // Only emit if this is not part of a larger update cycle
      console.log('🎨 BodyMapCanvas: Skipping emitSelectionChange from initialSelections watcher to prevent loops')
    },
    
    savedRegions(newVal) {
      console.log('💾 BodyMapCanvas: savedRegions changed to:', newVal)
      console.log('💾 BodyMapCanvas: savedRegions array details:')
      if (newVal && Array.isArray(newVal)) {
        newVal.forEach((region, index) => {
          console.log(`  [${index}]:`, region, 'name:', region?.name, 'score:', region?.score)
        })
      } else {
        console.log('  savedRegions is not a valid array:', typeof newVal)
      }
      
      // Load scores from saved regions (for historical maps that already have scores)
      // IMPORTANT: Don't emit changes here to prevent recursive loops
      if (newVal && newVal.length > 0) {
        let hasNewScores = false
        newVal.forEach((region, index) => {
          console.log(`💾 BodyMapCanvas: Processing region ${index}:`, region)
          console.log(`💾 BodyMapCanvas: Region name: ${region?.name}, score: ${region?.score}, type: ${typeof region?.score}`)
          
          if (region && region.name && region.score !== undefined && region.score !== null) {
            console.log(`💾 BodyMapCanvas: Current regionScores[${region.name}]:`, this.regionScores[region.name])
            if (this.regionScores[region.name] !== region.score) {
              console.log('💾 BodyMapCanvas: Loading saved score', region.score, 'for region', region.name)
              this.regionScores[region.name] = region.score
              hasNewScores = true
            } else {
              console.log('💾 BodyMapCanvas: Score already loaded for', region.name)
            }
          } else {
            console.log(`💾 BodyMapCanvas: Skipping region ${index} - invalid data or no score`)
          }
        })
        
        // Only emit if we actually loaded new scores (prevents recursive loops)
        if (hasNewScores) {
          console.log('💾 BodyMapCanvas: New scores loaded - will emit on next user interaction')
          // Don't emit here to prevent recursive loops - parent already has the data
        } else {
          console.log('💾 BodyMapCanvas: No new scores to load')
        }
      } else {
        console.log('💾 BodyMapCanvas: No savedRegions to process')
      }
      
      console.log('💾 BodyMapCanvas: Final regionScores:', this.regionScores)
    },
    mapId(newMapId, oldMapId) {
      console.log('mapId changed from', oldMapId, 'to', newMapId)
      
      // Clear old data when switching maps
      if (oldMapId !== newMapId) {
        this.selectedRegions = []
        this.regionIds = {}
        this.regionScores = {}
      }
      
      if (newMapId && newMapId !== oldMapId) {
        this.loadRegionsFromAPI()
      }
    }
  },
  mounted() {
    console.log('🔄 BodyMapCanvas: Component mounted!')
    console.log('🔄 BodyMapCanvas: Initial state - showScoreDialog:', this.showScoreDialog)
    console.log('🔄 BodyMapCanvas: Initial state - selectedRegions:', this.selectedRegions)
    console.log('🔄 BodyMapCanvas: Initial state - mapId:', this.mapId)
    console.log('🔄 BodyMapCanvas: Initial state - savedRegions prop:', this.savedRegions)
    console.log('🔄 BodyMapCanvas: Initial state - initialSelections prop:', this.initialSelections)
    
    // Load scores from savedRegions if available on mount
    if (this.savedRegions && this.savedRegions.length > 0) {
      console.log('🔄 BodyMapCanvas: Loading scores from savedRegions on mount')
      this.savedRegions.forEach((region, index) => {
        console.log(`🔄 BodyMapCanvas: Mount - Processing region ${index}:`, region)
        if (region && region.name && region.score !== undefined && region.score !== null) {
          console.log('🔄 BodyMapCanvas: Mount - Loading score', region.score, 'for region', region.name)
          this.regionScores[region.name] = region.score
        }
      })
      console.log('🔄 BodyMapCanvas: Mount - Final regionScores after loading:', this.regionScores)
    }
    
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
    
    // Clear any pending emit timeout
    if (this._emitTimeout) {
      clearTimeout(this._emitTimeout)
      this._emitTimeout = null
    }
  }
}
</script>

<style scoped>
.body-map-canvas {
  display: flex;
  gap: 0.75rem; /* Smaller gap */
  max-width: 100%; /* Use full available width */
  margin: 0;
  height: 100%; /* Use full height */
}

.controls {
  flex: 0 0 200px; /* Much smaller controls */
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* Smaller gap */
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 2px solid rgba(144, 91, 247, 0.6);
  box-shadow: 0 4px 20px rgba(144, 91, 247, 0.15), 0 0 0 1px rgba(144, 91, 247, 0.08);
  padding: 0.75rem;
}

.controls h3 {
  margin: 0;
  color: #2d3748;
}

.rotation-controls {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(144, 91, 247, 0.6);
  padding: 0.75rem; /* Reduced padding */
  border-radius: 12px; /* Slightly larger radius for modern look */
  box-shadow: 0 4px 15px rgba(144, 91, 247, 0.15), 0 0 0 1px rgba(144, 91, 247, 0.08);
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
  background: linear-gradient(90deg, #3A9DCA 0%, #2074A2 100%);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 3px solid rgba(144, 91, 247, 0.7);
  padding: 0.75rem; /* Reduced padding */
  border-radius: 12px; /* Slightly larger radius for modern look */
  box-shadow: 0 4px 20px rgba(144, 91, 247, 0.25), 0 0 0 1px rgba(144, 91, 247, 0.15);
}

.selection-info h4 {
  margin: 0 0 0.75rem 0; /* Reduced margin */
  color: #2d3748;
  font-size: 0.9rem; /* Smaller font */
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem; /* Smaller gap */
  min-height: 40px; /* Smaller min height */
  margin-bottom: 0.75rem; /* Reduced margin */
}

.tag {
  background: linear-gradient(135deg, #6B84CD 0%, #3975A3 100%);
  color: white;
  padding: 0.3rem 0.6rem; /* Reduced padding */
  border-radius: 12px; /* Smaller radius */
  font-size: 0.75rem; /* Smaller font */
  cursor: pointer;
  transition: opacity 0.2s;
}

.tag:hover {
  opacity: 0.8;
}

.empty-state {
  color: #a0aec0;
  font-style: italic;
  font-size: 0.8rem; /* Smaller font */
}

.clear-btn {
  width: 100%;
  padding: 0.5rem; /* Reduced padding */
  background: linear-gradient(135deg, rgba(144, 91, 247, 0.8), rgba(117, 21, 196, 0.85));
  color: white;
  border: 1px solid rgba(144, 91, 247, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem; /* Smaller font */
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.clear-btn:hover {
  background: linear-gradient(135deg, rgba(117, 21, 196, 0.9), rgba(49, 1, 151, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(144, 91, 247, 0.4);
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(146, 171, 252, 0.5);
  border-radius: 20px;
  box-shadow: 0 25px 70px rgba(45, 27, 57, 0.25);
  width: 90%;
  max-width: 480px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, 
    rgba(58, 157, 202, 0.8) 0%, 
    rgba(32, 116, 162, 0.85) 100%);
  backdrop-filter: blur(10px);
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
    #22c55e 20%,
    #84cc16 30%,
    #eab308 40%,
    #f59e0b 50%,
    #f97316 60%,
    #ea580c 70%,
    #dc2626 80%,
    #b91c1c 90%,
    #991b1b 100%);
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
  border: 3px solid #3A9DCA;
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
  color: white;
  min-width: 80px;
  text-align: center;
  padding: 0.5rem 1rem;
  border-radius: 16px;
  background: rgba(45, 27, 57, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-value.score-low {
  border: 3px solid #10b981;
}

.score-value.score-medium {
  border: 3px solid #f59e0b;
}

.score-value.score-high {
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
  border-color: #3A9DCA;
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
  background: linear-gradient(135deg, #3975A3 0%, #0D4D83 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 157, 202, 0.4);
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
  background: linear-gradient(135deg, #A6E5F4 0%, #EFEEF0 100%);
  border-radius: 12px;
  border: 1px solid rgba(146, 171, 252, 0.3);
  margin-bottom: 1.5rem;
  color: #034682;
  font-weight: 600;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #EFEEF0;
  border-top-color: #2074A2;
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
  padding: 2.5rem 1rem 1rem 1rem; /* Normal padding with space for view indicator */
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  touch-action: none; /* Enable better gesture handling */
  max-width: 500px; /* Limit container width */
  border: 3px solid rgba(58, 157, 202, 0.7);
  box-shadow: 0 4px 15px rgba(58, 157, 202, 0.15), 0 0 0 1px rgba(58, 157, 202, 0.08);
  max-height: 600px; /* Limit container height */
}

.view-indicator {
  position: absolute;
  top: 0.75rem; /* Slightly closer to top */
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #6B84CD 0%, #3975A3 100%);
  color: white;
  padding: 0.4rem 1rem; /* Slightly smaller padding */
  border-radius: 16px; /* Smaller border radius */
  font-weight: 600;
  font-size: 0.8rem; /* Smaller font */
  box-shadow: 0 2px 8px rgba(58, 157, 202, 0.3);
  z-index: 10;
}

/* Zoom Controls in Sidebar */
.zoom-controls {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.zoom-controls h4 {
  margin: 0 0 0.75rem 0;
  color: #2d3748;
  font-size: 0.9rem;
}

.zoom-buttons {
  display: flex;
  align-items: center;
  gap: 0.4rem; /* Slightly smaller gap */
  flex-wrap: nowrap; /* Keep all buttons on same line */
  justify-content: flex-start;
}

.zoom-btn {
  width: 32px; /* Slightly smaller for sidebar */
  height: 32px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #3A9DCA;
  font-size: 1.25rem; /* Smaller font */
  font-weight: 700;
  border-radius: 6px; /* Smaller radius */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.zoom-btn:hover {
  background: #A6E5F4;
  border-color: #2074A2;
  transform: translateY(-1px);
}

.zoom-btn:active {
  transform: translateY(0);
}

.zoom-btn.reset {
  font-size: 1.1rem; /* Slightly smaller to fit better */
}

.zoom-level {
  min-width: 40px; /* Even smaller to fit better */
  text-align: center;
  font-weight: 600;
  color: #64748b;
  font-size: 0.75rem; /* Smaller font for sidebar */
  padding: 0 0.2rem; /* Smaller padding */
  white-space: nowrap; /* Prevent wrapping */
}

.body-svg {
  max-width: 350px; /* Much smaller than 100% */
  height: auto;
  cursor: default;
  width: 100%; /* Fill container up to max-width */
}

@media (max-width: 768px) {
  .body-map-canvas {
    flex-direction: column;
    max-width: 100%;
    padding: 0 1rem;
  }

  .controls {
    flex: 1;
  }
  
  .body-view-container {
    max-width: 100%;
    max-height: 500px;
    padding: 2rem 0.5rem 0.5rem 0.5rem; /* Normal mobile padding */
  }
  
  .zoom-buttons {
    gap: 0.3rem; /* Even smaller gap on mobile */
  }
  
  .zoom-btn {
    width: 28px; /* Smaller buttons on mobile */
    height: 28px;
    font-size: 1.1rem;
  }
  
  .zoom-level {
    min-width: 35px;
    font-size: 0.7rem;
  }
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.dialog-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  animation: dialog-slide-up 0.3s ease;
}

@keyframes dialog-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.dialog-body {
  padding: 1.5rem;
}

.region-name {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
}

.score-input-section {
  margin-bottom: 1.5rem;
}

.score-input-section.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.score-input-section label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
  text-align: center;
}

.score-slider-container {
  margin-bottom: 1rem;
}

.score-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, 
    #10b981 0%,
    #22c55e 20%,
    #84cc16 30%,
    #eab308 40%,
    #f59e0b 50%,
    #f97316 60%,
    #ea580c 70%,
    #dc2626 80%,
    #b91c1c 90%,
    #991b1b 100%);
  margin-bottom: 0.5rem;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #3A9DCA;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.score-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.score-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid #3A9DCA;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.score-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.score-display {
  text-align: center;
  margin-bottom: 1rem;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.score-value.score-low {
  background: linear-gradient(135deg, #10b981, #059669);
}

.score-value.score-medium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.score-value.score-high {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.score-description {
  font-weight: 600;
  color: #4a5568;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.score-number-input {
  width: 60px;
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
}

.score-number-input:focus {
  outline: none;
  border-color: #3A9DCA;
  box-shadow: 0 0 0 3px rgba(58, 157, 202, 0.1);
}

.input-label {
  font-size: 0.9rem;
  color: #64748b;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #dc2626;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3A9DCA;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.spacer {
  flex: 1;
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f8fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn {
  background: linear-gradient(135deg, #3975A3, #0D4D83);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
}

/* Hover Tooltip Styles */
.region-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: opacity 0.2s ease;
}

/* Zoom Controls */
.zoom-controls {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(144, 91, 247, 0.6);
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(144, 91, 247, 0.15), 0 0 0 1px rgba(144, 91, 247, 0.08);
}

.zoom-controls h4 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
  font-size: 0.85rem;
}

.zoom-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #3A9DCA;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover {
  background: #2074A2;
  transform: translateY(-1px);
}

.zoom-btn.reset {
  background: #6b7280;
}

.zoom-btn.reset:hover {
  background: #4b5563;
}

.zoom-level {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
  text-align: center;
}
</style>

