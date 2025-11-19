import type { RootStateInstance } from '../reducer';
import type { ScheduleInstance } from '../../models/schedule';

export const getSchedule = (state: RootStateInstance): ScheduleInstance => state.schedule.schedule; 

export const getHasChanges = (state: RootStateInstance): boolean => state.schedule.hasChanges;
