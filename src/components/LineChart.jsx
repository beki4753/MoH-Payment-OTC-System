import React, { useEffect, useState } from 'react';
import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { getTokenValue } from '../services/user_service';
import api from '../utils/api';

const tokenvalue = getTokenValue();
const LineChart = ({ isCustomLineColors = false, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const [result, setResult] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.put('/Payment/Get-all-Payment', {
          startDate: startDate,
          endDate: today,
          user: tokenvalue.name,
        });


        const summary = response?.data ?  response?.data?.reduce((acc, payment) => {
          const { createdOn, amount } = payment;
          const dateKey = new Date(createdOn).toISOString().split('T')[0];
          if (!acc[dateKey]) {
            acc[dateKey] = 0;
          }
          acc[dateKey] += parseFloat(amount);
          return acc;
        }, {}) : [];

        // Convert to array and sort by date (chronological order)
        const mapped = Object.entries(summary)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))  // Sort by date
          .map(([date, amount]) => ({
            x: date,  // This will be used for the x-axis
            y: amount,  // This will be used for the y-axis
            Date: date,  // For tooltip display
            Amount: amount  // For tooltip display
          }));
        
        setResult(mapped);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, []);

  const data = [
    {
      id: "Transaction",
      color: tokens("dark").greenAccent[500],
      data: result,
    },
  ];

  return (
    <ResponsiveLine
  data={data}
  theme={{
    axis: {
      domain: {
        line: {
          stroke: colors.grey[100],
        },
      },
      legend: {
        text: {
          fill: colors.grey[100],
        },
      },
      ticks: {
        line: {
          stroke: colors.grey[100],
          strokeWidth: 1,
        },
        text: {
          fill: colors.grey[100],
        },
      },
    },
    legends: {
      text: {
        fill: colors.grey[100],
      },
    },
  }}
  tooltip={({ point }) => (
    <div
      style={{
        background: colors.primary[400],
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        color: colors.grey[100],
      }}
    >
      <div><strong>Date:</strong> {point.data.xFormatted || point.data.Date}</div>
      <div><strong>Amount:</strong> {point.data.yFormatted || point.data.Amount}</div>
    </div>
  )}
  colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
  margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
  xScale={{ type: "point" }}
  yScale={{
    type: "linear",
    min: "auto",
    max: "auto",
    stacked: true,
    reverse: false,
  }}
  yFormat=" >-.2f"
  curve="catmullRom"
  axisTop={null}
  axisRight={null}
  axisBottom={{
    orient: "bottom",
    tickSize: 0,
    tickPadding: 5,
    tickRotation: 0,
    legend: isDashboard ? undefined : "Date",
    legendOffset: 36,
    legendPosition: "middle",
  }}
  axisLeft={{
    orient: "left",
    tickValues: 5,
    tickSize: 3,
    tickPadding: 5,
    tickRotation: 0,
    legend: isDashboard ? undefined : "Amount",
    legendOffset: -40,
    legendPosition: "middle",
  }}
  enableGridX={false}
  enableGridY={false}
  pointSize={8}
  pointColor={{ theme: "background" }}
  pointBorderWidth={2}
  pointBorderColor={{ from: "serieColor" }}
  pointLabelYOffset={-12}
  useMesh={true}
  legends={[
    {
      anchor: "bottom-right",
      direction: "column",
      justify: false,
      translateX: 100,
      translateY: 0,
      itemsSpacing: 0,
      itemDirection: "left-to-right",
      itemWidth: 80,
      itemHeight: 20,
      itemOpacity: 0.75,
      symbolSize: 12,
      symbolShape: "circle",
      symbolBorderColor: "rgba(0, 0, 0, .5)",
      effects: [
        {
          on: "hover",
          style: {
            itemBackground: "rgba(0, 0, 0, .03)",
            itemOpacity: 1,
          },
        },
      ],
    },
  ]}
/>

  );
};

export default LineChart; 