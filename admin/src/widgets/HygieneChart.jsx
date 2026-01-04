import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function HygieneChart({ messes }) {
  const labels = messes.map(m => m.name)
  const data = {
    labels,
    datasets: [
      {
        label: 'Hygiene Score',
        data: messes.map(m => m.hygieneScore || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }
    ]
  }

  return <Bar data={data} />
}
