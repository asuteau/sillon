// A Record count, e.g. "1 record", "2,140 records"
export const formatRecords = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`
