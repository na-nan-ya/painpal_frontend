<template>
  <g class="body-front">
    <!-- Head -->
    <ellipse 
      cx="200" cy="80" rx="50" ry="60" 
      :class="getRegionClass('head')"
      @click.stop="selectRegion('head')"
      @mouseover="handleHover('head', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Neck -->
    <rect 
      x="180" y="130" width="40" height="30" rx="5"
      :class="getRegionClass('neck')"
      @click.stop="selectRegion('neck')"
      @mouseover="handleHover('neck', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Torso/Chest -->
    <ellipse 
      cx="200" cy="230" rx="80" ry="70"
      :class="getRegionClass('chest')"
      @click.stop="selectRegion('chest')"
      @mouseover="handleHover('chest', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Abdomen -->
    <ellipse 
      cx="200" cy="330" rx="70" ry="50"
      :class="getRegionClass('abdomen')"
      @click.stop="selectRegion('abdomen')"
      @mouseover="handleHover('abdomen', $event)"
      @mouseout="handleLeave"
    />

    <!-- Left Shoulder -->
    <circle 
      cx="120" cy="180" r="30"
      :class="getRegionClass('left-shoulder')"
      @click.stop="selectRegion('left-shoulder')"
      @mouseover="handleHover('left-shoulder', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Shoulder -->
    <circle 
      cx="280" cy="180" r="30"
      :class="getRegionClass('right-shoulder')"
      @click.stop="selectRegion('right-shoulder')"
      @mouseover="handleHover('right-shoulder', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Upper Arm -->
    <ellipse 
      cx="100" cy="260" rx="25" ry="60"
      :class="getRegionClass('left-upper-arm')"
      @click.stop="selectRegion('left-upper-arm')"
      @mouseover="handleHover('left-upper-arm', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Upper Arm -->
    <ellipse 
      cx="300" cy="260" rx="25" ry="60"
      :class="getRegionClass('right-upper-arm')"
      @click.stop="selectRegion('right-upper-arm')"
      @mouseover="handleHover('right-upper-arm', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Forearm -->
    <ellipse 
      cx="90" cy="360" rx="20" ry="60"
      :class="getRegionClass('left-forearm')"
      @click.stop="selectRegion('left-forearm')"
      @mouseover="handleHover('left-forearm', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Forearm -->
    <ellipse 
      cx="310" cy="360" rx="20" ry="60"
      :class="getRegionClass('right-forearm')"
      @click.stop="selectRegion('right-forearm')"
      @mouseover="handleHover('right-forearm', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Hand -->
    <ellipse 
      cx="85" cy="430" rx="18" ry="25"
      :class="getRegionClass('left-hand')"
      @click.stop="selectRegion('left-hand')"
      @mouseover="handleHover('left-hand', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Hand -->
    <ellipse 
      cx="315" cy="430" rx="18" ry="25"
      :class="getRegionClass('right-hand')"
      @click.stop="selectRegion('right-hand')"
      @mouseover="handleHover('right-hand', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Hip -->
    <ellipse 
      cx="170" cy="380" rx="35" ry="30"
      :class="getRegionClass('left-hip')"
      @click.stop="selectRegion('left-hip')"
      @mouseover="handleHover('left-hip', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Hip -->
    <ellipse 
      cx="230" cy="380" rx="35" ry="30"
      :class="getRegionClass('right-hip')"
      @click.stop="selectRegion('right-hip')"
      @mouseover="handleHover('right-hip', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Upper Leg -->
    <ellipse 
      cx="170" cy="500" rx="35" ry="90"
      :class="getRegionClass('left-upper-leg')"
      @click.stop="selectRegion('left-upper-leg')"
      @mouseover="handleHover('left-upper-leg', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Upper Leg -->
    <ellipse 
      cx="230" cy="500" rx="35" ry="90"
      :class="getRegionClass('right-upper-leg')"
      @click.stop="selectRegion('right-upper-leg')"
      @mouseover="handleHover('right-upper-leg', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Lower Leg -->
    <ellipse 
      cx="170" cy="640" rx="28" ry="70"
      :class="getRegionClass('left-lower-leg')"
      @click.stop="selectRegion('left-lower-leg')"
      @mouseover="handleHover('left-lower-leg', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Lower Leg -->
    <ellipse 
      cx="230" cy="640" rx="28" ry="70"
      :class="getRegionClass('right-lower-leg')"
      @click.stop="selectRegion('right-lower-leg')"
      @mouseover="handleHover('right-lower-leg', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Left Foot -->
    <ellipse 
      cx="170" cy="730" rx="25" ry="35"
      :class="getRegionClass('left-foot')"
      @click.stop="selectRegion('left-foot')"
      @mouseover="handleHover('left-foot', $event)"
      @mouseout="handleLeave"
    />
    
    <!-- Right Foot -->
    <ellipse 
      cx="230" cy="730" rx="25" ry="35"
      :class="getRegionClass('right-foot')"
      @click.stop="selectRegion('right-foot')"
      @mouseover="handleHover('right-foot', $event)"
      @mouseout="handleLeave"
    />
  </g>
</template>

<script>
export default {
  name: 'BodyViewFront',
  props: {
    selectedRegions: {
      type: Array,
      required: true
    }
  },
  computed: {
    // Force reactivity on selectedRegions changes
    computedSelectedRegions() {
      console.log('🎨 BodyViewFront: computed selectedRegions updated:', this.selectedRegions)
      return this.selectedRegions
    }
  },
  methods: {
    selectRegion(regionId) {
      console.log('💆 BodyViewFront: selectRegion called for:', regionId)
      console.log('📡 BodyViewFront: Emitting region-click event for:', regionId)
      this.$emit('region-click', regionId)
    },
    getRegionClass(regionId) {
      const isSelected = this.selectedRegions.includes(regionId)
      if (isSelected) {
        console.log('🎨 BodyViewFront: Region', regionId, 'should be highlighted (selectedRegions:', this.selectedRegions, ')')
      }
      return {
        'body-region': true,
        'selected': isSelected
      }
    },
    handleHover(regionName, event) {
      this.$emit('region-hover', { regionName, mouseEvent: event })
    },
    handleLeave() {
      this.$emit('region-leave')
    }
  }
}
</script>

<style scoped>
.body-region {
  fill: #e2e8f0;
  stroke: #2d3748;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.body-region:hover {
  fill: #bfdbfe;
  stroke: #3b82f6;
  stroke-width: 3;
}

.body-region.selected {
  fill: #3b82f6;
  stroke: #1d4ed8;
  stroke-width: 3;
}

.body-region.selected:hover {
  fill: #1d4ed8;
}
</style>

