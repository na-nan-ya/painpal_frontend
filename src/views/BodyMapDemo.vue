<template>
  <div class="body-map-demo">
    <div class="demo-header">
      <h2>Interactive Body Map Demo</h2>
      <p>Rotate the body 360° and click on regions to select them. Use the slider or quick view buttons to change perspectives.</p>
    </div>
    
    <BodyMapCanvas 
      :initial-selections="initialSelections"
      :user-id="userId"
      :map-id="demoMapId"
      @selection-change="handleSelectionChange"
    />
    
    <div class="demo-footer card">
      <h3>Selection Data</h3>
      <div class="json-output">
        <pre>{{ JSON.stringify(currentSelections, null, 2) }}</pre>
      </div>
      <button @click="exportSelections" class="export-btn">
        Export Selections
      </button>
    </div>
  </div>
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'

export default {
  name: 'BodyMapDemo',
  components: {
    BodyMapCanvas
  },
  data() {
    return {
      initialSelections: [],
      currentSelections: [],
      userId: 'demo-user',
      demoMapId: null // Will be null for demo, so API calls will be skipped
    }
  },
  methods: {
    handleSelectionChange(selections) {
      this.currentSelections = selections
      console.log('Current selections:', selections)
    },
    exportSelections() {
      const dataStr = JSON.stringify(this.currentSelections, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'body-map-selections.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.body-map-demo {
  max-width: 1400px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.demo-header h2 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.demo-header p {
  color: #718096;
  font-size: 1.1rem;
}

.demo-footer {
  margin-top: 2rem;
  padding: 2rem;
}

.demo-footer h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
}

.json-output {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.json-output pre {
  margin: 0;
  color: #2d3748;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.export-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: transform 0.2s;
}

.export-btn:hover {
  transform: translateY(-2px);
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}
</style>

