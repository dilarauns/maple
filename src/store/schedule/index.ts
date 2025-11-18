/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

import type { ErrorBE } from '../../utils/types';
import type { ScheduleInstance } from '../../models/schedule';

export interface ScheduleState {
  errors: ErrorBE;
  loading: boolean;
  schedule: ScheduleInstance;
  hasChanges: boolean;
}

const initialState: ScheduleState = {
  loading: false,
  errors: {},
  schedule: {} as ScheduleInstance,
  hasChanges: false,
};

const scheduleReducer: any = {
  [types.FETCH_SCHEDULE_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<typeof state.schedule>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: {},
    schedule: payload,
  }),

  [types.FETCH_SCHEDULE_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),

  [types.UPDATE_ASSIGNMENT_DATE_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<{ assignmentId: string; newDate: string }>
  ): ScheduleState => {
    const { assignmentId, newDate } = payload;
    const updatedAssignments = state.schedule.assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        const shift = state.schedule.shifts.find(s => s.id === assignment.shiftId);
        if (!shift) return assignment;
        
        // Calculate new start and end times
        const originalStart = new Date(assignment.shiftStart);
        const newStart = new Date(newDate);
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());
        
        const originalEnd = new Date(assignment.shiftEnd);
        const newEnd = new Date(newDate);
        newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), originalEnd.getSeconds());
        
        // Handle overnight shifts
        if (shift.isEndFollowingDay) {
          newEnd.setDate(newEnd.getDate() + 1);
        }
        
        return {
          ...assignment,
          shiftStart: newStart.toISOString(),
          shiftEnd: newEnd.toISOString(),
          isUpdated: true,
        };
      }
      return assignment;
    });

    return {
      ...state,
      loading: false,
      errors: {},
      hasChanges: true,
      schedule: {
        ...state.schedule,
        assignments: updatedAssignments,
      },
    };
  },

  [types.UPDATE_ASSIGNMENT_DATE_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),

  [types.SAVE_SCHEDULE_SUCCESS]: (
    state: ScheduleState
  ): ScheduleState => ({
    ...state,
    loading: false,
    hasChanges: false,
  }),

  [types.LOAD_SCHEDULE_FROM_STORAGE]: (
    state: ScheduleState,
    { payload }: Action<ScheduleInstance>
  ): ScheduleState => ({
    ...state,
    schedule: payload,
    hasChanges: false,
  }),
};

export default handleActions(scheduleReducer, initialState) as any;
