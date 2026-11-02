export const parseDateFromAPI = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split(' ');
  const dt = parts[0];
  const time = parts[1];
  if (!dt) return new Date();
  const dateParts = dt.split('/');
  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];
  return new Date(`${year}-${month}-${day}T${time || '00:00'}`);
};

export const formatDateToAPI = (dateValue: string | Date): string => {
  const dt = new Date(dateValue);
  const dia = String(dt.getDate()).padStart(2, '0');
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const ano = dt.getFullYear();
  const hora = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
};

export const formatDatetimeLocal = (dateValue: Date): string => {
  const dia = String(dateValue.getDate()).padStart(2, '0');
  const mes = String(dateValue.getMonth() + 1).padStart(2, '0');
  const ano = dateValue.getFullYear();
  const hora = String(dateValue.getHours()).padStart(2, '0');
  const min = String(dateValue.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${min}`;
};

export const compareDateOnly = (firstDate: Date, secondDate: Date): boolean => {
  if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) return false;
  return firstDate.getDate() === secondDate.getDate() &&
         firstDate.getMonth() === secondDate.getMonth() &&
         firstDate.getFullYear() === secondDate.getFullYear();
};
