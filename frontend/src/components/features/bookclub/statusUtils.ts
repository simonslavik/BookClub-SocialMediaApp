export const STATUS_OPTIONS = [
  { value: 'ONLINE',  label: 'Online',  color: 'bg-green-500' },
  { value: 'AWAY',    label: 'Away',    color: 'bg-yellow-500' },
  { value: 'BUSY',    label: 'Busy',    color: 'bg-red-500' },
  { value: 'OFFLINE', label: 'Offline', color: 'bg-gray-500' },
];

export const getStatusColor = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500';
};
