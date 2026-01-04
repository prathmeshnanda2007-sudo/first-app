import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// dataPoints: [{label: '2025-12-01', value: 3.5}, ...]
export default function TrendChart({ dataPoints, label = 'Hygiene Score' }) {
  const labels = dataPoints.map(p => p.label)
  const data = {
    labels,
    datasets: [
      {
        label,
        data: dataPoints.map(p => p.value),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
        tension: 0.2,
        pointRadius: 3
      }
    ]
  }

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { display: true, title: { display: true, text: 'Date' } },
      y: { display: true, title: { display: true, text: 'Score' }, min: 0, max: 5 }
    },
    maintainAspectRatio: false
  }

  return (
    <div style={{ height: 300 }}>
      <Line data={data} options={options} />
    </div>
  )
}
