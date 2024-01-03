// ^===========> HTML Elements
const forecastContainer = document.querySelector(".forecast-cards");
const locationElement = document.querySelector(".location");
const searchBox = document.getElementById("searchBox");
const rainHoursElements = document.querySelectorAll("[data-clock]");
const cityContainer = document.querySelector(".city-items")

// &===========> App Variables
const apiKey = "b4f6a7cc6d514448ae7133125232208";
const baseUrl = `http://api.weatherapi.com/v1/forecast.json`
let currentLocation = "cairo";
const recentCities = JSON.parse(localStorage.getItem("cities")) || []

// ?===========> Functions
async function getWeather(location) {
  const response = await fetch(`${baseUrl}?key=${apiKey}&q=${location}&days=7`);
  if (response.status != 200) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Make sure you entered a valid city or Location',
    })
    searchBox.value = ""
    return
  }

  const data = await response.json();
  displayWeather(data)
  searchBox.value = ""
}

function success(position) {
  currentLocation = `${position.coords.latitude},${position.coords.longitude}`
  getWeather(currentLocation)
}

function displayWeather(data) {
  const days = data.forecast.forecastday;
  locationElement.innerHTML = `<span class="city-name">${data.location.name}</span>,${data.location.country}`
  let cardsHTML = "";
  for (let [index, day] of days.entries()) {
    const date = new Date(day.date)
    const weekday = date.toLocaleDateString("en-us", { weekday: "long" })

    cardsHTML += `
      <div class="${index == 0 ? "card active" : "card"}" data-index=${index} >
      <div class="card-header">
        <div class="day">${weekday}</div>
        <div class="time">${date.getHours()}:${date.getMinutes()} ${date.getHours() > 11 ? "pm" : "am"}</div>
      </div>
      <div class="card-body">
        <img src="./images/conditions/${day.day.condition.text}.svg"/>
        <div class="degree">${day.hour[date.getHours()].temp_c}°C</div>
      </div>
      <div class="card-data">
        <ul class="left-column">
          <li>Real Feel: <span class="real-feel">${day.hour[date.getHours()].feelslike_c}°C</span></li>
          <li>Wind: <span class="wind">${day.hour[date.getHours()].wind_kph} K/h</span></li>
          <li>Pressure: <span class="pressure">${day.hour[date.getHours()].pressure_mb}Mb</span></li>
          <li>Humidity: <span class="humidity">${day.hour[date.getHours()].humidity}%</span></li>
        </ul>
        <ul class="right-column">
          <li>Sunrise: <span class="sunrise">${day.astro.sunrise}</span></li>
          <li>Sunset: <span class="sunset">${day.astro.sunset}</span></li>
        </ul>
      </div>
    </div>
    `
  }
  forecastContainer.innerHTML = cardsHTML;

  const allCards = document.querySelectorAll(".card");

  for (let card of allCards) {
    card.addEventListener("click", function (e) {
      const activeCard = document.querySelector(".card.active");
      activeCard.classList.remove("active")
      e.currentTarget.classList.add("active")
      displayRainInfo(days[e.currentTarget.dataset.index])
    })
  }

  let exist = recentCities.find((currentCity) => currentCity.city == data.location.name)
  if (exist) return
  recentCities.push({ city: data.location.name, country: data.location.country });
  localStorage.setItem("cities", JSON.stringify(recentCities))
  displayRecentCity(data.location.name, data.location.country)
}


function displayRainInfo(weather) {
  for (let element of rainHoursElements) {
    const clock = element.dataset.clock;
    let height = weather.hour[clock].chance_of_rain
    element.querySelector(".percent").style.height = `${height}%`
  }
}

async function getCityImage(city) {
  const response = await fetch(`https://api.unsplash.com/search/photos?page=1&query=${city}&client_id=maVgNo3IKVd7Pw7-_q4fywxtQCACntlNXKBBsFdrBzI&per_page=5&orientation=landscape`)
  const data = await response.json();
  const random = Math.trunc(Math.random() * data.results.length)
  return data.results[random]
}

async function displayRecentCity(city, country) {
  let cityInfo = await getCityImage(city);
  if (cityInfo) {
    let itemContent = `
  <div class="item">
    <div class="city-image">
      <img src="${cityInfo.urls.regular}" alt="Image for ${city} city" />
    </div>
    <div class="city-name"><span class="city-name">${city}</span>, ${country}</div>
  </div>
`;

    cityContainer.innerHTML += itemContent
  }
}

// *===========>  Events
window.addEventListener("load", function () {
  navigator.geolocation.getCurrentPosition(success);
  for (let i = 0; i < recentCities.length; i++) {
    displayRecentCity(recentCities[i].city, recentCities[i].country)
  }
})


searchBox.addEventListener("blur", function () {
  getWeather(this.value)
})

document.addEventListener("keyup", function (e) {
  if (e.key == "Enter") getWeather(searchBox.value);
})