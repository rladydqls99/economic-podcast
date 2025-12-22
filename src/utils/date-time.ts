export const getKSTDate = (date = new Date()) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstOffset = 9 * 60 * 60 * 1000; // KST is UTC +9
  return new Date(utc + kstOffset);
};

export const getTodayNewsRange = () => {
  const nowKST = getKSTDate();

  const startOfDay = new Date(nowKST);
  startOfDay.setHours(0, 0, 0, 0);

  // 열시 마감으로 설정
  const endOfDay = new Date(nowKST);
  endOfDay.setHours(22, 0, 0, 0);

  return { startOfDay, endOfDay };
};

export const isWithinRange = (date: Date, start: Date, end: Date) => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};
