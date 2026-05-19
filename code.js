// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL = "https://solid-potato-4j75rxjjwrgxhqqr4-3000.app.github.dev/api/lecturas";

// Intervalo de actualización (5 segundos)
const UPDATE_INTERVAL = 5000;

// ======================================================
// GLOBAL VARIABLES
// ======================================================

const temperatureLabels = [];
const temperatureData = [];
const humidityData = [];

const activityList = document.getElementById("activityList");
const currentTemp = document.getElementById("currentTemp");
const currentHumidity = document.getElementById("currentHumidity");

const MAX_ACTIVITY_ITEMS = 10;
let lastReadingId = null;

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
            const user = fullDateData[index]?.user || "--";

            return [
              `Hora: ${fullDateData[index]?.time || "--"}`,
              `Usuario: ${user}`,
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
    const readings = Array.isArray(data?.data) ? data.data : [];

    if (!readings.length) {
      console.warn("No se encontraron lecturas en la respuesta de la API.", data);
      renderDashboard([]);
      return;
    }

    const sortedReadings = readings
      .filter((reading) => reading && reading.id && reading.fecha)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (!sortedReadings.length) {
      return;
    }

    const latestId = sortedReadings[sortedReadings.length - 1].id;
    if (latestId === lastReadingId) {
      return;
    }

    lastReadingId = latestId;
    renderDashboard(sortedReadings);
  } catch (error) {
    console.error("Error fetching API data:", error);
  }
}

// ======================================================
// UPDATE DASHBOARD
// ======================================================

function renderDashboard(readings) {
  temperatureLabels.length = 0;
  temperatureData.length = 0;
  humidityData.length = 0;
  fullDateData.length = 0;
  activityList.innerHTML = "";

  const formattedReadings = readings.map((reading) => {
    const temperature = Number(reading.temperatura ?? 0);
    const humidity = Number(reading.humedad ?? 0);
    const date = new Date(reading.fecha);

    const clampedTemperature = Math.min(Math.max(temperature, -10), 100);
    const clampedHumidity = Math.min(Math.max(humidity, -10), 100);

    const formattedDate = date.toLocaleDateString("es-CO");
    const formattedTime = date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    temperatureLabels.push(formattedDate);
    temperatureData.push(clampedTemperature);
    humidityData.push(clampedHumidity);
    fullDateData.push({
      date: formattedDate,
      time: formattedTime,
      user: reading.nombre_usuario || "Usuario",
    });

    return {
      ...reading,
      temperatura: clampedTemperature,
      humedad: clampedHumidity,
      fechaFormateada: formattedDate,
      horaFormateada: formattedTime,
    };
  });

  if (formattedReadings.length) {
    const latest = formattedReadings[formattedReadings.length - 1];

    currentTemp.textContent = `${latest.temperatura}°C`;
    currentHumidity.textContent = `${latest.humedad}%`;

    renderActivityPanel(formattedReadings);
  } else {
    currentTemp.textContent = "--°C";
    currentHumidity.textContent = "--%";
  }

  temperatureChart.update();
  humidityChart.update();
}

function renderActivityPanel(readings) {
  const latestReadings = readings
    .slice(-MAX_ACTIVITY_ITEMS)
    .reverse();

  latestReadings.forEach(addActivityItem);
}

// ======================================================
// ACTIVITY PANEL
// ======================================================

function addActivityItem(item) {
  const activityElement = document.createElement("div");
  activityElement.classList.add("activity-item");

  activityElement.innerHTML = `
    <div class="activity-top">
      <strong>${item.nombre_usuario || "Usuario"}</strong>
      <span class="activity-date">${item.fechaFormateada}</span>
    </div>

    <div class="activity-metrics">
      <div class="metric temperature">
        <i class="fa-solid fa-temperature-half"></i>
        ${item.temperatura}°C
      </div>
      <div class="metric humidity">
        <i class="fa-solid fa-droplet"></i>
        ${item.humedad}%
      </div>
    </div>

    <div class="activity-details">
      <span>Fecha: ${item.fechaFormateada}</span>
      <span>Hora: ${item.horaFormateada}</span>
    </div>
  `;

  activityList.appendChild(activityElement);
}

// ======================================================
// INITIALIZATION
// ======================================================

// Primera carga
fetchSensorData();

// Actualización automática cada 5 segundos
setInterval(fetchSensorData, UPDATE_INTERVAL);

