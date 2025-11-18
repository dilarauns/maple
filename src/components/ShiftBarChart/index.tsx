/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ScheduleInstance } from "../../models/schedule";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "../profileCalendar.scss";

dayjs.extend(customParseFormat);

type ShiftBarChartProps = {
  schedule: ScheduleInstance;
};

const ShiftBarChart = ({ schedule }: ShiftBarChartProps) => {
  
  const calculateShiftDuration = (shiftStart: string, shiftEnd: string, isEndFollowingDay: boolean): number => {
    const start = dayjs(shiftStart, "HH:mm");
    let end = dayjs(shiftEnd, "HH:mm");
    
 
    if (isEndFollowingDay || end.isBefore(start)) {
      end = end.add(1, 'day');
    }
    
    const duration = end.diff(start, 'hour', true); 
    return Math.round(duration * 10) / 10; 
  };

  const calculateStaffShiftHours = () => {
    if (!schedule?.assignments || !schedule?.shifts || !schedule?.staffs) {
      return [];
    }

    
    const staffShiftHours: { [key: string]: { morning: number; night: number } } = {};
    
   
    schedule.staffs.forEach(staff => {
      staffShiftHours[staff.id] = { morning: 0, night: 0 };
    });

   
    schedule.assignments.forEach((assignment) => {
      const shift = schedule.shifts.find(s => s.id === assignment.shiftId);
      if (shift) {
        const shiftName = shift.name.toLowerCase();
        const duration = calculateShiftDuration(shift.shiftStart, shift.shiftEnd, shift.isEndFollowingDay);
        
        if (shiftName.includes('morning') ) {
          staffShiftHours[assignment.staffId].morning += duration;
        } else {
          staffShiftHours[assignment.staffId].night += duration;
        }
      }
    });

    const chartData = schedule.staffs
      .map((staff) => ({
        name: staff.name,
        'Morning': Math.round(staffShiftHours[staff.id].morning * 10) / 10,
        'Night': Math.round(staffShiftHours[staff.id].night * 10) / 10
      }))
      .filter(item => item['Morning'] > 0 || item['Night'] > 0);

    return chartData;
  };

  const data = calculateStaffShiftHours();

  if (data.length === 0) {
    return (
      <div className="shift-chart-container">
        <div className="chart-card">
          <h3>Shift Distrubition</h3>
          <p className="no-data">No shift assignments yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-chart-container shift-bar-chart">
      <div className="chart-card">
        <h3>Shift Distribution</h3>
        <div className="chart-axis-labels">
          <span className="axis-label-x">X-Axis: Staff Members</span>
          <span className="axis-label-y">Y-Axis: Total Hours</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: any) => [`${value} hours`, '']} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Morning" fill="#f77206d8" />
            <Bar dataKey="Night" fill="#083350da" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShiftBarChart;
