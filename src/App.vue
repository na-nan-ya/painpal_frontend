<template>
  <div id="app">
    <header>
      <nav class="navbar">
        <!-- Hamburger Menu Button -->
        <button 
          class="hamburger-btn" 
          @click="toggleMenu"
          :class="{ 'active': isMenuOpen }"
          aria-label="Toggle navigation menu"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <!-- Brand Title -->
        <div class="nav-brand">
          <h1>PainPal</h1>
        </div>
      </nav>
    </header>

    <!-- Menu Overlay -->
    <div 
      v-if="isMenuOpen" 
      class="menu-overlay" 
      @click="closeMenu"
    ></div>

    <!-- Collapsible Menu -->
    <div class="nav-menu" :class="{ 'active': isMenuOpen }">
      <div class="menu-header">
        <h3>📅 Pain History</h3>
        <button class="close-menu-btn" @click="closeMenu">×</button>
      </div>
      
      <div class="calendar-container">
        <div class="calendar-header">
          <button @click="previousMonth" class="nav-btn">‹</button>
          <span class="month-year">{{ currentMonthYear }}</span>
          <button @click="nextMonth" class="nav-btn">›</button>
        </div>
        
        <!-- Date Search Section -->
        <div class="date-search-section">
          <div class="search-input-group">
            <input 
              type="date" 
              v-model="searchDate" 
              @change="searchForDate"
              @keyup.enter="searchForDate"
              class="date-search"
              :max="todayDate"
              placeholder="Search by date..."
            />
            <button @click="goToToday" class="today-btn">Today</button>
          </div>
          <p class="search-hint">📅 Jump to any date to view your pain map</p>
          <!-- Search Status Message -->
          <div v-if="searchMessage" class="search-message" :class="{ 'error': searchMessage.includes('⚠️') }">
            {{ searchMessage }}
          </div>
        </div>
        
        <div class="calendar-grid">
          <div class="day-header" v-for="day in dayHeaders" :key="day">{{ day }}</div>
          
            <div 
              v-for="date in calendarDates" 
              :key="date.key"
              class="calendar-date"
              :class="{
                'other-month': !date.currentMonth,
                'today': date.isToday,
                'has-data': date.hasData,
                'no-data': date.currentMonth && !date.hasData && date.isPast,
                'future': !date.isPast,
                'selected': date.isSelected
              }"
              @click="selectDate(date)"
            >
              <span class="date-number">{{ date.day }}</span>
              <div v-if="date.hasData" class="pain-indicator">
                <span class="region-count">{{ date.regionCount }}</span>
              </div>
            </div>
        </div>
      </div>
      
      <div v-if="selectedMapInfo" class="selected-map-info">
        <h4>{{ formatSelectedDate(selectedMapInfo.creationDate) }}</h4>
        <p v-if="selectedMapInfo.regions && selectedMapInfo.regions.length > 0">
          <strong>{{ selectedMapInfo.regions.length }}</strong> pain regions recorded
        </p>
        <p v-else class="pain-free">🎉 Pain-free day!</p>
        <div class="region-list" v-if="selectedMapInfo.regions && selectedMapInfo.regions.length > 0">
          <span v-for="region in selectedMapInfo.regions" 
                :key="region.name" 
                class="region-tag">
            {{ formatRegionName(region.name) }}
          </span>
        </div>
        <button @click="loadSelectedMap" class="view-map-btn">View Full Map</button>
      </div>
      
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-color has-pain"></div>
          <span>Pain recorded</span>
        </div>
        <div class="legend-item">
          <div class="legend-color pain-free"></div>
          <span>Pain-free</span>
        </div>
      </div>
      
    </div>
    
    <main class="container">
          <router-view 
            ref="routerView" 
            :historical-map-to-load="historicalMapToLoad"
            @maps-loaded="handleMapsLoaded"
            @map-loaded="handleMapLoaded"
          />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isMenuOpen: false,
      savedMaps: [],
      loading: false,
      userId: 'user123',
      mockMode: true,
      currentDate: new Date(),
      searchDate: '',
      selectedMapInfo: null,
      dayHeaders: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      historicalMapToLoad: null,
      searchMessage: ''
    }
  },
  methods: {
    async toggleMenu() {
      if (!this.isMenuOpen) {
        if (this.mockMode) {
          // Maps should already be loaded by child component
        } else {
          await this.loadSavedMaps()
        }
      }
      this.isMenuOpen = !this.isMenuOpen
    },
    
    closeMenu() {
      this.isMenuOpen = false
    },
    
    async loadSavedMaps() {
      try {
        this.loading = true
        const response = await api.getSavedMaps(this.userId)
        this.savedMaps = Array.isArray(response.data) ? response.data : (response.data?.maps || [])
      } catch (error) {
        console.error('Error loading saved maps:', error)
        this.savedMaps = []
      } finally {
        this.loading = false
      }
    },
    
    loadHistoricalMap(map) {
      console.log('🔄 App.vue: Loading historical map via prop:', map._id)
      
      // Use reactive prop to trigger child component update
      this.historicalMapToLoad = {
        ...map,
        timestamp: Date.now() // Force reactivity even if same map
      }
      
      this.closeMenu()
    },
    
    handleMapLoaded() {
      console.log('✅ App.vue: Historical map loaded successfully')
      // Reset the prop after successful load
      this.historicalMapToLoad = null
    },
    
    loadTodaysMap() {
      // Load today's map (first in the list)
      if (this.savedMaps.length > 0) {
        this.loadHistoricalMap(this.savedMaps[0])
      }
      this.closeMenu()
    },
    
    handleMapsLoaded(maps) {
      this.savedMaps = maps
      this.mockMode = true
      // Select today's map by default
      const todayMap = maps.find(map => {
        const mapDate = new Date(map.creationDate).toDateString()
        const today = new Date().toDateString()
        return mapDate === today
      })
      if (todayMap) {
        this.selectedMapInfo = todayMap
      }
    },
    
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
    },
    
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
    },
    
    loadSelectedMap() {
      console.log('📊 App.vue: loadSelectedMap called for map:', this.selectedMapInfo?._id)
      
      if (this.selectedMapInfo) {
        this.loadHistoricalMap(this.selectedMapInfo)
      } else {
        console.error('❌ App.vue: No selectedMapInfo available')
      }
    },
    
    selectDate(dateObj) {
      console.log('📅 App.vue: selectDate called for:', dateObj.date?.toDateString())
      
      if (!dateObj.currentMonth || (!dateObj.isPast && !dateObj.isToday)) return
      
      this.calendarDates.forEach(date => {
        date.isSelected = false
      })
      dateObj.isSelected = true
      
      this.selectedMapInfo = dateObj.mapData
      console.log('✅ App.vue: selectedMapInfo set to map:', this.selectedMapInfo?._id)
    },
    
    formatRegionName(regionName) {
      return regionName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    
    searchForDate() {
      if (!this.searchDate) {
        this.searchMessage = ''
        return
      }
      
      const searchDateObj = new Date(this.searchDate)
      const searchDateStr = searchDateObj.toISOString().split('T')[0]
      
      // Navigate to the month containing the search date
      this.currentDate = new Date(searchDateObj.getFullYear(), searchDateObj.getMonth(), 1)
      
      // Find map for this date
      const mapForDate = this.savedMaps.find(map => 
        map.creationDate.split('T')[0] === searchDateStr
      )
      
      if (mapForDate) {
        this.selectedMapInfo = mapForDate
        this.searchMessage = `✓ Found map for ${this.formatSelectedDate(mapForDate.creationDate)}`
        // Auto-select the date in the calendar
        this.$nextTick(() => {
          this.calendarDates.forEach(date => {
            date.isSelected = date.key === searchDateStr
          })
        })
      } else {
        // Create empty map for the date if it's in the past or today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (searchDateObj <= today) {
          this.selectedMapInfo = {
            _id: `search-${searchDateStr}`,
            creationDate: searchDateObj.toISOString(),
            regions: [] // Empty map for pain-free day
          }
          this.searchMessage = `✓ Showing ${this.formatSelectedDate(searchDateObj.toISOString())} (Pain-free day)`
          // Auto-select the date in the calendar
          this.$nextTick(() => {
            this.calendarDates.forEach(date => {
              date.isSelected = date.key === searchDateStr
            })
          })
        } else {
          // Future date - clear selection and show message
          this.selectedMapInfo = null
          this.searchMessage = '⚠️ Cannot view maps for future dates'
        }
      }
    },
    
    goToToday() {
      const today = new Date()
      this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1)
      this.searchDate = today.toISOString().split('T')[0]
      this.searchMessage = ''
      this.searchForDate()
    },
    
    
    formatSelectedDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
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
    
    
    formatMenuDate(dateString) {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })
      }
    }
  },
  
  computed: {
    sortedSavedMaps() {
      return [...this.savedMaps].sort((a, b) => 
        new Date(b.creationDate) - new Date(a.creationDate)
      )
    },
    
    todayDate() {
      return new Date().toISOString().split('T')[0]
    },
    
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    },
    
    calendarDates() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const dates = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        
        const dateStr = date.toISOString().split('T')[0]
        const mapForDate = this.savedMaps.find(map => 
          map.creationDate.split('T')[0] === dateStr
        )
        
        const isToday = date.getTime() === today.getTime()
        const isPast = date <= today
        
        dates.push({
          key: dateStr,
          day: date.getDate(),
          date: date,
          currentMonth: date.getMonth() === month,
          isToday,
          isPast,
          hasData: !!mapForDate && mapForDate.regions && mapForDate.regions.length > 0,
          regionCount: mapForDate?.regions?.length || 0,
          mapData: mapForDate,
          isSelected: this.selectedMapInfo && 
                     this.selectedMapInfo.creationDate.split('T')[0] === dateStr
        })
      }
      
      return dates
    }
  },
  async mounted() {
    // Import API service
    const { default: apiService } = await import('@/services/api')
    window.api = apiService // Make it globally available
    
    // Close menu when clicking outside or pressing escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMenu()
      }
    })
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, 
    rgba(239, 238, 240, 0.95) 0%, 
    rgba(166, 229, 244, 0.3) 25%, 
    rgba(58, 157, 202, 0.2) 50%, 
    rgba(144, 163, 236, 0.25) 75%, 
    rgba(194, 190, 253, 0.3) 100%);
  background-attachment: fixed;
}

header {
  background: linear-gradient(135deg, 
    rgba(45, 27, 57, 0.9) 0%, 
    rgba(3, 70, 130, 0.85) 50%, 
    rgba(86, 71, 221, 0.8) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(45, 27, 57, 0.2);
  position: relative;
  z-index: 1000;
}

.navbar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  position: relative;
}

/* Hamburger Button */
.hamburger-btn {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
  z-index: 1001;
}

.hamburger-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.hamburger-line {
  width: 24px;
  height: 3px;
  background-color: white;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

/* Hamburger Animation */
.hamburger-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: translateX(-20px);
}

.hamburger-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Brand Title - Centered */
.nav-brand {
  flex: 1;
  text-align: center;
}

.nav-brand h1 {
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

/* Collapsible Menu */
.nav-menu {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100vh;
  background: linear-gradient(180deg, 
    rgba(45, 27, 57, 0.95) 0%, 
    rgba(3, 70, 130, 0.9) 40%, 
    rgba(86, 71, 221, 0.85) 70%, 
    rgba(144, 171, 252, 0.8) 100%);
  backdrop-filter: blur(15px);
  box-shadow: 4px 0 25px rgba(45, 27, 57, 0.25);
  transition: left 0.3s ease;
  z-index: 999;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.nav-menu.active {
  left: 0;
}

.nav-links {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.nav-links a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Menu Content Styling */
.menu-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.menu-header h3 {
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.date-search-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(146, 171, 252, 0.25);
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.date-search {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.date-search:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.date-search::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.search-hint {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-style: italic;
}

.search-message {
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
  background: rgba(34, 197, 94, 0.2);
  color: rgba(34, 197, 94, 1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  transition: all 0.3s;
}

.search-message.error {
  background: rgba(239, 68, 68, 0.2);
  color: rgba(239, 68, 68, 1);
  border-color: rgba(239, 68, 68, 0.3);
}

.today-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, 
    rgba(146, 171, 252, 0.6), 
    rgba(131, 168, 253, 0.7));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  backdrop-filter: blur(5px);
}

.today-btn:hover {
  background: linear-gradient(135deg, 
    rgba(58, 157, 202, 0.7), 
    rgba(32, 116, 162, 0.8));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(131, 168, 253, 0.3);
}


/* Calendar Styling */
.calendar-container {
  padding: 1rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-btn {
  background: linear-gradient(135deg, 
    rgba(107, 132, 205, 0.6), 
    rgba(57, 117, 163, 0.7));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.nav-btn:hover {
  background: linear-gradient(135deg, 
    rgba(58, 157, 202, 0.8), 
    rgba(32, 116, 162, 0.85));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 132, 205, 0.4);
}

.month-year {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  font-family: 'Quincy', 'Crimson Pro', 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid rgba(146, 171, 252, 0.25);
}

.day-header {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
}

.calendar-date {
  background: rgba(255, 255, 255, 0.05);
  min-height: 45px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  position: relative;
}

.calendar-date:hover {
  background: rgba(255, 255, 255, 0.15);
}

.calendar-date.other-month {
  opacity: 0.3;
  cursor: default;
}

.calendar-date.other-month:hover {
  background: rgba(255, 255, 255, 0.05);
}

.calendar-date.today {
  background: rgba(146, 171, 252, 0.3);
  border: 2px solid rgba(131, 168, 253, 0.6);
  box-shadow: 0 2px 8px rgba(144, 171, 252, 0.3);
}

.calendar-date.has-data {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid #10b981;
}

.calendar-date.no-data {
  background: rgba(107, 114, 128, 0.2);
  border: 1px solid #6b7280;
}

.calendar-date.future {
  opacity: 0.4;
  cursor: default;
}

.calendar-date.selected {
  background: rgba(144, 91, 247, 0.3);
  border: 2px solid rgba(86, 71, 221, 0.6);
  box-shadow: 0 4px 15px rgba(144, 91, 247, 0.4);
  backdrop-filter: blur(5px);
}

.date-number {
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
}

.pain-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
}

.region-count {
  line-height: 1;
}

.selected-map-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.selected-map-info h4 {
  color: white;
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.selected-map-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 0;
  font-size: 0.9rem;
}

.pain-free {
  color: #10b981 !important;
}

.region-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0;
}

.region-tag {
  background: rgba(58, 157, 202, 0.2);
  color: #A6E5F4;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  border: 1px solid rgba(58, 157, 202, 0.3);
}

.view-map-btn {
  background: linear-gradient(135deg, 
    rgba(144, 91, 247, 0.7), 
    rgba(86, 71, 221, 0.8));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.view-map-btn:hover {
  background: linear-gradient(135deg, 
    rgba(57, 26, 176, 0.8), 
    rgba(49, 1, 151, 0.85));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(86, 71, 221, 0.3);
}

.calendar-legend {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.has-pain {
  background: #10b981;
}

.legend-color.pain-free {
  background: #6b7280;
}


.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-header h3 {
  margin: 0;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.loading-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.small-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.saved-maps-list {
  max-height: 60vh;
  overflow-y: auto;
}

.map-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background-color 0.2s;
}

.map-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.map-date {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.map-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.map-status {
  font-size: 0.8rem;
}

.map-status.current {
  opacity: 0.8;
}

/* Selected Map Info */
.selected-map-info {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-left: 2px solid rgba(146, 171, 252, 0.4);
  border-right: 2px solid rgba(146, 171, 252, 0.4);
  border-radius: 8px;
  margin: 0.5rem;
}

.selected-map-info h4 {
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
}

.selected-map-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0;
  font-size: 0.85rem;
}

.selected-map-info p.pain-free {
  color: #10b981;
  font-weight: 500;
}

.view-map-btn {
  width: 100%;
  padding: 0.5rem;
  background: linear-gradient(135deg, 
    rgba(107, 132, 205, 0.7), 
    rgba(57, 117, 163, 0.8));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.view-map-btn:hover {
  background: linear-gradient(135deg, 
    rgba(58, 157, 202, 0.8), 
    rgba(32, 116, 162, 0.85));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(107, 132, 205, 0.3);
}

/* Calendar Legend */
.calendar-legend {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.legend-color.has-pain {
  background: rgba(16, 185, 129, 0.6);
  border-color: #10b981;
}

.legend-color.pain-free {
  background: rgba(107, 114, 128, 0.6);
  border-color: #6b7280;
}

.menu-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #3A9DCA 0%, #2074A2 25%, #034682 75%, #2D1B39 100%);
  margin-top: auto;
}

.auto-info {
  text-align: center;
}

.auto-info small {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

/* Menu Overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 32px rgba(45, 27, 57, 0.1);
  border: 1px solid rgba(146, 171, 252, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }
  
  .hamburger-btn {
    left: 0.5rem;
  }
  
  .nav-brand h1 {
    font-size: 1.5rem;
  }
  
  .container {
    padding: 1rem;
  }
}
</style>

