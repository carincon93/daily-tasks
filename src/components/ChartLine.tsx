import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/lib/types";
import { getCurrentDate } from "@/store/index.store";
import { useState } from "react";

export const description = "A multiple line chart";

interface ChartDataItem {
  date: string;
  [key: string]: number | string;
}

interface ChartAreaInteractiveProps {
  chartData: ChartDataItem[];
  categories: Category[];
}

type TimeRange = "90d" | "30d" | "7d";

export function ChartLineMultiple({
  chartData,
  categories,
}: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const { currentDate } = getCurrentDate();

  const chartConfig = categories.reduce((config, category, index) => {
    return {
      ...config,
      [category.name]: {
        label: category.name,
        color: `var(--chart-${index + 1})`,
      },
    };
  }, {}) satisfies ChartConfig;

  const filteredData: ChartDataItem[] = chartData.filter((item) => {
    const date = new Date(item.date);
    const endDate = new Date(currentDate);
    let daysToSubtract = 7;

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToSubtract);

    return date >= startDate && date <= endDate;
  });

  filteredData.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <Select
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as TimeRange)}
      >
        <SelectTrigger
          className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex bg-white"
          aria-label="Select a value"
        >
          <SelectValue placeholder="Last 3 months" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="90d" className="rounded-lg">
            Last 3 months
          </SelectItem>
          <SelectItem value="30d" className="rounded-lg">
            Last 30 days
          </SelectItem>
          <SelectItem value="7d" className="rounded-lg">
            Last 7 days
          </SelectItem>
        </SelectContent>
      </Select>

      <ChartContainer
        config={chartConfig}
        className="xl:h-[370px] 2xl:h-[500px] 2xl:translate-x-1/6"
      >
        <LineChart
          accessibilityLayer
          data={filteredData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            tickFormatter={(value: string) => {
              const date = new Date(value);
              date.setDate(date.getDate() + 1);

              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

          {categories.map((category) => (
            <Line
              key={category.id}
              dataKey={category.name}
              type="monotone"
              stroke={category.color}
              strokeWidth={2}
              dot={false}
            />
          ))}

          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </>
  );
}
