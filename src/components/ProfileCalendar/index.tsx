/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import ProfileCard from "../Profile";
import CalendarContainer from "../Calendar";

import { useSelector } from "react-redux";
import { getAuthUser } from "../../store/auth/selector";
import { getSchedule } from "../../store/schedule/selector";
import { getIsDarkMode } from "../../store/ui/selectors";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchSchedule } from "../../store/schedule/actions";
import { setProfile } from "../../store/auth/actions";
import { setDarkMode } from "../../store/ui/actions";

import "../profileCalendar.scss";

const ProfileCalendar = () => {
  const dispatch = useDispatch();

  const auth = useSelector(getAuthUser);
  const schedule = useSelector(getSchedule);
  const isDarkMode = useSelector(getIsDarkMode);

  useEffect(() => {
    dispatch(setProfile() as any);
    dispatch(fetchSchedule() as any);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    dispatch(setDarkMode(!isDarkMode) as any);
  };

  return (
    <div className={`profile-calendar-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <button className="dark-mode-toggle" onClick={toggleDarkMode} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
        {isDarkMode ? '☀' : '☾'}
      </button>
      <ProfileCard profile={auth} />
      <CalendarContainer schedule={schedule} auth={auth} />
    </div>
  );
};

export default ProfileCalendar;
