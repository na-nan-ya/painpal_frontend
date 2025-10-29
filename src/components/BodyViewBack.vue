<template>
  <g class="body-back">
    <!-- Head (back) -->
    <ellipse 
      cx="200" cy="80" rx="50" ry="60" 
      :class="getRegionClass('back-head')"
      @click.stop="selectRegion('back-head')"
    />
    
    <!-- Neck (back) -->
    <rect 
      x="180" y="130" width="40" height="30" rx="5"
      :class="getRegionClass('back-neck')"
      @click.stop="selectRegion('back-neck')"
    />
    
    <!-- Upper Back -->
    <ellipse 
      cx="200" cy="210" rx="75" ry="50"
      :class="getRegionClass('upper-back')"
      @click.stop="selectRegion('upper-back')"
    />
    
    <!-- Lower Back -->
    <ellipse 
      cx="200" cy="300" rx="70" ry="60"
      :class="getRegionClass('lower-back')"
      @click.stop="selectRegion('lower-back')"
    />
    
    <!-- Left Shoulder Blade -->
    <ellipse 
      cx="160" cy="200" rx="30" ry="40" 
      transform="rotate(-10 160 200)"
      :class="getRegionClass('left-shoulder-blade')"
      @click.stop="selectRegion('left-shoulder-blade')"
    />
    
    <!-- Right Shoulder Blade -->
    <ellipse 
      cx="240" cy="200" rx="30" ry="40"
      transform="rotate(10 240 200)"
      :class="getRegionClass('right-shoulder-blade')"
      @click.stop="selectRegion('right-shoulder-blade')"
    />
    
    <!-- Left Back Upper Arm -->
    <ellipse 
      cx="100" cy="260" rx="25" ry="60"
      :class="getRegionClass('left-back-upper-arm')"
      @click.stop="selectRegion('left-back-upper-arm')"
    />
    
    <!-- Right Back Upper Arm -->
    <ellipse 
      cx="300" cy="260" rx="25" ry="60"
      :class="getRegionClass('right-back-upper-arm')"
      @click.stop="selectRegion('right-back-upper-arm')"
    />
    
    <!-- Left Back Forearm -->
    <ellipse 
      cx="90" cy="360" rx="20" ry="60"
      :class="getRegionClass('left-back-forearm')"
      @click.stop="selectRegion('left-back-forearm')"
    />
    
    <!-- Right Back Forearm -->
    <ellipse 
      cx="310" cy="360" rx="20" ry="60"
      :class="getRegionClass('right-back-forearm')"
      @click.stop="selectRegion('right-back-forearm')"
    />
    
    <!-- Left Back Hand -->
    <ellipse 
      cx="85" cy="430" rx="18" ry="25"
      :class="getRegionClass('left-back-hand')"
      @click.stop="selectRegion('left-back-hand')"
    />
    
    <!-- Right Back Hand -->
    <ellipse 
      cx="315" cy="430" rx="18" ry="25"
      :class="getRegionClass('right-back-hand')"
      @click.stop="selectRegion('right-back-hand')"
    />
    
    <!-- Buttocks Left -->
    <ellipse 
      cx="170" cy="370" rx="40" ry="35"
      :class="getRegionClass('left-buttock')"
      @click.stop="selectRegion('left-buttock')"
    />
    
    <!-- Buttocks Right -->
    <ellipse 
      cx="230" cy="370" rx="40" ry="35"
      :class="getRegionClass('right-buttock')"
      @click.stop="selectRegion('right-buttock')"
    />
    
    <!-- Left Back Upper Leg -->
    <ellipse 
      cx="170" cy="500" rx="35" ry="90"
      :class="getRegionClass('left-back-upper-leg')"
      @click.stop="selectRegion('left-back-upper-leg')"
    />
    
    <!-- Right Back Upper Leg -->
    <ellipse 
      cx="230" cy="500" rx="35" ry="90"
      :class="getRegionClass('right-back-upper-leg')"
      @click.stop="selectRegion('right-back-upper-leg')"
    />
    
    <!-- Left Back Calf -->
    <ellipse 
      cx="170" cy="640" rx="30" ry="70"
      :class="getRegionClass('left-back-calf')"
      @click.stop="selectRegion('left-back-calf')"
    />
    
    <!-- Right Back Calf -->
    <ellipse 
      cx="230" cy="640" rx="30" ry="70"
      :class="getRegionClass('right-back-calf')"
      @click.stop="selectRegion('right-back-calf')"
    />
    
    <!-- Left Back Foot -->
    <ellipse 
      cx="170" cy="730" rx="25" ry="35"
      :class="getRegionClass('left-back-foot')"
      @click.stop="selectRegion('left-back-foot')"
    />
    
    <!-- Right Back Foot -->
    <ellipse 
      cx="230" cy="730" rx="25" ry="35"
      :class="getRegionClass('right-back-foot')"
      @click.stop="selectRegion('right-back-foot')"
    />
  </g>
</template>

<script>
export default {
  name: 'BodyViewBack',
  props: {
    selectedRegions: {
      type: Array,
      required: true
    }
  },
  methods: {
    selectRegion(regionId) {
      this.$emit('region-click', regionId)
    },
    getRegionClass(regionId) {
      return {
        'body-region': true,
        'selected': this.selectedRegions.includes(regionId)
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

