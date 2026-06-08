'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSales } from '@/hooks/useSales';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ShoppingBag } from 'lucide-react';
import { formatCurrencyUsd } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DayData {
  dayNum: number;
  salesCount: number;
  totalUsd: number;
  isClosed?: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { sales, isLoading } = useSales();
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Por defecto el mes actual de forma dinámica
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Días del mes actual
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes...
    const emptyDaysCount = (firstDayIndex === 0 ? 7 : firstDayIndex) - 1;

    const days: (DayData | null)[] = [];

    // Células vacías del mes anterior para alinear la cuadrícula
    for (let i = 0; i < emptyDaysCount; i++) {
      days.push(null);
    }

    // Agrupar ventas reales por día
    const realSalesMap: Record<number, { count: number; total: number }> = {};
    sales.forEach((sale) => {
      const saleDate = new Date(sale.created_at);
      if (saleDate.getFullYear() === year && saleDate.getMonth() === month) {
        const d = saleDate.getDate();
        if (!realSalesMap[d]) realSalesMap[d] = { count: 0, total: 0 };
        realSalesMap[d].count += 1;
        realSalesMap[d].total += sale.total_usd;
      }
    });

    for (let d = 1; d <= totalDays; d++) {
      if (realSalesMap[d]) {
        days.push({
          dayNum: d,
          salesCount: realSalesMap[d].count,
          totalUsd: realSalesMap[d].total,
          isClosed: false,
        });
      } else {
        // Por defecto, domingos cerrados si no hay ventas registradas
        const dayOfWeek = new Date(year, month, d).getDay();
        days.push({
          dayNum: d,
          salesCount: 0,
          totalUsd: 0,
          isClosed: dayOfWeek === 0, // Cerrado los domingos
        });
      }
    }

    return days;
  }, [sales, year, month]);

  // Calcular el máximo de ventas del mes para la escala dinámica de colores
  const maxSalesInMonth = useMemo(() => {
    const salesCounts = daysInMonth
      .filter((day): day is DayData => day !== null)
      .map((day) => day.salesCount);
    return Math.max(...salesCounts, 1); // Mínimo 1 para evitar división por cero
  }, [daysInMonth]);

  // Paleta de colores dinámica basada en el porcentaje de ventas del mes
  const getCellBgColor = (salesCount: number, isClosed?: boolean) => {
    if (isClosed) return 'bg-white';
    if (salesCount === 0) return 'bg-white';
    
    // Calcular el porcentaje de ventas respecto al máximo del mes
    const percentage = (salesCount / maxSalesInMonth) * 100;
    
    // Escala dinámica de 5 niveles basada en porcentaje
    if (percentage >= 80) return 'bg-[#B06E6B]'; // 80-100%: Muy oscuro (máximo volumen)
    if (percentage >= 60) return 'bg-[#C58885]'; // 60-79%: Oscuro
    if (percentage >= 40) return 'bg-[#E3B9B6]'; // 40-59%: Medio
    if (percentage >= 20) return 'bg-[#F2DCDA]'; // 20-39%: Claro
    return 'bg-[#FAE8E6]';                       // 1-19%: Muy claro
  };

  const getCellTextColor = (salesCount: number, isClosed?: boolean) => {
    if (isClosed) return 'text-slate-400';
    if (salesCount === 0) return 'text-slate-500';
    return 'text-[#5C2320]'; // Usar color chocolate/marrón de la paleta principal
  };

  const getMonthName = (date: Date) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
    setSelectedDay(null); // Cerrar detalle al cambiar de mes
  };

  // Obtener ventas del día seleccionado
  const selectedDaySales = useMemo(() => {
    if (selectedDay === null) return [];
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      return (
        saleDate.getFullYear() === year &&
        saleDate.getMonth() === month &&
        saleDate.getDate() === selectedDay
      );
    });
  }, [sales, year, month, selectedDay]);

  // Calcular el total monetario del día seleccionado
  const selectedDayTotalUsd = useMemo(() => {
    return selectedDaySales.reduce((sum, sale) => sum + sale.total_usd, 0);
  }, [selectedDaySales]);

  // Obtener los productos top vendidos del día seleccionado de forma dinámica
  const selectedDayTopProducts = useMemo(() => {
    const productTotals: Record<string, number> = {};
    
    selectedDaySales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const name = item.product?.name || 'Producto Desconocido';
        const subtotal = item.subtotal || (item.quantity * item.unit_price);
        productTotals[name] = (productTotals[name] || 0) + subtotal;
      });
    });

    return Object.entries(productTotals)
      .map(([name, totalUsd]) => ({ name, totalUsd }))
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 3);
  }, [selectedDaySales]);

  const handleDayClick = (dayNum: number, isClosed?: boolean, salesCount?: number) => {
    if (isClosed && (!salesCount || salesCount === 0)) return;
    setSelectedDay(dayNum);
  };

  const formatDetailDate = (day: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[month]} ${day}, ${year}`;
  };

  return (
    <MainLayout title="Calendario de Ventas">
      <div className="max-w-4xl mx-auto space-y-6 relative pb-20">

        {/* Selector de fecha estilo píldora como en la imagen */}
        <div className="flex items-center gap-2 bg-[#FAF5F3] border border-[#EADED9] p-1.5 rounded-full w-fit">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-1.5 rounded-full hover:bg-white text-[#7A2F2B] active:scale-95 transition-all"
            title="Mes Anterior"
          >
            <ChevronLeft size={16} className="stroke-[2.5]" />
          </button>
          
          <span className="bg-[#5C2320] text-white px-5 py-2 rounded-full text-xs font-black tracking-wider shadow-sm select-none">
            {getMonthName(currentMonth)}
          </span>

          <button 
            onClick={() => navigateMonth('next')}
            className="p-1.5 rounded-full hover:bg-white text-[#7A2F2B] active:scale-95 transition-all"
            title="Mes Siguiente"
          >
            <ChevronRight size={16} className="stroke-[2.5]" />
          </button>

          <div className="h-6 w-[1px] bg-[#EADED9] mx-1"></div>

          <button className="p-2 rounded-full text-[#7A2F2B] hover:bg-white transition-all">
            <CalendarIcon size={16} className="stroke-[2]" />
          </button>
        </div>

        {/* Cuadrícula del Calendario */}
        <div className="border border-[#EADED9] rounded-3xl overflow-hidden bg-white shadow-sm">
          {/* Cabecera de días de la semana con fondo crema muy suave */}
          <div className="grid grid-cols-7 text-center py-4 border-b border-[#EADED9] bg-[#FAF8F6]">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div 
                key={day} 
                className={`text-xs font-black tracking-wide ${day === 'Sáb' || day === 'Dom' ? 'text-[#7A2F2B]' : 'text-slate-500'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días en Cuadrícula Continua */}
          <div className="grid grid-cols-7 bg-[#EADED9] gap-[1px]">
            {daysInMonth.map((day, index) => {
              if (day === null) {
                return (
                  <div 
                    key={`empty-${index}`} 
                    className="bg-white min-h-[95px] md:min-h-[110px]"
                  />
                );
              }

              const hasSales = day.salesCount > 0;
              const isSelectedDay = selectedDay === day.dayNum;

              return (
                <div
                  key={`day-${day.dayNum}`}
                  onClick={() => handleDayClick(day.dayNum, day.isClosed, day.salesCount)}
                  className={`relative flex flex-col justify-between p-1.5 min-h-[95px] md:min-h-[110px] transition-all select-none group cursor-pointer
                    ${getCellBgColor(day.salesCount, day.isClosed)}
                    ${isSelectedDay ? 'ring-2 ring-inset ring-[#5C2320] z-10 font-bold bg-[#A3605D] text-white shadow-md' : 'hover:bg-slate-50/50'}
                  `}
                >
                  {/* Número del día */}
                  <span className={`text-[11px] font-semibold leading-none ${isSelectedDay ? 'text-white' : getCellTextColor(day.salesCount, day.isClosed)}`}>
                    {day.dayNum}
                  </span>

                  {/* Estado central / Montos */}
                  <div className="flex flex-col items-end justify-end flex-1 py-1 text-right">
                    {day.isClosed && !hasSales ? (
                      <span className={`text-[10px] font-bold italic ${isSelectedDay ? 'text-white/80' : 'text-slate-400'}`}>
                        Cerrado
                      </span>
                    ) : hasSales ? (
                      <div className="space-y-0.5">
                        <span className={`block text-xs md:text-sm font-semibold tracking-tight ${isSelectedDay ? 'text-white' : 'text-[#5C2320]'}`}>
                          ${day.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className={`block text-[9px] md:text-[10px] tracking-tight ${isSelectedDay ? 'text-white/80' : 'text-white/80'}`}>
                          {day.salesCount} {day.salesCount === 1 ? 'venta' : 'ventas'}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-[10px] italic ${isSelectedDay ? 'text-white/80' : 'text-slate-400'}`}>
                        Sin ventas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda inferior */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-bold mt-2">
          <span className="text-slate-500 font-medium">Volumen de ventas:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-white border border-[#EADED9] rounded-sm" title="0 ventas"></div>
            <div className="w-4 h-4 bg-[#F2DCDA] rounded-sm" title="Bajo"></div>
            <div className="w-4 h-4 bg-[#E3B9B6] rounded-sm" title="Medio"></div>
            <div className="w-4 h-4 bg-[#C58885] rounded-sm" title="Alto"></div>
            <div className="w-4 h-4 bg-[#B06E6B] rounded-sm" title="Muy Alto"></div>
          </div>
          <span className="text-slate-400 font-medium text-[11px] ml-1">Alto</span>
        </div>

        {/* Pestaña / Bottom Sheet de Detalle de Ventas */}
        {selectedDay !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setSelectedDay(null)}>
            <div 
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl border-t border-[#EADED9] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra indicadora superior */}
              <div className="w-12 h-1 bg-[#E0D5D1] rounded-full mx-auto mb-5"></div>

              {/* Botón Cerrar */}
              <button 
                onClick={() => setSelectedDay(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#F5F2F0] text-slate-500 hover:text-slate-800 transition-colors"
                title="Cerrar Detalle"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>

              {/* Título y Subtítulo */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-[#5C2320] tracking-tight">
                  Detalle de Ventas
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  {formatDetailDate(selectedDay)}
                </p>
              </div>

              {/* Tarjeta: Total del Día */}
              <div className="border border-[#F2ECE9] bg-[#FAF8F6] p-4 rounded-2xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100/30">
                    <ShoppingBag size={20} className="stroke-[1.75]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">
                      Total del Día
                    </h4>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      {selectedDaySales.length} {selectedDaySales.length === 1 ? 'transacción' : 'transacciones'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#5C2320] tracking-tight">
                    {formatCurrencyUsd(selectedDayTotalUsd)}
                  </span>
                </div>
              </div>

              {/* Tarjeta: Top Productos */}
              <div className="border border-[#F2ECE9] p-4 rounded-2xl space-y-3.5 bg-white">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#7A2F2B]">
                  Top Productos
                </h4>

                {selectedDayTopProducts.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic py-2">
                    Sin detalles de productos registrados
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDayTopProducts.map((prod) => (
                      <div key={prod.name} className="flex justify-between items-center text-xs font-semibold text-slate-700 py-1 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                        <span className="text-slate-700 font-bold truncate pr-4">{prod.name}</span>
                        <span className="text-slate-800 font-black flex-shrink-0">
                          {formatCurrencyUsd(prod.totalUsd)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de Acción Principal */}
              <button 
                onClick={() => router.push('/sales-history')}
                className="w-full bg-[#5C2320] hover:bg-[#7A2F2B] active:scale-[0.98] transition-all text-white text-sm font-black py-4 rounded-2xl mt-6 shadow-md shadow-[#5C2320]/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                Ver todas las transacciones
              </button>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
