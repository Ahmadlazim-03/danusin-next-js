"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type ChartData,
} from "chart.js"
import { useRef } from "react"
import { Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type Trend = {
  id: string
  category: string
  keyword: string
  value: number
  date: string
  region: string
}

type TrendChartProps = {
  trends: Trend[]
}

export function TrendChart({ trends }: TrendChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null)

  // Process data for the chart
  const processData = (): ChartData<"line"> => {
    // Group trends by keyword
    const groupedByKeyword = trends.reduce(
      (acc, trend) => {
        if (!acc[trend.keyword]) {
          acc[trend.keyword] = []
        }
        acc[trend.keyword].push(trend)
        return acc
      },
      {} as Record<string, Trend[]>,
    )

    // Sort each group by date
    Object.keys(groupedByKeyword).forEach((keyword) => {
      groupedByKeyword[keyword].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    // Get all unique dates across all trends
    const allDates = [...new Set(trends.map((t) => t.date))].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    )

    // Format dates for display
    const labels = allDates.map((date) => new Date(date).toLocaleDateString())

    // Create datasets for each keyword
    const datasets = Object.keys(groupedByKeyword).map((keyword, index) => {
      const keywordTrends = groupedByKeyword[keyword]

      // Map values to dates, filling in gaps with null
      const data = allDates.map((date) => {
        const trend = keywordTrends.find((t) => t.date === date)
        return trend ? trend.value : null
      })

      // Generate a color based on index
      const hue = (index * 137) % 360 // Golden angle approximation for good distribution
      const color = `hsl(${hue}, 70%, 50%)`

      return {
        label: keyword,
        data,
        borderColor: color,
        backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
        tension: 0.3,
        fill: false,
      }
    })

    return {
      labels,
      datasets,
    }
  }

  const chartData = processData()

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Popularity",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  return (
    <div className="h-80 w-full">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
