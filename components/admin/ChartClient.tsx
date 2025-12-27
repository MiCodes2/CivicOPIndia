"use client";

import 'chart.js/auto'; // registers charts
import { Line } from 'react-chartjs-2';

export default function ChartClient({ data }: { data: any }) {
  return <Line data={data} />;
}
