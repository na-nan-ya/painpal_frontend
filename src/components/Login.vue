<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">PainPal</h1>
      </div>

      <div class="login-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: !isLoginMode }"
          @click="isLoginMode = false"
        >
          Create Account
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: isLoginMode }"
          @click="isLoginMode = true"
        >
          Sign In
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Enter your username"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            class="form-input"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          class="submit-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Processing...</span>
          <span v-else>{{ isLoginMode ? 'Sign In' : 'Create Account' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'Login',
  props: {
    isLoginMode: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      isLoading: false,
      isLoginMode: false
    }
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = ''
      this.isLoading = true

      try {
        if (this.isLoginMode) {
          // Login
          // According to API spec: POST /api/UserAuthentication/login
          // Returns: { "session": "string | null" }
          const response = await api.login(this.username, this.password)
          
          // Check if session exists (not null)
          if (response.data && response.data.session !== null && response.data.session !== undefined) {
            const sessionId = response.data.session
            
            // Get user ID from session details (more reliable than username lookup)
            try {
              const sessionResponse = await api.getSession(sessionId)
              
              // Handle different response formats per API spec
              let userId = null
              if (sessionResponse.data) {
                // Check if it's an array format (per API spec: [{ session: { userId, ... } }])
                if (Array.isArray(sessionResponse.data) && sessionResponse.data.length > 0) {
                  userId = sessionResponse.data[0].session?.userId
                } 
                // Check if it's a direct object format
                else if (sessionResponse.data.session && sessionResponse.data.session.userId) {
                  userId = sessionResponse.data.session.userId
                }
                // Check if userId is directly in data
                else if (sessionResponse.data.userId) {
                  userId = sessionResponse.data.userId
                }
              }
              
              if (userId) {
                this.$emit('login-success', {
                  userId,
                  sessionId: sessionId,
                  username: this.username
                })
              } else {
                console.error('Session response format unexpected:', sessionResponse.data)
                // Fallback: try to get user by username as backup
                try {
                  const userResponse = await api.getUser(this.username)
                  if (userResponse.data) {
                    if (Array.isArray(userResponse.data) && userResponse.data.length > 0) {
                      userId = userResponse.data[0].user?._id
                    } else if (userResponse.data.user?._id) {
                      userId = userResponse.data.user._id
                    }
                  }
                  if (userId) {
                    this.$emit('login-success', {
                      userId,
                      sessionId: sessionId,
                      username: this.username
                    })
                  } else {
                    this.errorMessage = 'Failed to retrieve user information. Please try again.'
                  }
                } catch (userError) {
                  console.error('Fallback getUser also failed:', userError)
                  this.errorMessage = 'Login successful but failed to retrieve user details. Please refresh the page.'
                }
              }
            } catch (sessionError) {
              console.error('Error fetching session information:', sessionError)
              // Fallback: try to get user by username
              try {
                const userResponse = await api.getUser(this.username)
                let userId = null
                if (userResponse.data) {
                  if (Array.isArray(userResponse.data) && userResponse.data.length > 0) {
                    userId = userResponse.data[0].user?._id
                  } else if (userResponse.data.user?._id) {
                    userId = userResponse.data.user._id
                  }
                }
                if (userId) {
                  this.$emit('login-success', {
                    userId,
                    sessionId: sessionId,
                    username: this.username
                  })
                } else {
                  this.errorMessage = 'Failed to retrieve user information. Please try again.'
                }
              } catch (userError) {
                console.error('Fallback getUser also failed:', userError)
                this.errorMessage = 'Login successful but failed to retrieve user details. Please refresh the page.'
              }
            }
          } else {
            // Session is null - login failed per API spec
            this.errorMessage = 'Invalid username or password'
          }
        } else {
          // Register
          // According to API spec: POST /api/UserAuthentication/register
          // Returns: { "user": "string" } (user ID)
          const response = await api.register(this.username, this.password)
          
          if (response.data && response.data.user) {
            // After registration, automatically log in
            const loginResponse = await api.login(this.username, this.password)
            
            // Check if session exists (not null)
            if (loginResponse.data && loginResponse.data.session !== null && loginResponse.data.session !== undefined) {
              this.$emit('login-success', {
                userId: response.data.user,
                sessionId: loginResponse.data.session,
                username: this.username
              })
            } else {
              this.errorMessage = 'Account created but login failed. Please try signing in.'
            }
          } else {
            this.errorMessage = 'Registration failed. Username may already exist.'
          }
        }
      } catch (error) {
        console.error('Authentication error:', error)
        this.errorMessage = error.response?.data?.error || 
          (this.isLoginMode 
            ? 'Failed to sign in. Please check your credentials.' 
            : 'Registration failed. Username may already exist.')
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(144, 171, 252, 0.15) 0%, rgba(107, 132, 205, 0.12) 50%, rgba(58, 157, 202, 0.1) 100%);
  padding: 2rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(45, 27, 57, 0.15);
  border: 1px solid rgba(144, 171, 252, 0.3);
  max-width: 420px;
  width: 100%;
  padding: 2.5rem;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-family: 'Quincy', 'Crimson Pro', 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: rgba(45, 27, 57, 0.9);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
}

.login-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 1rem;
  color: rgba(44, 62, 80, 0.7);
  margin: 0;
}

.login-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(144, 171, 252, 0.2);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(44, 62, 80, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: rgba(44, 62, 80, 0.8);
}

.tab-btn.active {
  color: rgba(86, 71, 221, 0.9);
  border-bottom-color: rgba(86, 71, 221, 0.6);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(44, 62, 80, 0.8);
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(144, 171, 252, 0.3);
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 0.95rem;
  color: rgba(44, 62, 80, 0.9);
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: rgba(86, 71, 221, 0.5);
  box-shadow: 0 0 0 3px rgba(86, 71, 221, 0.1);
  background: white;
}

.form-input::placeholder {
  color: rgba(44, 62, 80, 0.4);
}

.error-message {
  padding: 0.75rem 1rem;
  background: rgba(254, 242, 242, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: rgba(220, 38, 38, 0.9);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.submit-btn {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, rgba(86, 71, 221, 0.85) 0%, rgba(3, 70, 130, 0.8) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(86, 71, 221, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 2rem;
  }
}
</style>

