<template>
  <div class="body-map-view" ref="bodyMapComponent">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your current body map...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h3>⚠️ Unable to Load Map</h3>
      <p>{{ error }}</p>
      <div v-if="corsError" class="cors-solution">
        <h4>🛠️ CORS Issue Detected</h4>
        <p><strong>Problem:</strong> Browser blocks frontend (localhost:3000) from accessing backend (localhost:8000)</p>
        <p><strong>Solution:</strong> Backend needs CORS headers to allow cross-origin requests</p>
        <div class="cors-headers">
          <strong>Required Headers:</strong>
          <pre>Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type</pre>
        </div>
      </div>
      <button @click="loadCurrentMap" class="primary">Retry</button>
      <button @click="useMockMode" class="secondary">Use Sample Data</button>
    </div>
    
    <div v-else>
      <div class="map-header">
        <div class="header-content">
          <h2>{{ getMapTitle() }}</h2>
        </div>
        <div v-if="currentMap" class="map-info">
          <span v-if="getMapStatusText()" class="map-status" :class="getMapStatusClass()">
            {{ getMapStatusText() }}
          </span>
          <div v-if="isViewingHistoricalMap" class="historical-header-controls">
            <div class="date-badge">
              {{ formatDateWithOrdinal(currentMap.creationDate) }}
            </div>
            <button @click="returnToCurrentMap" class="return-btn">
              🔄 Return to Today's Map
            </button>
          </div>
        </div>
        <p v-else class="description">
          Explore the interactive body map below. Track your pain by selecting body regions and rating their intensity.
        </p>
      </div>
      
      <!-- Main Content: Body Map + Summary Side by Side -->
      <div class="main-content">
        <div class="body-map-section">
    <BodyMapCanvas 
            :key="currentMap?._id || 'default'"
            :initial-selections="mapSelections"
            :saved-regions="currentMap?.regions || []"
      :user-id="userId"
            :map-id="currentMap?._id"
      @selection-change="handleSelectionChange"
    />
        </div>
        
        <div class="summary-section">
          <div class="card summary-card" :class="{ 'has-content': generatedSummary }">
            <!-- Generate Form (shown when no summary) -->
            <div v-if="!generatedSummary" class="summary-generate-form">
              <h3>📈 Generate Pain Summary Report</h3>
              <p class="summary-description">Generate a comprehensive summary of your pain patterns over any date range</p>
              
              <div class="date-range-section">
                <div class="date-inputs">
                  <div class="input-group">
                    <label for="fromDate">From Date:</label>
                    <input 
                      id="fromDate"
                      type="date" 
                      v-model="summaryFromDate" 
                      class="date-input"
                      :max="todayDate"
                    />
                  </div>
                  <div class="input-group">
                    <label for="toDate">To Date:</label>
                    <input 
                      id="toDate"
                      type="date" 
                      v-model="summaryToDate" 
                      class="date-input"
                      :max="todayDate"
                    />
                  </div>
                </div>
                
                <div class="summary-actions">
                  <button 
                    @click="generateSummary" 
                    class="primary summary-btn"
                    :disabled="!summaryFromDate || !summaryToDate"
                  >
                    📈 Generate Summary
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Generated Summary Display (shown when summary exists) -->
            <div v-else class="summary-display">
              <div class="summary-header">
                <h4>📊 Pain Summary Report</h4>
                <button @click="closeSummary" class="close-summary-btn" title="Close Summary">×</button>
              </div>
              <div class="summary-content" ref="summaryContent">
                <div class="summary-text">
                  {{ generatedSummary }}
                </div>
                <div class="summary-footer">
                  <p class="report-date">Generated on {{ new Date().toLocaleDateString() }}</p>
                  <button @click="exportToPDF" class="secondary pdf-btn">
                    📋 Export as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'
import api from '@/services/api'

export default {
  name: 'BodyMap',
  components: {
    BodyMapCanvas
  },
  props: {
    historicalMapToLoad: {
      type: Object,
      default: null
    }
  },
  watch: {
    historicalMapToLoad(newMap) {
      if (newMap && newMap._id) {
        console.log('🔄 BodyMapDemo: Prop watcher triggered for map:', newMap._id)
        this.loadHistoricalMapFromProp(newMap)
      }
    }
  },
  data() {
    return {
      currentMap: null,
      mapSelections: [],
      currentSelections: [],
      loading: false,
      error: null,
      corsError: false,
      mockMode: true,
      currentMapIndex: 0,
      userId: 'user123',
      // Mock saved maps with varied regions - including empty days
      mockSavedMaps: [],
      // Historical map viewing state
      isViewingHistoricalMap: false,
      // Store current map selections when viewing historical maps
      savedCurrentSelections: [],
      savedCurrentMapSelections: [],
      todaysMap: null, // Store reference to today's map
      // Summary generation data
      summaryFromDate: '',
      summaryToDate: '',
      generatedSummary: ''
    }
  },
  computed: {
    todayDate() {
      return new Date().toISOString().split('T')[0]
    }
  },
  async mounted() {
    if (this.mockMode) {
      this.mockSavedMaps = this.generateMockMaps()
      this.loadMockCurrentMap()
      // Emit maps to parent for hamburger menu
      this.$emit('maps-loaded', this.mockSavedMaps)
    } else {
      await this.loadCurrentMap()
    }
  },
  methods: {
    async loadCurrentMap() {
      try {
        this.loading = true
        this.error = null
        const response = await api.getCurrentMap(this.userId)
        
        // Handle actual backend response format
        if (response.data && response.data.map) {
          this.currentMap = response.data.map
          this.mapSelections = [] // Will be loaded by BodyMapCanvas component
        } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          this.currentMap = response.data[0].map
          this.mapSelections = []
        } else {
          this.currentMap = null
          this.mapSelections = []
        }
      } catch (err) {
        console.error('Error loading current map:', err)
        if (err.message?.includes('CORS') || err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
          this.corsError = true
          this.error = '🚫 CORS Error: Cannot connect to backend server. The backend needs to allow requests from localhost:3000.'
        } else if (err.response?.status === 404) {
          this.error = 'No current map available. Your daily map will be automatically generated at midnight.'
        } else {
          this.error = err.response?.data?.error || 'Failed to load current map. Please check your connection.'
        }
      } finally {
        this.loading = false
      }
    },
    
    handleSelectionChange(newSelections, regionsWithScores) {
      console.log('🔄 BodyMapDemo: Selection changed to:', newSelections)
      console.log('🔄 BodyMapDemo: Regions with scores:', regionsWithScores)
      this.currentSelections = [...newSelections]

      // If we're viewing the current map (not historical), update the saved current selections
      if (!this.isViewingHistoricalMap) {
        console.log('💾 BodyMapDemo: Updating current map selections')
        this.mapSelections = [...newSelections]

        // Update today's map object to persist the changes, including scores
        if (this.todaysMap) {
          console.log('💾 BodyMapDemo: Current todaysMap.regions before update:', this.todaysMap.regions)
          console.log('💾 BodyMapDemo: Incoming regionsWithScores:', regionsWithScores)
          
          const updatedRegions = []
          newSelections.forEach(regionName => {
            const regionWithScore = regionsWithScores.find(r => r.name === regionName)
            const existingRegion = this.todaysMap.regions?.find(r => r.name === regionName)

            if (regionWithScore && regionWithScore.score !== null && regionWithScore.score !== undefined) {
              console.log('💾 BodyMapDemo: Using new score for', regionName, ':', regionWithScore.score)
              updatedRegions.push({ name: regionName, score: regionWithScore.score })
            } else if (existingRegion && existingRegion.score !== null && existingRegion.score !== undefined) {
              console.log('💾 BodyMapDemo: Preserving existing score for', regionName, ':', existingRegion.score)
              updatedRegions.push({ name: regionName, score: existingRegion.score })
            } else {
              console.log('💾 BodyMapDemo: No score yet for', regionName, '- keeping null')
              updatedRegions.push({ name: regionName, score: null }) // Keep null until user scores
            }
          })
          this.todaysMap.regions = updatedRegions
          console.log('💾 BodyMapDemo: Final today\'s map regions:', this.todaysMap.regions)
        }
      }

      // If we're on the current map (not viewing historical), save these selections  
      if (!this.isViewingHistoricalMap && this.todaysMap && this.currentMap?._id === this.todaysMap._id) {
        this.savedCurrentSelections = [...newSelections]
        this.savedCurrentMapSelections = [...newSelections]
        console.log('💾 BodyMapDemo: Auto-saved current selections:', this.savedCurrentSelections)
      }
    },
    
    clearSelections() {
      this.currentSelections = []
      this.mapSelections = []
    },
    
    
    formatRegionName(regionId) {
      return regionId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    
    loadMockCurrentMap() {
      // Only initialize today's map if it doesn't already exist with user data
      if (!this.todaysMap) {
        console.log('📅 BodyMapDemo: Initializing new today\'s map')
        this.todaysMap = {
          ...this.mockSavedMaps[0],
          regions: [] // Start with empty regions, let user add them
        }
      } else {
        console.log('📅 BodyMapDemo: Today\'s map already exists, preserving user data:', this.todaysMap)
      }
      
      this.currentMap = this.todaysMap
      this.mapSelections = this.currentMap.regions ? this.currentMap.regions.map(r => r.name) : []
      this.currentSelections = [...this.mapSelections]
      this.isViewingHistoricalMap = false
      this.loading = false
      
      // Ensure today's map is properly initialized as an object we can modify
      if (!this.todaysMap.regions) {
        this.todaysMap.regions = []
      }
      
      console.log('Loaded mock current map with regions:', this.mapSelections)
      console.log('📅 Today\'s map object:', this.todaysMap)
      console.log('📅 Today\'s map regions with scores:')
      if (this.todaysMap.regions) {
        this.todaysMap.regions.forEach((region, index) => {
          console.log(`  [${index}]: ${region.name} = ${region.score}`)
        })
      }
    },
    
    loadHistoricalMapFromProp(map) {
      console.log('🔄 BodyMapDemo: Loading historical map:', map._id, 'with', map.regions?.length || 0, 'regions')
      
      // Save current selections if we're not already viewing a historical map
      if (!this.isViewingHistoricalMap && this.todaysMap) {
        console.log('💾 BodyMapDemo: Saving current selections before loading historical map')
        // Make sure today's map is up to date with current selections
        if (this.currentSelections.length > 0) {
          // Preserve existing scores, don't overwrite with default values
          this.todaysMap.regions = this.currentSelections.map(regionName => {
            // Find existing region to preserve its score
            const existingRegion = this.todaysMap.regions?.find(r => r.name === regionName)
            return {
              name: regionName,
              score: existingRegion?.score || null // Preserve existing score or null if none
            }
          })
        }
        this.savedCurrentSelections = [...this.currentSelections]
        this.savedCurrentMapSelections = [...this.mapSelections]
        console.log('💾 BodyMapDemo: Saved selections:', this.savedCurrentSelections)
      }
      
      // Clear current state first
      this.currentMap = null
      this.mapSelections = []
      this.currentSelections = []
      
      // Wait for the component to reset, then load new map
      this.$nextTick(() => {
        console.log('⚡ BodyMapDemo: Setting historical map data')
        this.currentMap = map
        this.mapSelections = map.regions ? map.regions.map(r => r.name) : []
        this.currentSelections = [...this.mapSelections]
        
        // Mark as viewing historical map
        this.isViewingHistoricalMap = true
        
        // Find the index for navigation
        this.currentMapIndex = this.mockSavedMaps.findIndex(m => m._id === map._id)
        
        console.log('✅ BodyMapDemo: Historical map loaded successfully with', this.mapSelections.length, 'regions')
        
        // Notify parent component that map was loaded
        this.$emit('map-loaded')
        
        console.log('Map loaded with regions:', this.mapSelections)
        
        // Force another update to ensure BodyMapCanvas sees the changes
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      })
    },
    
    returnToCurrentMap() {
      console.log('🔙 BodyMapDemo: Returning to current map')
      console.log('🔙 BodyMapDemo: Today\'s map:', this.todaysMap)
      
      if (this.todaysMap) {
        this.currentMap = this.todaysMap
        
        // Use the current state of today's map (which should have been updated by handleSelectionChange)
        this.mapSelections = this.todaysMap.regions ? this.todaysMap.regions.map(r => r.name) : []
        this.currentSelections = [...this.mapSelections]
        
        console.log('🔙 BodyMapDemo: Restored current map with selections:', this.currentSelections)
        console.log('🔙 BodyMapDemo: Today\'s map regions with scores:', this.todaysMap.regions)
        
        // Debug what will be passed to BodyMapCanvas
        console.log('🔙 BodyMapDemo: currentMap._id:', this.currentMap._id)
        console.log('🔙 BodyMapDemo: mapSelections (initialSelections prop):', this.mapSelections)
        console.log('🔙 BodyMapDemo: currentMap.regions (savedRegions prop):', this.currentMap.regions)
        
        if (this.currentMap.regions) {
          this.currentMap.regions.forEach((region, index) => {
            console.log(`🔙 BodyMapDemo: Region ${index} for BodyMapCanvas:`, {
              name: region.name,
              score: region.score,
              fullRegion: region
            })
          })
        }
        
        this.isViewingHistoricalMap = false
        
        // Clear saved selections since we're back to current
        this.savedCurrentSelections = []
        this.savedCurrentMapSelections = []
        
        // Force update
        this.$nextTick(() => {
          console.log('🔙 BodyMapDemo: After $nextTick - about to force update')
          this.$forceUpdate()
        })
      } else {
        console.error('❌ BodyMapDemo: todaysMap is null/undefined, cannot return to current map')
      }
    },
    
    getMapTitle() {
      if (!this.currentMap) {
        return 'Interactive Body Map'
      }
      
      if (this.isViewingHistoricalMap) {
        return 'Archived Maps'
      }
      
      return 'Current Body Map'
    },
    
    getMapStatusClass() {
      if (!this.currentMap) return ''
      
      if (this.isViewingHistoricalMap) {
        return 'archived'
      }
      
      return this.currentMap.isSaved ? 'saved' : 'current'
    },
    
    getMapStatusText() {
      if (!this.currentMap) return ''
      
      if (this.isViewingHistoricalMap) {
        return '' // Don't show archived text, just the date badge
      }
      
      return this.currentMap.isSaved ? '💾 Saved' : '🔄 Current'
    },
    
    formatDateWithOrdinal(dateString) {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      const year = date.getFullYear()
      
      // Add ordinal suffix
      const ordinalSuffix = (day) => {
        if (day > 3 && day < 21) return 'th'
        switch (day % 10) {
          case 1: return 'st'
          case 2: return 'nd' 
          case 3: return 'rd'
          default: return 'th'
        }
      }
      
      return `${day}${ordinalSuffix(day)} ${month}, ${year}`
    },
    
    useMockMode() {
      this.mockMode = true
      this.loading = false
      this.error = null
      this.corsError = false
      this.loadMockCurrentMap()
      console.log('Switched to mock mode - using sample data')
    },
    
    generateMockMaps() {
      const maps = []
      const today = new Date()
      
      // Generate maps for the past 30 days with varied patterns
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        
        const regions = this.getRandomRegions(i)
        
        maps.push({
          _id: `map-${date.toISOString().split('T')[0]}`,
          ownerId: 'user123',
          creationDate: date.toISOString(),
          imageUrl: 'default_map_image.png',
          isSaved: i > 0,
          regions: i === 0 ? 
            // Today's map - start with no scores, let user score manually
            regions.map(name => ({ name, score: null })) :
            // Historical maps - use random scores for demo
            regions.map(name => ({ name, score: Math.floor(Math.random() * 8) + 3 }))
        })
      }
      
      return maps
    },
    
    getRandomRegions(dayIndex) {
      // Only use regions that actually exist in the body map components
      const allRegions = [
        // Front view regions
        'head', 'neck', 'chest', 'abdomen',
        'left-shoulder', 'right-shoulder',
        'left-upper-arm', 'right-upper-arm',
        'left-forearm', 'right-forearm', 
        'left-hand', 'right-hand',
        'left-hip', 'right-hip',
        'left-upper-leg', 'right-upper-leg',
        'left-lower-leg', 'right-lower-leg',
        'left-foot', 'right-foot',
        // Back view regions
        'upper-back', 'lower-back'
      ]
      
      // Create patterns - some days empty, some with pain
      if (dayIndex % 7 === 0 || dayIndex % 11 === 0) {
        return [] // Empty days (good days!)
      }
      
      // Different pain patterns based on day - using only real regions
      const patterns = [
        ['head', 'neck'], // Headache pattern
        ['lower-back', 'right-hip'], // Lower back issues
        ['left-shoulder', 'neck', 'upper-back'], // Shoulder/neck tension
        ['left-lower-leg', 'right-foot'], // Leg/foot pain
        ['chest', 'upper-back'], // Chest/back pain
        ['abdomen'], // Stomach issues
        ['left-forearm', 'right-upper-arm'], // Arm strain
        ['head', 'left-shoulder', 'upper-back'], // Stress pattern
        ['lower-back', 'left-hip', 'right-upper-leg'], // Exercise strain
        ['neck', 'right-shoulder'], // Work-related pain
        ['left-hand', 'right-hand'], // Hand pain
        ['left-upper-leg', 'right-lower-leg'], // Leg muscle pain
        ['chest', 'left-shoulder', 'right-shoulder'], // Upper body tension
        ['lower-back', 'left-upper-leg', 'right-hip'], // Lower body strain
        ['head', 'neck', 'left-shoulder'] // Tension headache
      ]
      
      return patterns[dayIndex % patterns.length] || []
    },
    
    handleSelectionChange(newSelections, regionsWithScores) {
      console.log('🔄 BodyMapDemo: Selection changed to:', newSelections)
      console.log('🔄 BodyMapDemo: Regions with scores:', regionsWithScores)
      
      this.currentSelections = [...newSelections]
      
      // If we're viewing the current map (not historical), update the saved current selections
      if (!this.isViewingHistoricalMap) {
        console.log('💾 BodyMapDemo: Updating current map selections')
        this.mapSelections = [...newSelections]
        
        // Update today's map object to persist the changes with actual scores
        if (this.todaysMap && regionsWithScores) {
          // Merge existing regions with new score updates
          const updatedRegions = []
          
          // For each selection, preserve existing score if available, or use new score
          newSelections.forEach(regionName => {
            const regionWithScore = regionsWithScores.find(r => r.name === regionName)
            const existingRegion = this.todaysMap.regions?.find(r => r.name === regionName)
            
            if (regionWithScore && regionWithScore.score !== null) {
              // Use the new score from BodyMapCanvas
              updatedRegions.push({
                name: regionName,
                score: regionWithScore.score
              })
              console.log('💾 BodyMapDemo: Using new score for', regionName, ':', regionWithScore.score)
            } else if (existingRegion && existingRegion.score !== null) {
              // Preserve existing score
              updatedRegions.push({
                name: regionName,
                score: existingRegion.score
              })
              console.log('💾 BodyMapDemo: Preserving existing score for', regionName, ':', existingRegion.score)
            } else {
              // No score yet
              updatedRegions.push({
                name: regionName,
                score: null
              })
              console.log('💾 BodyMapDemo: No score yet for', regionName)
            }
          })
          
          this.todaysMap.regions = updatedRegions
          console.log('💾 BodyMapDemo: Final today\'s map regions:', this.todaysMap.regions)
        } else if (this.todaysMap) {
          // Fallback: create regions without scores for new selections
          this.todaysMap.regions = newSelections.map(regionName => ({
            name: regionName,
            score: null // No score yet - will be set when user scores it
          }))
          console.log('💾 BodyMapDemo: Updated today\'s map with unscored selections')
        }
      }
    },
    
    generateSummary() {
      if (!this.summaryFromDate || !this.summaryToDate) {
        return
      }
      
      const fromDate = new Date(this.summaryFromDate)
      const toDate = new Date(this.summaryToDate)
      
      // Validate date range
      if (fromDate > toDate) {
        alert('From date cannot be after To date')
        return
      }
      
      // Format dates for display
      const fromFormatted = fromDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      const toFormatted = toDate.toLocaleDateString('en-US', {
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })
      
      // Mock data for now - this would eventually analyze actual saved maps
      const mockRegions = [
        { name: 'left shoulder', count: 5, medianScore: 5 },
        { name: 'lower back', count: 3, medianScore: 7 },
        { name: 'neck', count: 2, medianScore: 4 }
      ]
      
      // Generate summary text
      let summaryParts = []
      
      if (mockRegions.length === 0) {
        this.generatedSummary = `In the date range ${fromFormatted} to ${toFormatted}, you experienced no recorded pain. Great job! 🎉`
      } else {
        summaryParts.push(`In the date range ${fromFormatted} to ${toFormatted}:`)
        summaryParts.push('')
        
        mockRegions.forEach(region => {
          const regionText = `• ${region.name} pain ${region.count} time${region.count > 1 ? 's' : ''} with a median pain score of ${region.medianScore}/10`
          summaryParts.push(regionText)
        })
        
        const totalDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
        const totalPainDays = Math.min(mockRegions.reduce((sum, r) => sum + r.count, 0), totalDays)
        const painFreeDays = totalDays - totalPainDays
        
        summaryParts.push('')
        summaryParts.push(`📊 Overall: ${totalPainDays} days with pain, ${painFreeDays} pain-free days out of ${totalDays} total days.`)
        
        this.generatedSummary = summaryParts.join('\n')
      }
      
      console.log('Generated summary:', this.generatedSummary)
    },
    
    async exportToPDF() {
      if (!this.generatedSummary) {
        alert('Please generate a summary first')
        return
      }
      
      try {
        // Create a simple text-based PDF content
        const fromDate = new Date(this.summaryFromDate).toLocaleDateString()
        const toDate = new Date(this.summaryToDate).toLocaleDateString()
        const reportDate = new Date().toLocaleDateString()
        
        // Create a data URL for PDF download (simple text-based approach)
        const pdfContent = `
PAINPAL SUMMARY REPORT

Generated on: ${reportDate}
Report Period: ${fromDate} to ${toDate}

${this.generatedSummary.replace(/•/g, '- ')}

---
Generated by PainPal
www.painpal.com`
        
        // Create a blob and download link
        const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        
      const link = document.createElement('a')
      link.href = url
        link.download = `PainPal_Summary_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.txt`
        document.body.appendChild(link)
      link.click()
        document.body.removeChild(link)
        
      URL.revokeObjectURL(url)
        
        // Show success message
        alert('🎉 Summary exported successfully! Check your Downloads folder.')
      } catch (error) {
        console.error('Error exporting summary:', error)
        alert('Sorry, there was an error exporting the summary. Please try again.')
      }
    },
    
    closeSummary() {
      this.generatedSummary = ''
      // Reset date inputs
      this.summaryFromDate = ''
      this.summaryToDate = ''
    }
  }
}
</script>

<style scoped>
.body-map-view {
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  box-sizing: border-box;
  overflow: hidden; /* Prevent scrolling */
}

/* Horizontal Layout */
.main-content {
  display: flex;
  flex: 1; /* Take remaining space after header */
  gap: 1rem;
  min-height: 0; /* Allow flex items to shrink */
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 1rem;
  margin: 0.5rem 0;
  box-shadow: 0 4px 20px rgba(45, 27, 57, 0.08);
  border: 1px solid rgba(146, 171, 252, 0.25);
}

.body-map-section {
  flex: 1; /* Take up left side */
  min-width: 0; /* Allow shrinking */
}

.summary-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  min-width: 280px; /* Back to original minimum width */
  max-width: 350px; /* Back to original maximum width */
}

/* Loading and Error States */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #e53e3e;
}

/* Compact Map Header */
.map-header {
  text-align: center;
  margin-bottom: 1rem; /* Reduced for compact layout */
  flex-shrink: 0; /* Don't shrink header */
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem; /* Reduced gap */
  margin-bottom: 0.5rem; /* Reduced margin */
}

.map-header h2 {
  color: #2d3748;
  margin: 0;
  font-size: 1.5rem; /* Smaller font size */
}

.historical-header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.return-btn {
  background: linear-gradient(135deg, 
    rgba(58, 157, 202, 0.7), 
    rgba(32, 116, 162, 0.8));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  height: auto;
  min-width: auto;
}

.return-btn:hover {
  background: linear-gradient(135deg, 
    rgba(18, 86, 134, 0.8), 
    rgba(3, 70, 130, 0.85));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(58, 157, 202, 0.4);
}

.map-info {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.map-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.map-status.current {
  background-color: #bee3f8;
  color: #2c5282;
}

.map-status.saved {
  background-color: #c6f6d5;
  color: #22543d;
}

.map-status.archived {
  background-color: #fbb6ce;
  color: #97266d;
}

.date-badge {
  background: linear-gradient(135deg, 
    rgba(107, 132, 205, 0.6), 
    rgba(57, 117, 163, 0.7));
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  margin-top: 0;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  align-items: center;
  white-space: nowrap;
}

.description {
  color: #718096;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}


.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  padding: 1.5rem; /* Reduced padding for compact design */
}

.card h3 {
  margin: 0 0 1rem 0; /* Reduced margin */
  color: #2d3748;
  font-size: 1.25rem; /* Slightly smaller */
}

/* Summary Card Specific Styles */
.summary-card {
  height: 100%; /* Fill available height */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Allow scrolling within summary if needed */
}


.no-selections {
  color: #a0aec0;
  font-style: italic;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  text-align: center;
}

.map-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.map-actions button {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.secondary {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.secondary:hover {
  background: #f7fafc;
  border-color: #cbd5e1;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Navigation Info */
.navigation-info {
  margin-top: 2rem;
}

.info-box {
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  border: 2px solid #68d391;
  border-radius: 12px;
  padding: 1.5rem;
}

.info-box h4 {
  color: #22543d;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.info-box p {
  color: #2f855a;
  margin: 0.5rem 0;
  line-height: 1.5;
}

/* Summary Section Styles */
.summary-card {
  margin-top: 0.25rem;
  border: 3px solid rgba(144, 91, 247, 0.7);
  background: linear-gradient(135deg, 
    rgba(166, 229, 244, 0.15) 0%, 
    rgba(239, 238, 240, 0.2) 50%, 
    rgba(255, 255, 255, 0.1) 100%);
  padding: 0.5rem; /* Smaller container padding */
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 25px rgba(144, 91, 247, 0.2), 0 0 0 1px rgba(144, 91, 247, 0.15);
}

.summary-card.has-content {
  border-color: rgba(117, 21, 196, 0.8);
  background: linear-gradient(135deg, 
    rgba(239, 238, 240, 0.2) 0%, 
    rgba(166, 229, 244, 0.15) 50%, 
    rgba(255, 255, 255, 0.08) 100%);
  padding: 0.75rem; /* Larger padding when content is shown */
  box-shadow: 0 6px 30px rgba(117, 21, 196, 0.25), 0 0 0 1px rgba(117, 21, 196, 0.2);
}

.summary-card h3 {
  color: #034682;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

/* Generate Form Styles */
.summary-generate-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Remove bottom padding from card when showing generate form */
.summary-card:not(.has-content) {
  padding-bottom: 0.25rem; /* Minimal bottom padding instead of 0.5rem */
}

.summary-description {
  color: #64748b;
  margin-bottom: 0.75rem;
  font-style: italic;
  font-size: 0.85rem;
}

.date-range-section {
  margin-bottom: 0;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}

.date-input {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s;
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-btn, .pdf-btn {
  width: 100%;
  min-width: unset;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, 
    rgba(57, 117, 163, 0.7), 
    rgba(13, 77, 131, 0.8));
  border: 1px solid rgba(18, 86, 134, 0.3);
  backdrop-filter: blur(5px);
  color: white;
}

.summary-display {
  margin-top: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.summary-display .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem; /* Smaller margin */
  padding-bottom: 0.4rem; /* Smaller padding */
  border-bottom: 2px solid #e2e8f0;
}

.summary-display h4 {
  color: #10b981;
  margin: 0;
  font-size: 0.9rem; /* Smaller font */
}

.close-summary-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.close-summary-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.summary-text {
  color: #374151;
  line-height: 1.5;
  white-space: pre-line;
  font-size: 0.85rem;
}

.summary-header {
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem; /* Reduced padding */
  margin-bottom: 0.5rem; /* Reduced margin */
}

.summary-header h5 {
  color: #1e293b;
  margin: 0;
  font-size: 1rem; /* Smaller font */
  font-weight: 700;
}

.report-date {
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem; /* Smaller font */
  font-style: italic;
}

.summary-text {
  color: #374151;
  line-height: 1.5; /* Tighter line height */
  white-space: pre-line;
  font-size: 0.85rem; /* Smaller font */
}

/* CORS Error Styling */
.cors-solution {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
}

.cors-solution h4 {
  color: #92400e;
  margin: 0 0 1rem 0;
}

.cors-solution p {
  color: #78350f;
  margin: 0.5rem 0;
  line-height: 1.5;
}

.cors-solution strong {
  color: #451a03;
}

.cors-headers {
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #d97706;
}

.cors-headers pre {
  color: #451a03;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .body-map-view {
    padding: 0.25rem;
    height: 100vh; /* Maintain full height */
  }
  
  .main-content {
    flex-direction: column; /* Stack vertically on mobile */
    gap: 0.5rem;
  }
  
  .summary-section {
    flex: 0 0 auto; /* Don't grow on mobile */
    max-height: 40vh; /* Limit height on mobile */
  }
  
  .body-map-section {
    flex: 1;
    min-height: 0;
  }
  
  .map-header h2 {
    font-size: 1.25rem; /* Even smaller on mobile */
  }
  
  .header-content {
    gap: 0.5rem;
  }
  
  .historical-header-controls {
    gap: 0.5rem;
    flex-direction: column;
  }
}
</style>

