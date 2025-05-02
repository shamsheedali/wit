"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getUserGrowth } from "@/lib/api/admin";

const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function UserGrowthChart() {
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("90d");
  const [chartData, setChartData] = React.useState<{ date: string; users: number }[]>([]);

  React.useEffect(() => {
    const fetchGrowthData = async () => {
      let period: "daily" | "weekly" | "monthly" = "daily";
      if (timeRange === "30d" || timeRange === "90d") period = "daily";
      if (timeRange === "7d") period = "daily"; // Could be weekly if preferred

      const data = await getUserGrowth(period);
      const filteredData = data
        .map((item: { date: string; count: number }) => ({
          date: item.date,
          users: item.count,
        }))
        .filter((item: { date: string }) => {
          const date = new Date(item.date);
          const referenceDate = new Date(); // Current date
          let daysToSubtract = 90;
          if (timeRange === "30d") daysToSubtract = 30;
          else if (timeRange === "7d") daysToSubtract = 7;
          const startDate = new Date(referenceDate);
          startDate.setDate(startDate.getDate() - daysToSubtract);
          return date >= startDate;
        });
      setChartData(filteredData);
    };
    fetchGrowthData();
  }, [timeRange]);

  const handleTimeRangeChange = (value: string) => {
    if (value === "7d" || value === "30d" || value === "90d") {
      setTimeRange(value);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>User Growth Chart</CardTitle>
          <CardDescription>Showing new users over time</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select time range">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              stroke="var(--color-users)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}