export interface GroupedMessages {
  date: string;
  label: string;
  messages: any[];
}

export function formatMessageDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare dates only
  const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const resetDate = resetTime(date);
  const resetToday = resetTime(today);
  const resetYesterday = resetTime(yesterday);
  
  if (resetDate.getTime() === resetToday.getTime()) {
    return 'today';
  } else if (resetDate.getTime() === resetYesterday.getTime()) {
    return 'yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }
}

export function getDateLabel(dateKey: string): string {
  switch (dateKey) {
    case 'today':
      return 'Hari ini';
    case 'yesterday':
      return 'Kemarin';
    default:
      return dateKey;
  }
}

export function groupMessagesByDate(messages: any[]): GroupedMessages[] {
  if (!messages || messages.length === 0) return [];
  
  const grouped: { [key: string]: any[] } = {};
  
  // Group messages by date
  messages.forEach(message => {
    const dateKey = formatMessageDate(message.created_at);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(message);
  });
  
  // Convert to array and sort by date (oldest first)
  const result: GroupedMessages[] = Object.entries(grouped)
    .map(([dateKey, msgs]) => ({
      date: dateKey,
      label: getDateLabel(dateKey),
      messages: msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }))
    .sort((a, b) => {
      // Sort by date (oldest first)
      if (a.date === 'today') return 1;
      if (b.date === 'today') return -1;
      if (a.date === 'yesterday') return 1;
      if (b.date === 'yesterday') return -1;
      
      // For actual dates, sort by date (oldest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  
  return result;
}
