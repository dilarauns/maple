/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput } from "@fullcalendar/core/index.js";
import "../profileCalendar.scss";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );

  const generateStaffBasedCalendar = () => {
    const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
    
    if (!selectedStaff) {
      setEvents([]);
      return;
    }

    const works: any[] = [];

    // Add shift assignments
    schedule?.assignments
      ?.filter(a => a.staffId === selectedStaffId)
      .forEach((assignment) => {
        const shift = schedule?.shifts?.find(s => s.id === assignment.shiftId);
        
        if (shift) {
          const shiftIndex = schedule?.shifts?.findIndex(s => s.id === shift.id) ?? 0;
          
          works.push({
            title: shift.name,
            date: dayjs(assignment.shiftStart).format("YYYY-MM-DD"),
            className: `shift-color-${shiftIndex % 2}`,
            extendedProps: {
              staffName: selectedStaff.name,
              shiftName: shift.name,
              shiftStart: assignment.shiftStart,
              shiftEnd: assignment.shiftEnd,
              isPair: false,
            },
          });
        }
      });

    if (selectedStaff.pairList && selectedStaff.pairList.length > 0) {
      selectedStaff.pairList.forEach((pair) => {
        const startDate = dayjs(pair.startDate, "DD.MM.YYYY", true);
        const endDate = dayjs(pair.endDate, "DD.MM.YYYY", true);
        const pairStaff = schedule?.staffs?.find(s => s.id === pair.staffId);
        
        if (pairStaff && startDate.isValid() && endDate.isValid()) {
          let currentDate = startDate;
          
          while (currentDate.isSameOrBefore(endDate, 'day')) {
            works.push({
              title: `Eş: ${pairStaff.name}`,
              date: currentDate.format("YYYY-MM-DD"),
              className: 'pair-event',
              extendedProps: {
                staffName: selectedStaff.name,
                pairName: pairStaff.name,
                isPair: true,
              },
            });
            
            currentDate = currentDate.add(1, 'day');
          }
        }
      });
    }

    setEvents(works);
  };

  useEffect(() => {
    const firstStaffId = schedule?.staffs?.[0]?.id;
    if (firstStaffId) {
      setSelectedStaffId(firstStaffId);
    }
  }, [schedule]);

  useEffect(() => {
    if (selectedStaffId) {
      generateStaffBasedCalendar();
    }
  }, [selectedStaffId]);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    
    if (event.extendedProps.isPair) {
      // Pair event clicked
      setSelectedEvent({
        title: event.title,
        staffName: event.extendedProps.staffName,
        date: dayjs(event.start).format("DD MMMM YYYY"),
        pairName: event.extendedProps.pairName,
        isPair: true,
      });
    } else {
      // Shift event clicked
      setSelectedEvent({
        title: event.title,
        staffName: event.extendedProps.staffName,
        shiftName: event.extendedProps.shiftName,
        date: dayjs(event.start).format("DD MMMM YYYY"),
        startTime: dayjs(event.extendedProps.shiftStart).format("HH:mm"),
        endTime: dayjs(event.extendedProps.shiftEnd).format("HH:mm"),
        isPair: false,
      });
    }
    
    setShowEventModal(true);
  };

  const closeModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any) => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`staff ${
                staff.id === selectedStaffId ? "active" : ""
              }`}
            >
              <span>{staff.name}</span>
            </div>
          ))}
        </div>
        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={[dayGridPlugin, interactionPlugin]}
          contentHeight={400}
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={true}
          showNonCurrentDates={true}
          eventClick={handleEventClick}
          eventContent={(eventInfo: any) => (
            <div className="event-content">
              <p>{eventInfo.event.title}</p>
            </div>
          )}
          datesSet={(info: any) => {
            const prevButton = document.querySelector(".fc-prev-button") as HTMLButtonElement;
            const nextButton = document.querySelector(".fc-next-button") as HTMLButtonElement;

            if (calendarRef?.current?.getApi().getDate() && 
                !dayjs(schedule?.scheduleStartDate).isSame(calendarRef?.current?.getApi().getDate())) {
              setInitialDate(calendarRef?.current?.getApi().getDate());
            }

            const startDiff = dayjs(info.start).utc()
              .diff(dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(), "days");
            const endDiff = dayjs(schedule.scheduleEndDate).diff(info.end, "days");
            
            prevButton.disabled = startDiff < 0 && startDiff > -35;
            nextButton.disabled = endDiff < 0 && endDiff > -32;
          }}
          dayCellClassNames={(arg: any) => {
            const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
            const cellDate = dayjs(arg.date).format("DD.MM.YYYY");
            
            if (selectedStaff?.offDays?.includes(cellDate)) {
              return "off-day-cell";
            }
            
            return "";
          }}
        />
      </div>
      
      {/* Event Detay Modal */}
      {showEventModal && selectedEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vardiya Detayı</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Personel:</span>
                <span className="value">{selectedEvent.staffName}</span>
              </div>
              {selectedEvent.isPair ? (
                <>
                  <div className="detail-row">
                    <span className="label">Eş:</span>
                    <span className="value">{selectedEvent.pairName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tarih:</span>
                    <span className="value">{selectedEvent.date}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-row">
                    <span className="label">Vardiya:</span>
                    <span className="value">{selectedEvent.shiftName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tarih:</span>
                    <span className="value">{selectedEvent.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Saat:</span>
                    <span className="value">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarContainer;
