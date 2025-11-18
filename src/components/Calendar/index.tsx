/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput, EventDropArg } from "@fullcalendar/core/index.js";
import "../profileCalendar.scss";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateAssignmentDate, saveSchedule } from "../../store/schedule/actions";
import { getHasChanges } from "../../store/schedule/selector";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

const STAFF_COLORS = [
  '#fac907d7', 
  '#76940be3', 
  '#0f9ebed8', 
  '#bb8fcee8', 
  '#e74d3ce7', 
  '#3498DB', 
  '#832b67d2', 
  '#f39d12d3', 
  '#30746fd5', 
  '#52b788e5', 
  '#e63947e0', 
  '#1c3d52d5', 
  '#80522de0', 
  '#602a9dd3', 
  '#973219ff', 
  '#8E44AD', 
  '#7a2020d8', 
  '#125041d8', 
  '#064135cb', 
  '#164c69da', 
];


const getStaffColor = (index: number): string => {
  return STAFF_COLORS[index % STAFF_COLORS.length];
};

const getShiftColor = (shiftName: string): string => {
  const lowerName = shiftName.toLowerCase();
  if (lowerName.includes('morning') || lowerName.includes('sabah') || lowerName.includes('gündüz') || lowerName.includes('gunduz')) {
    return '#f77206d8'; 
  } else {
    return '#083350da'; 
  }
};

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const dispatch = useAppDispatch();
  const hasChanges = useAppSelector(getHasChanges);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
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

    schedule?.assignments
      ?.filter(a => a.staffId === selectedStaffId)
      .forEach((assignment) => {
        const shift = schedule?.shifts?.find(s => s.id === assignment.shiftId);
        
        if (shift) {
          const shiftColor = getShiftColor(shift.name);
          
          works.push({
            id: assignment.id,
            title: shift.name,
            date: dayjs(assignment.shiftStart).format("YYYY-MM-DD"),
            className: `staff-event`,
            backgroundColor: shiftColor,
            borderColor: shiftColor,
            extendedProps: {
              assignmentId: assignment.id,
              staffName: selectedStaff.name,
              shiftName: shift.name,
              shiftStart: assignment.shiftStart,
              shiftEnd: assignment.shiftEnd,
              isPair: false,
            },
          });
        }
      });

    // Add pair events to calendar (for visual display on calendar)
    if (selectedStaff.pairList && selectedStaff.pairList.length > 0) {
      selectedStaff.pairList.forEach((pair) => {
        const startDate = dayjs(pair.startDate, "DD.MM.YYYY", true);
        const endDate = dayjs(pair.endDate, "DD.MM.YYYY", true);
        const pairStaff = schedule?.staffs?.find(s => s.id === pair.staffId);
        
        if (pairStaff && startDate.isValid() && endDate.isValid()) {
          const pairStaffIndex = schedule?.staffs?.findIndex(s => s.id === pair.staffId) ?? 0;
          const pairColor = getStaffColor(pairStaffIndex);
          let currentDate = startDate;
          
          while (currentDate.isSameOrBefore(endDate, 'day')) {
            works.push({
              date: currentDate.format("YYYY-MM-DD"),
              className: 'pair-event',
              backgroundColor: pairColor,
              borderColor: pairColor,
              extendedProps: {
                staffName: selectedStaff.name,
                pairName: pairStaff.name,
                pairColor: pairColor,
                startDate: pair.startDate,
                endDate: pair.endDate,
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

  useEffect(() => {
    if (hasChanges) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasChanges]);

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    
    const eventData = event.extendedProps.isPair ? {
      title: event.title,
      staffName: event.extendedProps.staffName,
      date: dayjs(event.start).format("DD MMMM YYYY"),
      pairName: event.extendedProps.pairName,
      isPair: true,
    } : {
      title: event.title,
      staffName: event.extendedProps.staffName,
      shiftName: event.extendedProps.shiftName,
      date: dayjs(event.start).format("DD MMMM YYYY"),
      startTime: dayjs(event.extendedProps.shiftStart).format("HH:mm"),
      endTime: dayjs(event.extendedProps.shiftEnd).format("HH:mm"),
      isPair: false,
    };
    
    // Modal için
    setModalEvent(eventData);
    setShowEventModal(true);
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    
    // Only allow dragging shift events not pair events
    if (event.extendedProps.isPair) {
      dropInfo.revert();
      return;
    }

    const assignmentId = event.extendedProps.assignmentId;
    const newDate = dayjs(event.start).format("DD.MM.YYYY");
    
    // Check if the new date is an off day for the selected staff
    const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
    if (selectedStaff?.offDays?.includes(newDate)) {
      alert(`${newDate} date is an off day for ${selectedStaff.name}. Shift assignments cannot be made on this day.`);
      dropInfo.revert();
      return;
    }

    if (assignmentId && newDate) {
      dispatch(updateAssignmentDate({
        assignmentId,
        newDate: dayjs(event.start).format("YYYY-MM-DD"),
        onSuccess: () => {
          console.log(`Assignment ${assignmentId} successfully moved to ${newDate}`);
        },
        onError: () => {
          console.error(`Failed to update assignment ${assignmentId}`);
          dropInfo.revert();
        },
      }) as any);
    }
  };

  const closeModal = () => {
    setShowEventModal(false);
    setModalEvent(null);
  };

  const handleSaveChanges = () => {
    dispatch(saveSchedule({
      onSuccess: () => {
        console.log('Değişiklikler başarıyla kaydedildi');
      },
      onError: () => {
        console.error('Değişiklikler kaydedilemedi');
      },
    }) as any);
  };

  return (
    <div className="calendar-section">
      {showToast && (
        <div className="toast-notification">
          You have unsaved changes
        </div>
      )}
      <div className="calendar-wrapper">
        <div className="calendar-main">
          <div className="staff-list">
            {schedule?.staffs?.map((staff: any, index: number) => {
              const staffColor = getStaffColor(index);
              return (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`staff ${
                    staff.id === selectedStaffId ? "active" : ""
                  }`}
                  style={{
                    backgroundColor: staff.id === selectedStaffId ? staffColor : '#ffffff',
                    borderColor: staffColor,
                    color: staff.id === selectedStaffId ? '#ffffff' : staffColor
                  }}
                >
                  <span>{staff.name}</span>
                </div>
              );
            })}
          </div>
          <FullCalendar
            ref={calendarRef}
            locale={auth.language}
            plugins={[dayGridPlugin, interactionPlugin]}
            height={600}
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
            eventDrop={handleEventDrop}
            headerToolbar={{
              left: '',
              center: 'title',
              right: hasChanges ? 'prev,next,today,saveButton' : 'prev,next,today'
            }}
            customButtons={{
              saveButton: {
                text: 'Save',
                click: handleSaveChanges,
                hint: 'Save changes',
              }
            }}
            buttonText={{
              today: 'Today'
            }}
            eventContent={(eventInfo: any) => (
              <div className="event-content">
                <p>{eventInfo.event.title}</p>
              </div>
            )}
            datesSet={() => {
              if (calendarRef?.current?.getApi().getDate() && 
                  !dayjs(schedule?.scheduleStartDate).isSame(calendarRef?.current?.getApi().getDate())) {
                setInitialDate(calendarRef?.current?.getApi().getDate());
              }
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
        
        <div className="staff-info-panel">
          <h3> Shift Information</h3>
          
          <div className="shift-blocks">
            {/* Pair bilgileri - tekil olarak */}
            {schedule?.staffs?.find(s => s.id === selectedStaffId)?.pairList?.map((pair: any, index: number) => {
              const pairStaff = schedule?.staffs?.find(s => s.id === pair.staffId);
              const pairStaffIndex = schedule?.staffs?.findIndex(s => s.id === pair.staffId) ?? 0;
              const pairColor = getStaffColor(pairStaffIndex);
              
              return pairStaff ? (
                <div 
                  key={`pair-block-${index}`} 
                  className="shift-block pair"
                  style={{ 
                    backgroundColor: pairColor,
                    borderLeft: `4px solid ${pairColor}` 
                  }}
                >
                  <div className="detail-row">
                    <span className="label">Shift Pair:</span>
                    <span className="value">{pairStaff.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Start:</span>
                    <span className="value">{pair.startDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">End:</span>
                    <span className="value">{pair.endDate}</span>
                  </div>
                </div>
              ) : null;
            })}
            
            {/* Shift assignments */}
            {events.filter(e => !e.extendedProps?.isPair).length > 0 ? (
              events.filter(e => !e.extendedProps?.isPair).map((event: any, index: number) => (
                <div 
                  key={event.id || `shift-${index}`} 
                  className={`shift-block ${
                    event.extendedProps?.shiftName?.toLowerCase().includes('morning') || 
                    event.extendedProps?.shiftName?.toLowerCase().includes('sabah') || 
                    event.extendedProps?.shiftName?.toLowerCase().includes('gündüz') || 
                    event.extendedProps?.shiftName?.toLowerCase().includes('gunduz') 
                      ? 'morning' 
                      : 'night'
                  }`}
                >
                  <div className="detail-row">
                    <span className="label">Shift:</span>
                    <span className="value">{event.extendedProps?.shiftName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{dayjs(event.date).format("DD MMMM YYYY")}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">
                      {dayjs(event.extendedProps?.shiftStart).format("HH:mm")} - {dayjs(event.extendedProps?.shiftEnd).format("HH:mm")}
                    </span>
                  </div>
                </div>
              ))
            ) : null}
            
            {events.length === 0 && (!schedule?.staffs?.find(s => s.id === selectedStaffId)?.pairList || schedule?.staffs?.find(s => s.id === selectedStaffId)?.pairList?.length === 0) && (
              <div className="info-placeholder">
                No shifts found for this staff member
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Event Detay Modal */}
      {showEventModal && modalEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Shift Details</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Personel:</span>
                <span className="value">{modalEvent.staffName}</span>
              </div>
              {modalEvent.isPair ? (
                <>
                  <div className="detail-row">
                    <span className="label">Shift Pair:</span>
                    <span className="value">{modalEvent.pairName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{modalEvent.date}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-row">
                    <span className="label">Shift:</span>
                    <span className="value">{modalEvent.shiftName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{modalEvent.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="value">{modalEvent.startTime} - {modalEvent.endTime}</span>
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
