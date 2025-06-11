// DOM Elements
const celsiusBtn = document.getElementById("celsius-btn")
const fahrenheitBtn = document.getElementById("fahrenheit-btn")
const weatherText = document.getElementById("weather-text")
const temperatureEl = document.getElementById("temperature")
const humidityEl = document.getElementById("humidity")
const windSpeedEl = document.getElementById("wind-speed")
const feelsLikeEl = document.getElementById("feels-like")
const forecastContainer = document.getElementById("forecast-container")
const locationInput = document.getElementById("location-input")
const searchBtn = document.getElementById("search-btn")
const currentLocationEl = document.getElementById("current-location")
const characterImage = document.getElementById("character-image")
const mainContent = document.getElementById("main-content")

// State
let tempUnit = "celsius"
let currentWeather = {
  temp: 24,
  feelsLike: 26,
  humidity: 65,
  windSpeed: 5,
  condition: "partly cloudy",
  location: "Jakarta, Indonesia",
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // Set up event listeners
  celsiusBtn.addEventListener("click", () => setTempUnit("celsius"))
  fahrenheitBtn.addEventListener("click", () => setTempUnit("fahrenheit"))
  searchBtn.addEventListener("click", handleSearch)

  // Check time of day and set appropriate mode
  checkTimeOfDay()

  // Set interval to check time of day every minute
  setInterval(checkTimeOfDay, 60000)

  // Initialize the UI
  updateUI()
  createForecast()

  // Add scroll behavior
  document.querySelector(".scroll-indicator").addEventListener("click", () => {
    document.querySelector(".weather-details").scrollIntoView({ behavior: "smooth" })
  })
})

// Check time of day and update UI accordingly
function checkTimeOfDay() {
  const now = new Date()
  const hour = now.getHours()

  // Consider 6 AM to 6 PM as day, otherwise night
  const isDay = hour >= 6 && hour < 18

  if (isDay) {
    mainContent.classList.remove("night")
    mainContent.classList.add("day")
  } else {
    mainContent.classList.remove("day")
    mainContent.classList.add("night")

    // If it's night and not a specific weather condition, show sleeping character
    if (!["sunny", "rainy", "stormy"].includes(currentWeather.condition)) {
      characterImage.src = "images/sleep.jpg"
    }
  }

  updateUI()
}

// Set temperature unit
function setTempUnit(unit) {
  tempUnit = unit

  if (unit === "celsius") {
    celsiusBtn.classList.add("active")
    fahrenheitBtn.classList.remove("active")
  } else {
    celsiusBtn.classList.remove("active")
    fahrenheitBtn.classList.add("active")
  }

  updateTemperatureDisplay()
  updateForecast()
}

// Replace the handleSearch function with this version that uses a real weather API

// Handle search
function handleSearch() {
  const location = locationInput.value.trim()

  if (location) {
    // Show loading state
    weatherText.textContent = "Loading weather data..."

    // Fetch weather data from OpenWeatherMap API
    // Replace YOUR_API_KEY with your actual OpenWeatherMap API key
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=-6.1818&longitude=106.8223&daily=weather_code,rain_sum,uv_index_max,sunset,daylight_duration,showers_sum,sunrise,sunshine_duration&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,rain,showers,is_day,uv_index,sunshine_duration,uv_index_clear_sky&current=is_day,showers,precipitation,cloud_cover,rain,temperature_2m,weather_code&timezone=Asia%2FSingapore`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("City not found")
        }
        return response.json()
      })
      .then((data) => {
        // Update current weather with API data
        currentWeather = {
          temp: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          condition: mapWeatherCondition(data.weather[0].main),
          location: `${data.name}, ${data.sys.country}`,
        }

        // Update UI with new weather data
        updateUI()

        // Fetch forecast data
        return fetch(`https://api.open-meteo.com/v1/forecast?latitude=-6.1818&longitude=106.8223&daily=weather_code,rain_sum,uv_index_max,sunset,daylight_duration,showers_sum,sunrise,sunshine_duration&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,rain,showers,is_day,uv_index,sunshine_duration,uv_index_clear_sky&current=is_day,showers,precipitation,cloud_cover,rain,temperature_2m,weather_code&timezone=Asia%2FSingapore`)
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Forecast data not available")
        }
        return response.json()
      })
      .then((forecastData) => {
        // Process and display forecast data
        processForecastData(forecastData)

        // Clear input field
        locationInput.value = ""

        // Scroll back to top to see the character and weather message
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error)
        weatherText.textContent = "City not found. Try again!"
      })
  }
}

// Map OpenWeatherMap conditions to our app's conditions
function mapWeatherCondition(apiCondition) {
  const condition = apiCondition.toLowerCase()

  if (condition.includes("clear")) {
    return "sunny"
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    return "rainy"
  } else if (condition.includes("cloud")) {
    return condition.includes("few") ? "partly cloudy" : "cloudy"
  } else if (condition.includes("thunderstorm")) {
    return "stormy"
  } else {
    return "partly cloudy" // default
  }
}

// Process forecast data from API
function processForecastData(data) {
  // Clear existing forecast
  forecastContainer.innerHTML = ""

  // Get one forecast per day (noon time)
  const dailyForecasts = data.list.filter((item) => item.dt_txt.includes("12:00:00"))

  // Limit to 5 days
  const forecasts = dailyForecasts.slice(0, 5)

  // Create forecast items
  forecasts.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000)
    const day = date.toLocaleDateString("en-US", { weekday: "short" })
    const temp = Math.round(forecast.main.temp)
    const condition = mapWeatherCondition(forecast.weather[0].main)

    const forecastItem = document.createElement("div")
    forecastItem.className = "forecast-item"

    const iconClass = getWeatherIconClass(condition)

    forecastItem.innerHTML = `
      <p class="forecast-day">${day}</p>
      <div class="forecast-icon ${iconClass}"></div>
      <p class="forecast-temp">${tempUnit === "celsius" ? temp : Math.round((temp * 9) / 5 + 32)}°${tempUnit === "celsius" ? "C" : "F"}</p>
    `

    forecastContainer.appendChild(forecastItem)
  })
}

// Update UI with current weather
function updateUI() {
  // Update weather message
  const isNight = mainContent.classList.contains("night")
  let message = getWeatherMessage(currentWeather.condition)

  // Modify message for night time
  if (isNight) {
    message = message.replace("today", "tonight")
  }

  weatherText.textContent = message

  // Update character based on weather condition and time of day
  updateCharacter(currentWeather.condition, isNight)

  // Update temperature display
  updateTemperatureDisplay()

  // Update other weather details
  humidityEl.textContent = `${currentWeather.humidity}%`
  windSpeedEl.textContent = `${currentWeather.windSpeed} km/h`

  // Update location
  currentLocationEl.textContent = currentWeather.location
}

// Update character based on weather condition and time of day
function updateCharacter(condition, isNight) {
  if (isNight && !["sunny", "rainy", "stormy"].includes(condition)) {
    // At night, show sleeping character unless it's a special weather condition
    characterImage.src = "images/sleep.jpg"
  } else {
    // During day or for special weather conditions
    switch (condition) {
      case "sunny":
        characterImage.src = "images/sunny.jpg"
        break
      case "rainy":
      case "stormy":
        characterImage.src = "images/rainy.jpg"
        break
      default:
        characterImage.src = "images/default.jpg"
    }
  }
}

// Update temperature display based on selected unit
function updateTemperatureDisplay() {
  if (tempUnit === "celsius") {
    temperatureEl.textContent = `${currentWeather.temp}°C`
    feelsLikeEl.textContent = `${currentWeather.feelsLike}°C`
  } else {
    const tempF = Math.round((currentWeather.temp * 9) / 5 + 32)
    const feelsLikeF = Math.round((currentWeather.feelsLike * 9) / 5 + 32)
    temperatureEl.textContent = `${tempF}°F`
    feelsLikeEl.textContent = `${feelsLikeF}°F`
  }
}

// Get weather message based on condition
function getWeatherMessage(condition) {
  switch (condition) {
    case "sunny":
      return "It's sunny today!"
    case "partly cloudy":
      return "It's partly cloudy today!"
    case "cloudy":
      return "It's cloudy today!"
    case "rainy":
      return "It's rainy today!"
    case "stormy":
      return "It's stormy today!"
    default:
      return "Weather is loading..."
  }
}

// Create forecast items
function createForecast() {
  forecastContainer.innerHTML = ""

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  const conditions = ["sunny", "partly cloudy", "cloudy", "rainy", "stormy"]

  days.forEach((day, index) => {
    // Generate random weather for forecast
    const randomTemp = currentWeather.temp + Math.floor(Math.random() * 10) - 5 // -5 to +5 from current temp
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]

    const forecastItem = document.createElement("div")
    forecastItem.className = "forecast-item"

    const iconClass = getWeatherIconClass(randomCondition)

    forecastItem.innerHTML = `
      <p class="forecast-day">${day}</p>
      <div class="forecast-icon ${iconClass}"></div>
      <p class="forecast-temp">${tempUnit === "celsius" ? randomTemp : Math.round((randomTemp * 9) / 5 + 32)}°${tempUnit === "celsius" ? "C" : "F"}</p>
    `

    forecastContainer.appendChild(forecastItem)
  })
}

// Update forecast when temperature unit changes
function updateForecast() {
  const forecastItems = document.querySelectorAll(".forecast-item")

  forecastItems.forEach((item) => {
    const tempEl = item.querySelector(".forecast-temp")
    const currentTemp = Number.parseInt(tempEl.textContent)

    if (tempUnit === "celsius" && tempEl.textContent.includes("°F")) {
      // Convert from F to C
      const tempC = Math.round(((currentTemp - 32) * 5) / 9)
      tempEl.textContent = `${tempC}°C`
    } else if (tempUnit === "fahrenheit" && tempEl.textContent.includes("°C")) {
      // Convert from C to F
      const tempF = Math.round((currentTemp * 9) / 5 + 32)
      tempEl.textContent = `${tempF}°F`
    }
  })
}

// Get weather icon class based on condition
function getWeatherIconClass(condition) {
  switch (condition) {
    case "sunny":
      return "sunny-icon"
    case "partly cloudy":
      return "partly-cloudy-icon"
    case "cloudy":
      return "cloudy-icon"
    case "rainy":
      return "rainy-icon"
    case "stormy":
      return "stormy-icon"
    default:
      return "sunny-icon"
  }
}

// Add CSS for weather icons
const iconStyles = document.createElement("style")
iconStyles.textContent = `
  .sunny-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f6b93b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>');
  }
  
  .partly-cloudy-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236a9eca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><path d="M10 16H6.5a3.5 3.5 0 1 1 0-7H10"/><path d="M10 16a2 2 0 1 0 0-4"/><path d="M13.5 9A4.5 4.5 0 1 0 18 13.5"/></svg>');
  }
  
  .cloudy-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236a9eca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z  stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>');
  }
  
  .rainy-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236a9eca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>');
  }
  
  .stormy-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236a9eca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M13 12l-3 5h4l-3 5"/></svg>');
  }
`
document.head.appendChild(iconStyles)

