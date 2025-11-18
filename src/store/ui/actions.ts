import { createAction } from 'redux-actions';

import types from './types';

export const updateProgress = createAction(types.UPDATE_PROGRESS);

export const errorToastr = createAction(types.ERROR_TOASTR);

export const setDarkMode = createAction(types.SET_DARK_MODE);
