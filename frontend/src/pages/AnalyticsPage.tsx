import { useState } from "react";
import { Calendar, DollarSign, TrendingUp, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnalytics } from "../hooks/useAnalytics";

const PIE_COLORS = ["#14B8A6", "#3B82F6", "#A855F7", "#F59E0B", "#EF4444", "#10B981"];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#10B981",
  MERCADOPAGO: "#3B82F6",
  TRANSFER: "#F59E0B",
  OTHER: "#94A3B8",
};

type Period = "week" | "month";

function formatCurrency(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

function formatDateLabel(value: string) {
  const d = new Date(value + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getProColor(color: string | null) {
  return color ?? "#64748B";
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading } = useAnalytics(period);

  const summary = data?.summary;
  const revenueByDay = data?.revenueByDay ?? [];
  const appointmentsByDay = data?.appointmentsByDay ?? [];
  const topServices = data?.topServices ?? [];
  const peakHours = data?.peakHours ?? [];
  const topProfessionals = data?.topProfessionals ?? [];
  const maxProCount = topProfessionals[0]?.count ?? 1;
  const revenueByProfessional = data?.revenueByProfessional ?? [];
  const maxProRevenue = revenueByProfessional[0]?.revenue ?? 1;
  const revenueByPaymentMethod = data?.revenueByPaymentMethod ?? [];
  const appointmentsByDayOfWeek = data?.appointmentsByDayOfWeek ?? [];

  const tickInterval = period === "week" ? 0 : Math.ceil(revenueByDay.length / 10) - 1;

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Análisis</h1>
          <p className="text-sm text-slate-500 mt-0.5">Métricas del negocio</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white self-start sm:self-auto">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="TURNOS"
              value={summary?.totalAppointments ?? 0}
              subtitle={`${summary?.completedAppointments ?? 0} completados`}
              icon={<Calendar className="w-5 h-5 text-teal-600" />}
              iconBg="bg-teal-50"
            />
            <KPICard
              label="INGRESOS"
              value={formatCurrency(summary?.totalRevenue ?? 0)}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
            />
            <KPICard
              label="TICKET PROMEDIO"
              value={formatCurrency(summary?.averageTicket ?? 0)}
              icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
              iconBg="bg-violet-50"
            />
            <KPICard
              label="NO ASISTIÓ"
              value={`${summary?.noShowRate ?? 0}%`}
              subtitle={`Cancelados: ${summary?.cancellationRate ?? 0}%`}
              icon={<XCircle className="w-5 h-5 text-red-500" />}
              iconBg="bg-red-50"
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Ingresos por día</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByDay} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                    }
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]}
                    labelFormatter={formatDateLabel}
                    contentStyle={{
                      fontSize: 12,
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#0D9488" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Turnos por día</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={appointmentsByDay} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Turnos"]}
                    labelFormatter={formatDateLabel}
                    contentStyle={{
                      fontSize: 12,
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top services */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Servicios más solicitados</h2>
              {topServices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={topServices}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={32}
                      >
                        {topServices.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{
                          fontSize: 12,
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5 w-full">
                    {topServices.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate flex-1">{s.name}</span>
                        <span className="font-medium text-slate-500 shrink-0">({s.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Peak hours */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Horarios pico</h2>
              {peakHours.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peakHours} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={24}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Turnos"]}
                      contentStyle={{
                        fontSize: 12,
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    />
                    <Bar dataKey="count" fill="#A855F7" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top professionals */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Profesionales con más turnos</h2>
              {topProfessionals.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-4">
                  {topProfessionals.map((pro) => (
                    <div key={pro.id} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                        style={{ backgroundColor: getProColor(pro.color) }}
                      >
                        {pro.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-700 truncate">{pro.name}</span>
                          <span className="text-sm font-semibold text-slate-800 ml-2 shrink-0">
                            {pro.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((pro.count / maxProCount) * 100)}%`,
                              backgroundColor: getProColor(pro.color),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Charts row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment method breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Método de pago</h2>
              {revenueByPaymentMethod.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={revenueByPaymentMethod}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={32}
                      >
                        {revenueByPaymentMethod.map((entry) => (
                          <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] ?? "#94A3B8"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{
                          fontSize: 12,
                          border: "1px solid #E2E8F0",
                          borderRadius: 8,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5 w-full">
                    {revenueByPaymentMethod.map((pm) => (
                      <div key={pm.method} className="flex items-center gap-2 text-xs text-slate-600">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PAYMENT_COLORS[pm.method] ?? "#94A3B8" }}
                        />
                        <span className="truncate flex-1">{pm.label}</span>
                        <span className="font-medium text-slate-500 shrink-0">({pm.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue by professional */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Ingresos por profesional</h2>
              {revenueByProfessional.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-4">
                  {revenueByProfessional.map((pro) => (
                    <div key={pro.id} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                        style={{ backgroundColor: getProColor(pro.color) }}
                      >
                        {pro.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-700 truncate">{pro.name}</span>
                          <span className="text-sm font-semibold text-slate-800 ml-2 shrink-0">
                            {formatCurrency(pro.revenue)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((pro.revenue / maxProRevenue) * 100)}%`,
                              backgroundColor: getProColor(pro.color),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Appointments by day of week */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Actividad por día de semana</h2>
              {appointmentsByDayOfWeek.every((d) => d.count === 0) ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={appointmentsByDayOfWeek} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={24}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Turnos"]}
                      contentStyle={{
                        fontSize: 12,
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    />
                    <Bar dataKey="count" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5 leading-tight">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight break-all">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
