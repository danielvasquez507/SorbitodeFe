import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';

export default function CustomDatePicker({ value, onChange, placeholder = "Seleccionar fecha", showTime = false }) {
  const selectedDate = value ? new Date(value) : null;

  const handleChange = (date) => {
    if (!date) {
      onChange('');
      return;
    }
    // react-datepicker gives a Date object local to the browser
    if (showTime) {
      // YYYY-MM-DDTHH:mm
      const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      onChange(localISO);
    } else {
      const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
      onChange(localISO);
    }
  };

  return (
    <div className="custom-datepicker-wrapper w-full">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        locale={es}
        showTimeSelect={showTime}
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat={showTime ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"}
        placeholderText={placeholder}
        className="w-full px-2 py-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] transition-all"
        wrapperClassName="w-full"
      />
    </div>
  );
}
