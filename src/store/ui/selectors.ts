import type { RootStateInstance } from '../reducer';

export const getProgressStatus = (state: RootStateInstance): boolean => state.ui.progressStatus;

export const getErrorToastr = (state: RootStateInstance): number => state.ui.errorToastr;

export const getIsDarkMode = (state: RootStateInstance): boolean => state.ui.isDarkMode;
