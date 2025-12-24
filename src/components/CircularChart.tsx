import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { LucideIcon } from "lucide-react";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface CircularChartProps {
  title: string;
  data: ChartData[];
  icon: LucideIcon;
  gradient: string;
  total?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {payload[0].value.toLocaleString()} جنيه
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CircularChart = ({
  title,
  data,
  icon: Icon,
  gradient,
  total,
  description,
}: CircularChartProps) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border/40 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-1 ${gradient}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className={`p-2 rounded-lg ${gradient}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            {title}
          </CardTitle>
          {total && (
            <div className="text-right">
              <p className="text-xs text-gray-500">الإجمالي</p>
              <p className="text-lg font-bold text-gray-800">{total}</p>
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Center display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white rounded-full p-4 shadow-lg border-2 border-gray-100">
            <p className="text-xl font-bold text-gray-800">
              {totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">جنيه</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};