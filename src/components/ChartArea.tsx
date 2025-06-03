import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import { useState } from "react";
import { getCurrentDate } from "@/store/index.store";
import { Category } from "@/lib/types";

export const description = "An interactive area chart";

interface ChartDataItem {
  date: string;
  [key: string]: string | number;
}

interface ChartAreaInteractiveProps {
  chartData: ChartDataItem[];
  categories: Category[];
}

type TimeRange = "90d" | "30d" | "7d";

export function ChartAreaInteractive({
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
        className="aspect-auto h-[250px] w-full"
      >
        <AreaChart data={filteredData}>
          <defs>
            {categories.map((category) => (
              <linearGradient
                key={category.id}
                id={`fill${category.name}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={`var(--color-${category.name})`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${category.name})`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
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
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value: string) => {
                  const date = new Date(value);
                  date.setDate(date.getDate() + 1);

                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                indicator="dot"
              />
            }
          />
          {categories.map((category) => (
            <Area
              dataKey={category.name}
              type="natural"
              fill={`url(#fill${category.name})`}
              stroke={`var(--color-${category.name})`}
              stackId="a"
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </>
  );
}
