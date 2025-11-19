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
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateAssignmentDate, saveSchedule } from "../../store/schedule/actions";
import { getHasChanges } from "../../store/schedule/selector";
import { getProgressStatus } from "../../store/ui/selectors";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
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
  const isSaving = useAppSelector(getProgressStatus);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );

  // Filter state
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Check if staff has shifts of specific type
  const staffHasShiftType = (staffId: string, type: string): boolean => {
    if (type === "all") return true;
    
    const staffAssignments = schedule?.assignments?.filter(a => a.staffId === staffId) || [];
    
    return staffAssignments.some((assignment) => {
      const shift = schedule?.shifts?.find(s => s.id === assignment.shiftId);
      if (!shift) return false;
      
      const shiftName = shift.name.toLowerCase();
      if (type === "morning") {
        return shiftName.includes('morning') || shiftName.includes('sabah') || shiftName.includes('gündüz') || shiftName.includes('gunduz');
      } else if (type === "night") {
        return shiftName.includes('night') || shiftName.includes('gece');
      }
      return false;
    });
  };

  // Check if staff has off day in date range
  const staffHasOffDayInRange = (staffId: string): boolean => {
    if (!dateRangeFilter?.start || !dateRangeFilter?.end) return false;
    
    const staff = schedule?.staffs?.find(s => s.id === staffId);
    if (!staff?.offDays) return false;
    
    const startDate = dayjs(dateRangeFilter.start);
    const endDate = dayjs(dateRangeFilter.end);
    
    return staff.offDays.some((offDay: string) => {
      const offDayDate = dayjs(offDay, "DD.MM.YYYY");
      return offDayDate.isSameOrAfter(startDate, 'day') && offDayDate.isSameOrBefore(endDate, 'day');
    });
  };

  const generateStaffBasedCalendar = () => {
    const selectedStaff = schedule?.staffs?.find(s => s.id === selectedStaffId);
    
    if (!selectedStaff) {
      setEvents([]);
      return;
    }

    const works: any[] = [];

    // Apply filters
    let filteredAssignments = schedule?.assignments?.filter(a => a.staffId === selectedStaffId) || [];

    // Shift filter
    if (shiftFilter !== "all") {
      filteredAssignments = filteredAssignments.filter((assignment) => {
        const shift = schedule?.shifts?.find(s => s.id === assignment.shiftId);
        if (!shift) return false;
        
        const shiftName = shift.name.toLowerCase();
        if (shiftFilter === "morning") {
          return shiftName.includes('morning') || shiftName.includes('sabah') || shiftName.includes('gündüz') || shiftName.includes('gunduz');
        } else if (shiftFilter === "night") {
          return shiftName.includes('night') || shiftName.includes('gece');
        }
        return true;
      });
    }

    // Date range filter
    if (dateRangeFilter && dateRangeFilter.start && dateRangeFilter.end) {
      filteredAssignments = filteredAssignments.filter((assignment) => {
        const assignmentDate = dayjs(assignment.shiftStart);
        const startDate = dayjs(dateRangeFilter.start);
        const endDate = dayjs(dateRangeFilter.end);
        return assignmentDate.isSameOrAfter(startDate, 'day') && assignmentDate.isSameOrBefore(endDate, 'day');
      });
    }

    filteredAssignments.forEach((assignment) => {
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
  }, [selectedStaffId, shiftFilter, dateRangeFilter]);

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

  const showToastNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveChanges = () => {
    dispatch(saveSchedule({
      onSuccess: () => {
        showToastNotification('Changes saved successfully! ✓', 'success');
      },
      onError: () => {
        showToastNotification('Failed to save changes', 'error');
      },
    }) as any);
  };

  const handleDateSelect = (date: string, type: 'start' | 'end') => {
    setDateRangeFilter(prev => {
      if (type === 'start') {
        return { start: date, end: prev?.end || '' };
      } else {
        return { start: prev?.start || '', end: date };
      }
    });
  };

  const clearDateRange = () => {
    setDateRangeFilter(null);
    setShowDatePicker(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dayjs(dateStr).format('MMM DD, YYYY');
  };

  return (
    <div className="calendar-section">
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <span className="toast-icon">{toastType === 'success' ? '✓' : '✕'}</span>
          <span className="toast-message">{toastMessage}</span>
        </div>
      )}
      {false && (
        <div className="toast-notification">
          You have unsaved changes
        </div>
      )}
      
      <div className="calendar-with-filters">
        {/* Filter Controls - Left Side */}
        <div className="filter-sidebar">
          <h3 className="filter-title">Filters</h3>
          
          <div className="filter-group">
            <label htmlFor="shift-filter" className="filter-label">
              Shift Type:
            </label>
            <select
              id="shift-filter"
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="filter-input filter-select"
            >
              <option value="all">All Shifts</option>
              <option value="morning">Morning Shifts</option>
              <option value="night">Night Shifts</option>
            </select>
          </div>

          {/* Date Range Filter with Mini Calendar */}
          <div className="filter-group date-range-group">
            <label className="filter-label">
              Date Range:
            </label>
            <div className="date-range-display">
              <button
                className="date-range-toggle"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {dateRangeFilter?.start && dateRangeFilter?.end ? (
                  <span className="date-range-text">
                    {formatDateDisplay(dateRangeFilter.start)} - {formatDateDisplay(dateRangeFilter.end)}
                  </span>
                ) : (
                  <span className="date-range-placeholder">Select dates...</span>
                )}
                <span className="calendar-icon">{showDatePicker ? '▲' : '▼'}</span>
              </button>
              
              {showDatePicker && (
                <div className="mini-calendar-wrapper">
                  <div className="mini-calendar-header">
                    <span className="mini-calendar-title">Select Date Range</span>
                    <button 
                      className="mini-calendar-close"
                      onClick={() => setShowDatePicker(false)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mini-calendar-inputs">
                    <div className="mini-date-input-group">
                      <label htmlFor="start-date">Start Date:</label>
                      <input
                        id="start-date"
                        type="date"
                        value={dateRangeFilter?.start || ''}
                        onChange={(e) => handleDateSelect(e.target.value, 'start')}
                        max={dateRangeFilter?.end || undefined}
                        className="mini-date-input"
                      />
                    </div>
                    
                    <div className="mini-date-input-group">
                      <label htmlFor="end-date">End Date:</label>
                      <input
                        id="end-date"
                        type="date"
                        value={dateRangeFilter?.end || ''}
                        onChange={(e) => handleDateSelect(e.target.value, 'end')}
                        min={dateRangeFilter?.start || undefined}
                        className="mini-date-input"
                      />
                    </div>
                  </div>
                  
                  {dateRangeFilter?.start && dateRangeFilter?.end && (
                    <button 
                      className="clear-date-range-btn"
                      onClick={clearDateRange}
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            className="filter-clear-btn"
            onClick={() => {
              setShiftFilter("all");
              setDateRangeFilter(null);
              setShowDatePicker(false);
            }}
            title="Clear all filters"
          >
            ✕ Clear Filters
          </button>
        </div>

        {/* Calendar - Right Side */}
        <div className="calendar-wrapper">
        <div className="calendar-main">
          <div className="staff-list">
            {schedule?.staffs?.map((staff: any, index: number) => {
              const staffColor = getStaffColor(index);
              const hasShift = staffHasShiftType(staff.id, shiftFilter);
              const isDisabled = !hasShift;
              const hasOffDay = staffHasOffDayInRange(staff.id);
              
              return (
                <div
                  key={staff.id}
                  onClick={() => !isDisabled && setSelectedStaffId(staff.id)}
                  className={`staff ${
                    staff.id === selectedStaffId ? "active" : ""
                  } ${isDisabled ? "disabled" : ""} ${hasOffDay ? "has-off-day" : ""}`}
                  style={{
                    backgroundColor: staff.id === selectedStaffId ? staffColor : (isDisabled ? '#e0e0e0' : '#ffffff'),
                    borderColor: isDisabled ? '#ccc' : staffColor,
                    color: staff.id === selectedStaffId ? '#ffffff' : (isDisabled ? '#999' : staffColor),
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1
                  }}
                >
                  {hasOffDay && <span className="off-day-badge">OFF DAY</span>}
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
                text: isSaving ? '⏳ Saving...' : 'Save',
                click: isSaving ? undefined : handleSaveChanges,
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
    </div>
  );
};

export default CalendarContainer;
