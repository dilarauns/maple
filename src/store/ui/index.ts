import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

export interface UiState {
  progressStatus: boolean;
  errorToastr: number;
  isDarkMode: boolean;
}

const initialState: UiState = {
  progressStatus: false,
  errorToastr: 0,
  isDarkMode: false,
};

const UiReducer = {
  [types.UPDATE_PROGRESS]: (
    state: UiState,
    { payload = true }: Action<typeof state.progressStatus>
  ) => ({
    ...state,
    progressStatus: payload,
  }),

  [types.ERROR_TOASTR]: (state: UiState, { payload }: Action<typeof state.errorToastr>) => ({
    ...state,
    errorToastr: payload,
  }),
  
  [types.SET_DARK_MODE]: (state: UiState, { payload }: Action<boolean>) => ({
    ...state,
    isDarkMode: payload,
  }),
};

export default handleActions(UiReducer as any, initialState) as any;
