import { createAction } from 'redux-actions';

import types from './types';

export const fetchSchedule = createAction(types.FETCH_SCHEDULE);
export const fetchScheduleSuccess = createAction(types.FETCH_SCHEDULE_SUCCESS);
export const fetchScheduleFailed = createAction(types.FETCH_SCHEDULE_FAILED);

export const updateAssignmentDate = createAction(types.UPDATE_ASSIGNMENT_DATE);
export const updateAssignmentDateSuccess = createAction(types.UPDATE_ASSIGNMENT_DATE_SUCCESS);
export const updateAssignmentDateFailed = createAction(types.UPDATE_ASSIGNMENT_DATE_FAILED);

export const saveSchedule = createAction(types.SAVE_SCHEDULE);
export const saveScheduleSuccess = createAction(types.SAVE_SCHEDULE_SUCCESS);
export const loadScheduleFromStorage = createAction(types.LOAD_SCHEDULE_FROM_STORAGE);
