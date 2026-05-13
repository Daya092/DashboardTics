// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL = "http://localhost:3001/api/lecturas";

// Intervalo de actualización (5 segundos)
const UPDATE_INTERVAL = 5000;

// ======================================================
// GLOBAL VARIABLES
// ======================================================

const temperatureLabels = [];
const temperatureData = [];
const humidityData = [];
const percentageData = [];

const activityList = document.getElementById("activityList");
const currentTemp = document.getElementById("currentTemp");
const currentHumidity = document.getElementById("currentHumidity");

const MAX_DATA_POINTS = 15;
const seenReadingIds = new Set();

// ======================================================
// CHART CONFIGURATION
// ======================================================

Chart.defaults.color = "#94a3b8";
Chart.defaults.font.family = "Inter";

// Temperature Chart

const tempCtx = document
  .getElementById("temperatureChart")
  .getContext("2d");

const temperatureChart = new Chart(tempCtx, {
  type: "line",
  data: {
    labels: temperatureLabels,
    datasets: [
      {
        label: "Temperatura °C",
        data: temperatureData,
        borderColor: "#ff6b6b",
        backgroundColor: "rgba(255,107,107,0.15)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: "Porcentaje",
        data: percentageData,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  },
  options: chartOptions("Temperatura"),
});

// Humidity Chart

const humCtx = document
  .getElementById("humidityChart")
  .getContext("2d");

const humidityChart = new Chart(humCtx, {
  type: "line",
  data: {
    labels: temperatureLabels,
    datasets: [
      {
        label: "Humedad %",
        data: humidityData,
        borderColor: "#4dabf7",
        backgroundColor: "rgba(77,171,247,0.15)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: "Porcentaje",
        data: percentageData,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.08)",
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  },
  options: chartOptions("Humedad"),
});

// ======================================================
// COMMON CHART OPTIONS
// ======================================================

function chartOptions(metricName, minValue = -10, maxValue = 100) {
  return {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 900,
      easing: "easeOutQuart",
    },

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        labels: {
          color: "#f8fafc",
        },
      },

      tooltip: {
        backgroundColor: "#111827",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        padding: 14,
        cornerRadius: 12,

        callbacks: {
          title: function (tooltipItems) {
            return `Fecha: ${tooltipItems[0].label}`;
          },

          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },

          afterBody: function (tooltipItems) {
            const index = tooltipItems[0].dataIndex;

            return [
              `Hora: ${fullDateData[index]?.time || "--"}`,
            ];
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          color: "rgba(255,255,255,0.04)",
        },
      },

      y: {
        min: minValue,
        max: maxValue,
        ticks: {
          stepSize: 5,
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
    },
  };
}

// ======================================================
// STORAGE
// ======================================================

const fullDateData = [];

// ======================================================
// FETCH DATA
// ======================================================

async function fetchSensorData() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    /*
      Expected API Format:
      {
        "success": true,
        "data": [
          {
            "id": 1,
            "nombre_usuario": "Carlos",
            "temperatura": 24.5,
            "humedad": 60.1,
            "fecha": "2026-05-13T00:47:15.000Z"
          }
        ]
      }
    */

    if (data?.success && Array.isArray(data.data)) {
      const newReadings = data.data
        .filter((reading) => {
          if (!reading?.id) {
            console.warn("Lectura sin id ignorada:", reading);
            return false;
          }
          return !seenReadingIds.has(reading.id);
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      newReadings.forEach(updateDashboard);
    } else if (data?.id) {
      updateDashboard(data);
    } else {
      console.warn("Formato de API inesperado:", data);
    }
  } catch (error) {
    console.error("Error fetching API data:", error);
  }
}

// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard(data) {
  const {
    id,
    temperatura: temperature,
    humedad: humidity,
    fecha: timestamp,
  } = data;

  const percentage = 0; // No hay percentage en la API, usar 0

  if (!id) {
    console.warn("Lectura sin id ignorada:", data);
    return;
  }

  if (seenReadingIds.has(id)) {
    return;
  }

  seenReadingIds.add(id);

  const clampedTemperature = Math.min(Math.max(temperature, -10), 100);
  const clampedHumidity = Math.min(Math.max(humidity, -10), 100);

  const date = new Date(timestamp);

  const formattedDate = date.toLocaleDateString("es-CO");
  const formattedTime = date.toLocaleTimeString("es-CO");

  const label = `${formattedDate} ${formattedTime}`;

  // Save Labels
  temperatureLabels.push(label);

  // Save Data
  temperatureData.push(clampedTemperature);
  humidityData.push(clampedHumidity);
  percentageData.push(percentage);

  // Save Complete Time Data
  fullDateData.push({
    date: formattedDate,
    time: formattedTime,
  });

  // Limit Data Points
  if (temperatureLabels.length > MAX_DATA_POINTS) {
    temperatureLabels.shift();
    temperatureData.shift();
    humidityData.shift();
    percentageData.shift();
    fullDateData.shift();
  }

  // Update Cards
  currentTemp.textContent = `${clampedTemperature}°C`;
  currentHumidity.textContent = `${clampedHumidity}%`;

  // Update Charts
  temperatureChart.update();
  humidityChart.update();

  // Update Activity Panel
  addActivityItem({
    temperature: clampedTemperature,
    humidity: clampedHumidity,
    date: formattedDate,
    time: formattedTime,
  });
}

// ======================================================
// ACTIVITY PANEL
// ======================================================

function addActivityItem(item) {

  const activityElement = document.createElement("div");

  activityElement.classList.add("activity-item");

  activityElement.innerHTML = `
    <div class="activity-top">
      <strong>Nueva lectura</strong>
      <span class="activity-date">${item.date}</span>
    </div>

    <div class="activity-metrics">

      <div class="metric temperature">
        <i class="fa-solid fa-temperature-half"></i>
        ${item.temperature}°C
      </div>

      <div class="metric humidity">
        <i class="fa-solid fa-droplet"></i>
        ${item.humidity}%
      </div>

    </div>

    <div class="activity-date" style="margin-top:10px;">
      ${item.time}
    </div>
  `;

  // Add newest on top
  activityList.prepend(activityElement);

  // Optional limit
  const MAX_ITEMS = 30;

  while (activityList.children.length > MAX_ITEMS) {
    activityList.removeChild(activityList.lastChild);
  }
}

// ======================================================
// INITIALIZATION
// ======================================================

// Primera carga
fetchSensorData();

// Actualización automática cada 5 segundos
setInterval(fetchSensorData, UPDATE_INTERVAL);

// ======================================================
// OPTIONAL MOCK DATA (For testing without API)
// ======================================================

/*
Descomenta este bloque si deseas probar el dashboard
sin conectar una API real.

setInterval(() => {

  const mockData = {
    temperature: Math.floor(Math.random() * 10) + 25,
    humidity: Math.floor(Math.random() * 30) + 50,
    percentage: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
  };

  updateDashboard(mockData);

}, 5000);