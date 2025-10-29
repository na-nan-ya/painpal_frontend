<template>
  <g class="body-side">
    <!-- Head (side profile) -->
    <ellipse 
      :cx="side === 'left' ? 180 : 220" 
      cy="80" 
      rx="45" 
      ry="60" 
      :class="getRegionClass(`${side}-side-head`)"
      @click.stop="selectRegion(`${side}-side-head`)"
    />
    
    <!-- Face area -->
    <ellipse 
      :cx="side === 'left' ? 150 : 250" 
      cy="80" 
      rx="25" 
      ry="50"
      :class="getRegionClass(`${side}-side-face`)"
      @click.stop="selectRegion(`${side}-side-face`)"
    />
    
    <!-- Neck (side) -->
    <rect 
      :x="side === 'left' ? 165 : 205" 
      y="125" 
      width="35" 
      height="35" 
      rx="8"
      :class="getRegionClass(`${side}-side-neck`)"
      @click.stop="selectRegion(`${side}-side-neck`)"
    />
    
    <!-- Upper Torso (side) -->
    <ellipse 
      :cx="side === 'left' ? 160 : 200" 
      cy="220" 
      rx="55" 
      ry="70"
      :class="getRegionClass(`${side}-side-upper-torso`)"
      @click.stop="selectRegion(`${side}-side-upper-torso`)"
    />
    
    <!-- Lower Torso/Abdomen (side) -->
    <ellipse 
      :cx="side === 'left' ? 165 : 205" 
      cy="320" 
      rx="50" 
      ry="60"
      :class="getRegionClass(`${side}-side-abdomen`)"
      @click.stop="selectRegion(`${side}-side-abdomen`)"
    />
    
    <!-- Shoulder (side) -->
    <circle 
      :cx="side === 'left' ? 150 : 190" 
      cy="175" 
      r="28"
      :class="getRegionClass(`${side}-side-shoulder`)"
      @click.stop="selectRegion(`${side}-side-shoulder`)"
    />
    
    <!-- Upper Arm (side) -->
    <ellipse 
      :cx="side === 'left' ? 130 : 170" 
      cy="260" 
      rx="23" 
      ry="60"
      :class="getRegionClass(`${side}-side-upper-arm`)"
      @click.stop="selectRegion(`${side}-side-upper-arm`)"
    />
    
    <!-- Forearm (side) -->
    <ellipse 
      :cx="side === 'left' ? 125 : 165" 
      cy="360" 
      rx="20" 
      ry="60"
      :class="getRegionClass(`${side}-side-forearm`)"
      @click.stop="selectRegion(`${side}-side-forearm`)"
    />
    
    <!-- Hand (side) -->
    <ellipse 
      :cx="side === 'left' ? 125 : 165" 
      cy="430" 
      rx="16" 
      ry="25"
      :class="getRegionClass(`${side}-side-hand`)"
      @click.stop="selectRegion(`${side}-side-hand`)"
    />
    
    <!-- Hip (side) -->
    <ellipse 
      :cx="side === 'left' ? 160 : 200" 
      cy="380" 
      rx="45" 
      ry="35"
      :class="getRegionClass(`${side}-side-hip`)"
      @click.stop="selectRegion(`${side}-side-hip`)"
    />
    
    <!-- Upper Leg (side) -->
    <ellipse 
      :cx="side === 'left' ? 160 : 200" 
      cy="500" 
      rx="38" 
      ry="90"
      :class="getRegionClass(`${side}-side-upper-leg`)"
      @click.stop="selectRegion(`${side}-side-upper-leg`)"
    />
    
    <!-- Lower Leg (side) -->
    <ellipse 
      :cx="side === 'left' ? 165 : 205" 
      cy="640" 
      rx="30" 
      ry="70"
      :class="getRegionClass(`${side}-side-lower-leg`)"
      @click.stop="selectRegion(`${side}-side-lower-leg`)"
    />
    
    <!-- Foot (side - horizontal) -->
    <ellipse 
      :cx="side === 'left' ? 190 : 230" 
      cy="730" 
      rx="45" 
      ry="25"
      :class="getRegionClass(`${side}-side-foot`)"
      @click.stop="selectRegion(`${side}-side-foot`)"
    />
  </g>
</template>

<script>
export default {
  name: 'BodyViewSide',
  props: {
    selectedRegions: {
      type: Array,
      required: true
    },
    side: {
      type: String,
      required: true,
      validator: (value) => ['left', 'right'].includes(value)
    }
  },
  props: {
    selectedRegions: {
      type: Array,
      required: true
    },
    side: {
      type: String,
      required: true,
      validator: (value) => ['left', 'right'].includes(value)
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

