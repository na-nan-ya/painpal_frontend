import axios from 'axios'

// Configure the base URL for your API
// Update this to match your backend URL
const API_BASE_URL = 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
  /**
   * Generate a new body map for a user
   * @param {string} userId - The user ID
   * @returns {Promise} Response containing the new map ID
   */
  generateMap(userId) {
    return api.post('/api/BodyMapGeneration/generateMap', { user: userId })
  },

  /**
   * Save the current map
   * @param {string} userId - The user ID
   * @returns {Promise} Empty response on success
   */
  saveMap(userId) {
    return api.post('/api/BodyMapGeneration/saveMap', { user: userId })
  },

  /**
   * Clear the current map
   * @param {string} userId - The user ID
   * @returns {Promise} Empty response on success
   */
  clearMap(userId) {
    return api.post('/api/BodyMapGeneration/clearMap', { user: userId })
  },

  /**
   * Get the current map for a user
   * @param {string} userId - The user ID
   * @returns {Promise} Response containing the current map or null
   */
  getCurrentMap(userId) {
    return api.post('/api/BodyMapGeneration/_getCurrentMap', { user: userId })
  },

  /**
   * Get all saved maps for a user
   * @param {string} userId - The user ID
   * @returns {Promise} Response containing array of saved maps
   */
  getSavedMaps(userId) {
    return api.post('/api/BodyMapGeneration/_getSavedMaps', { user: userId })
  },

  /**
   * Trigger daily map generation for all users (admin function)
   * @returns {Promise} Empty response on success
   */
  triggerDailyMapGeneration() {
    return api.post('/api/BodyMapGeneration/triggerDailyMapGeneration', {})
  },

  // PainLocationScoring API endpoints

  /**
   * Add a region to a map
   * @param {string} userId - The user ID
   * @param {string} mapId - The map ID
   * @param {string} regionName - The name of the body region
   * @returns {Promise} Response containing the new region ID
   */
  addRegion(userId, mapId, regionName) {
    return api.post('/api/PainLocationScoring/addRegion', {
      user: userId,
      map: mapId,
      regionName: regionName
    })
  },

  /**
   * Score a region with a pain intensity value (1-10)
   * @param {string} userId - The user ID
   * @param {string} regionId - The region ID
   * @param {number} score - Pain score (1-10)
   * @returns {Promise} Empty response on success
   */
  scoreRegion(userId, regionId, score) {
    return api.post('/api/PainLocationScoring/scoreRegion', {
      user: userId,
      region: regionId,
      score: score
    })
  },

  /**
   * Delete a region from a map
   * @param {string} userId - The user ID
   * @param {string} regionId - The region ID
   * @returns {Promise} Empty response on success
   */
  deleteRegion(userId, regionId) {
    return api.post('/api/PainLocationScoring/deleteRegion', {
      user: userId,
      region: regionId
    })
  },

  /**
   * Get a specific region's details
   * @param {string} userId - The user ID
   * @param {string} regionId - The region ID
   * @returns {Promise} Response containing region details
   */
  getRegion(userId, regionId) {
    return api.post('/api/PainLocationScoring/_getRegion', {
      user: userId,
      region: regionId
    })
  },

  /**
   * Get all regions for a specific map
   * @param {string} userId - The user ID
   * @param {string} mapId - The map ID
   * @returns {Promise} Response containing array of regions
   */
  getRegionsForMap(userId, mapId) {
    return api.post('/api/PainLocationScoring/_getRegionsForMap', {
      user: userId,
      map: mapId
    })
  }
}

