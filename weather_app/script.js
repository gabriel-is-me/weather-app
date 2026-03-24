const weather_form = document.getElementById('weather_form');
const area_display = document.getElementById('area_display');
const temp_display = document.getElementById('temp_display');
const weather_display = document.getElementById('weather_display');
const humidity_card = document.getElementById('humidity_card');
const humidity_scale_fill = document.getElementById('humidity_scale_fill');
const humidity_percentage_number = document.getElementById('humidity_percentage_number'); 
const humidity_percentage_rating = document.getElementById('humidity_percentage_rating');
const precipitation_display = document.getElementById('precipitation_display');
const humidity_percentage_rating_display = document.getElementById('humidity_percentage_rating_display');
const weather_widgets = document.getElementById('weather_widgets');
const precipitation_description = document.getElementById('precipitation_description');
const compass_needle = document.getElementById('compass_needle');
const wind_gusts_number_display = document.getElementById('wind_gusts_number_display');
const wind_speed_number_display = document.getElementById('wind_speed_number_display');
const date_display = document.getElementById('date_display');
const date_display_container = document.getElementById('date_display_container');
const compass_direction_label = document.getElementById('compass_direction_label');
const city_input = document.getElementById('city_input');


weather_display.style.visibility = "hidden";
weather_widgets.style.visibility = "hidden";
date_display_container.style.visibility = "hidden";


    weather_form.addEventListener('submit', async event => {
        event.preventDefault();

        const city = city_input.value

        const previousCityHTML = area_display.innerHTML;
        const previousColor = area_display.style.color;

    try{
 
        const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city.toLowerCase().replaceAll("-"," ")}&count=10&language=en&format=json`);

        const geocodeResponseData = await geocodeResponse.json();


        if(!geocodeResponseData.results){
            throw new Error ("Error in fetching city")
        }


        const cityPosition = {
            coords:{
                latitude : geocodeResponseData.results[0].latitude,
                longitude : geocodeResponseData.results[0].longitude
            }
        }


        gotLocation(cityPosition);

        city_input.value = ""; 
    }
    catch(error){
        console.error(error);
        area_display.innerHTML = `<strong>City not found. Try again!</strong>`;
        area_display.style.color = "red";
        setTimeout(() => {
            area_display.innerHTML = previousCityHTML;
            area_display.style.color = previousColor;
            city_input.value = "";
        }, 3000);
    }
    });
    
    //fetch latitude and longitude coordinates of user's current location

    //2nd callback will execute if first callback fails (user rejects)
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(gotLocation, failedLocation);
    }
    else{
    area_display.textContent = "GPS not supported by browser.";
    }

    function failedLocation(){
        area_display.innerHTML = "Access to user location denied<br>Please search for a city instead";
    }

    async function gotLocation(position){

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

    try{

        const date = new Date();


        const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

        let hours = date.getHours() .toString() .padStart(2,"0");
        const meridiem = date.getHours() >=12 ? "PM" : "AM";
        hours = hours % 12 || 12
        const minutes = date.getMinutes() .toString() .padStart(2,"0");

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        date_display.innerHTML = `<strong>Last Refreshed On ${day} ${months[month]} ${year} <br>${hours}:${minutes} ${meridiem}</strong>`

        const ReverseGeoCodeResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);

        if(!ReverseGeoCodeResponse.ok){
            throw new Error("Failed to reverse geocode");
        }

        const ReverseGeoCodeResponseData = await ReverseGeoCodeResponse.json();

        area_display.innerHTML = `<strong>${ReverseGeoCodeResponseData.city} ${ReverseGeoCodeResponseData.countryCode}</strong>`;
        area_display.style.color = "white";

        const WeatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=is_day,apparent_temperature,relative_humidity_2m,temperature_2m,snowfall,showers,rain,precipitation,surface_pressure,pressure_msl,cloud_cover,weather_code,wind_gusts_10m,wind_direction_10m,wind_speed_10m&timezone=auto`)

        if(!WeatherResponse.ok){
            throw new Error("Failed to fetch data");
        }

        const WeatherResponseData = await WeatherResponse.json();

        console.log(WeatherResponseData)

        weather_display.style.visibility = "visible";

        if(WeatherResponseData.current.precipitation > 0){
            weather_display.src = "images/rain.gif";
            document.body.style.backgroundImage = "url('images/raining_background.gif')";
        }
        else{
            weather_display.src= "images/sun.gif";
            document.body.style.backgroundImage = "url('images/sunny_background.gif')";
        }

        temp_display.innerHTML = `<strong>${WeatherResponseData.current.apparent_temperature}&deg;C</strong>`;
        humidity_scale_fill.style.height = `${WeatherResponseData.current.relative_humidity_2m}%`

        const humidity = WeatherResponseData.current.relative_humidity_2m

        humidity_percentage_number.innerHTML = `<strong>${humidity}%</strong>`;
        
        if (humidity < 30) {
            humidity_percentage_rating.innerHTML = "<strong>Dry</strong>";
            humidity_percentage_rating_display.style.backgroundColor = "#d97706";
        } 
        else if (humidity >= 30 && humidity <= 60) {
            humidity_percentage_rating.innerHTML = "<strong>Comfortable</strong>";
            humidity_percentage_rating_display.style.backgroundColor = "#16a34a"; 
        } 
        else if (humidity > 60 && humidity <= 80) {
            humidity_percentage_rating.innerHTML = "<strong>Humid</strong>";
            humidity_percentage_rating_display.style.backgroundColor = "#ea580c";
        } 
        else {
            humidity_percentage_rating.innerHTML = "<strong>Very Humid</strong>";
            humidity_percentage_rating_display.style.backgroundColor = "#dc2626"; 
        }

        precipitation_display.innerHTML = `<strong>${WeatherResponseData.current.precipitation}  mm</strong>`

        if(WeatherResponseData.current.precipitation > 0){
            precipitation_description.innerHTML = "Precipitation detected"
        }
        else{
            precipitation_description.innerHTML = "No precipitation detected"
        }

        compass_needle.style.transform = `translate(-50%, -50%) rotate(${WeatherResponseData.current.wind_direction_10m}deg)`;

        const directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
        const dirIndex = Math.round(WeatherResponseData.current.wind_direction_10m / 45) % 8;
        compass_direction_label.innerHTML = `<strong>${directions[dirIndex]}</strong>`

        wind_gusts_number_display.innerHTML = `<strong>${WeatherResponseData.current.wind_gusts_10m} ${(WeatherResponseData.current_units.wind_gusts_10m).toUpperCase()}</strong>`
        wind_speed_number_display.innerHTML = `<strong>${WeatherResponseData.current.wind_speed_10m} ${(WeatherResponseData.current_units.wind_speed_10m).toUpperCase()}</strong>`


        weather_widgets.style.visibility = "visible";
        date_display_container.style.visibility = "visible";
        }  
        catch(error){
            console.error(error);
            let elements = document.querySelectorAll('.display_value');

            elements.forEach(element => {
                element.innerHTML = ""
            });
        }
}

//15 min in milliseconds is 900000
setInterval(() =>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(gotLocation, failedLocation);
    }
    else{
    area_display.textContent = "GPS not supported by browser.";
    }},900000);

