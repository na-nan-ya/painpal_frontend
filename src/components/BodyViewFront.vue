<template>
  <g class="body-front">
    <!-- Head -->
    <ellipse 
      cx="200" cy="80" rx="50" ry="60" 
      :class="getRegionClass('head')"
      @click.stop="selectRegion('head')"
    />
    
    <!-- Neck -->
    <rect 
      x="180" y="130" width="40" height="30" rx="5"
      :class="getRegionClass('neck')"
      @click.stop="selectRegion('neck')"
    />
    
    <!-- Torso/Chest -->
    <ellipse 
      cx="200" cy="230" rx="80" ry="70"
      :class="getRegionClass('chest')"
      @click.stop="selectRegion('chest')"
    />
    
    <!-- Abdomen -->
    <ellipse 
      cx="200" cy="330" rx="70" ry="50"
      :class="getRegionClass('abdomen')"
      @click.stop="selectRegion('abdomen')"
    />
    
    <!-- Left Shoulder -->
    <circle 
      cx="120" cy="180" r="30"
      :class="getRegionClass('left-shoulder')"
      @click.stop="selectRegion('left-shoulder')"
    />
    
    <!-- Right Shoulder -->
    <circle 
      cx="280" cy="180" r="30"
      :class="getRegionClass('right-shoulder')"
      @click.stop="selectRegion('right-shoulder')"
    />
    
    <!-- Left Upper Arm -->
    <ellipse 
      cx="100" cy="260" rx="25" ry="60"
      :class="getRegionClass('left-upper-arm')"
      @click.stop="selectRegion('left-upper-arm')"
    />
    
    <!-- Right Upper Arm -->
    <ellipse 
      cx="300" cy="260" rx="25" ry="60"
      :class="getRegionClass('right-upper-arm')"
      @click.stop="selectRegion('right-upper-arm')"
    />
    
    <!-- Left Forearm -->
    <ellipse 
      cx="90" cy="360" rx="20" ry="60"
      :class="getRegionClass('left-forearm')"
      @click.stop="selectRegion('left-forearm')"
    />
    
    <!-- Right Forearm -->
    <ellipse 
      cx="310" cy="360" rx="20" ry="60"
      :class="getRegionClass('right-forearm')"
      @click.stop="selectRegion('right-forearm')"
    />
    
    <!-- Left Hand -->
    <ellipse 
      cx="85" cy="430" rx="18" ry="25"
      :class="getRegionClass('left-hand')"
      @click.stop="selectRegion('left-hand')"
    />
    
    <!-- Right Hand -->
    <ellipse 
      cx="315" cy="430" rx="18" ry="25"
      :class="getRegionClass('right-hand')"
      @click.stop="selectRegion('right-hand')"
    />
    
    <!-- Left Hip -->
    <ellipse 
      cx="170" cy="380" rx="35" ry="30"
      :class="getRegionClass('left-hip')"
      @click.stop="selectRegion('left-hip')"
    />
    
    <!-- Right Hip -->
    <ellipse 
      cx="230" cy="380" rx="35" ry="30"
      :class="getRegionClass('right-hip')"
      @click.stop="selectRegion('right-hip')"
    />
    
    <!-- Left Upper Leg -->
    <ellipse 
      cx="170" cy="500" rx="35" ry="90"
      :class="getRegionClass('left-upper-leg')"
      @click.stop="selectRegion('left-upper-leg')"
    />
    
    <!-- Right Upper Leg -->
    <ellipse 
      cx="230" cy="500" rx="35" ry="90"
      :class="getRegionClass('right-upper-leg')"
      @click.stop="selectRegion('right-upper-leg')"
    />
    
    <!-- Left Lower Leg -->
    <ellipse 
      cx="170" cy="640" rx="28" ry="70"
      :class="getRegionClass('left-lower-leg')"
      @click.stop="selectRegion('left-lower-leg')"
    />
    
    <!-- Right Lower Leg -->
    <ellipse 
      cx="230" cy="640" rx="28" ry="70"
      :class="getRegionClass('right-lower-leg')"
      @click.stop="selectRegion('right-lower-leg')"
    />
    
    <!-- Left Foot -->
    <ellipse 
      cx="170" cy="730" rx="25" ry="35"
      :class="getRegionClass('left-foot')"
      @click.stop="selectRegion('left-foot')"
    />
    
    <!-- Right Foot -->
    <ellipse 
      cx="230" cy="730" rx="25" ry="35"
      :class="getRegionClass('right-foot')"
      @click.stop="selectRegion('right-foot')"
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
  methods: {
    selectRegion(regionId) {
      this.$emit('region-click', regionId)
    },
    getRegionClass(regionId) {
      return {
        'body-region': true,
        'selected': this.selectedRegions.includes(regionId)
      }
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

