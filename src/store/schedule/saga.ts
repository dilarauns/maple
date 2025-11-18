/* eslint-disable @typescript-eslint/no-unused-expressions */
import type { Action } from 'redux-actions';

import { put, takeEvery, select } from 'redux-saga/effects';

import types from './types';
import Logger from '../../utils/logger';
import * as actions from './actions';
import { updateProgress } from '../ui/actions';

import type { Callbacks } from '../../utils/types';
import { scheduleReponse } from '../../constants/api';
import Storage from '../../utils/storage';
import type { RootStateInstance } from '../reducer';
import type { ScheduleInstance } from '../../models/schedule';

const SCHEDULE_STORAGE_KEY = 'schedule_changes';

function* asyncFetchSchedule({
  payload: { onSuccess, onError } = {},
}: Action<
  Callbacks
>) {
  yield put(updateProgress());
  try {
    // Check if there are saved changes in localStorage
    const savedSchedule = Storage.get(SCHEDULE_STORAGE_KEY);
    
    if (savedSchedule && savedSchedule.scheduleId) {
      // Load from localStorage if exists
      yield put(actions.loadScheduleFromStorage(savedSchedule));
    } else {
      // Otherwise load default response
      const response = scheduleReponse;
      yield put(actions.fetchScheduleSuccess(response.data));
    }

    onSuccess && onSuccess(savedSchedule || scheduleReponse);
  } catch (err) {
    Logger.error(err);
    onError && onError(err);

    yield put(actions.fetchScheduleFailed());
  } finally {
    yield put(updateProgress(false));
  }
}

function* asyncUpdateAssignmentDate({
  payload,
}: Action<
  { assignmentId: string; newDate: string } & Callbacks
>) {
  const { assignmentId, newDate, onSuccess, onError } = payload || {};
  yield put(updateProgress());
  try {
    // In a real scenario, you would make an API call here
    // const response: AxiosResponse = yield call(api.updateAssignmentDate, { assignmentId, newDate });
    
    // For now, we update the Redux state directly
    yield put(actions.updateAssignmentDateSuccess({ assignmentId, newDate }));

    onSuccess && onSuccess({ assignmentId, newDate });
  } catch (err) {
    Logger.error(err);
    onError && onError(err);

    yield put(actions.updateAssignmentDateFailed());
  } finally {
    yield put(updateProgress(false));
  }
}

function* asyncSaveSchedule({
  payload: { onSuccess, onError } = {},
}: Action<Callbacks>) {
  yield put(updateProgress());
  try {
    // Get current schedule from state
    const state: RootStateInstance = yield select();
    const schedule: ScheduleInstance = state.schedule.schedule;

    // Save to localStorage
    Storage.set(SCHEDULE_STORAGE_KEY, schedule);

    yield put(actions.saveScheduleSuccess());

    onSuccess && onSuccess();
  } catch (err) {
    Logger.error(err);
    onError && onError(err);
  } finally {
    yield put(updateProgress(false));
  }
}

const scheduleSagas = [
  takeEvery(types.FETCH_SCHEDULE, asyncFetchSchedule),
  takeEvery(types.UPDATE_ASSIGNMENT_DATE, asyncUpdateAssignmentDate),
  takeEvery(types.SAVE_SCHEDULE, asyncSaveSchedule),
];

export default scheduleSagas;
