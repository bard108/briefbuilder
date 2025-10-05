import type { FormData } from '../schemas/brief-schema';

export function generateICalendar(data: FormData): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Parse shoot date
  const shootDate = data.shootDates || new Date().toISOString();
  let startDate: Date;
  
  try {
    startDate = new Date(shootDate);
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
    }
  } catch {
    startDate = new Date();
  }

  const startDateString = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Default to 4 hours shoot duration
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  const endDateString = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const location = data.location || 'TBD';
  const projectName = data.projectName || 'Photography Shoot';
  
  let description = `Photography Shoot: ${projectName}\\n\\n`;
  if (data.overview) description += `Overview: ${data.overview}\\n\\n`;
  if (data.shootStatus) description += `Status: ${data.shootStatus}\\n\\n`;
  
  if (data.crew && data.crew.length > 0) {
    description += `Crew:\\n`;
    data.crew.forEach(member => {
      description += `- ${member.name} (${member.role})${member.callTime ? ' - Call: ' + member.callTime : ''}\\n`;
    });
    description += '\\n';
  }
  
  if (data.emergencyContact) {
    description += `Emergency Contact: ${data.emergencyContact}\\n`;
  }

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BriefBuilder//Photography Brief//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${timestamp}-${Math.random().toString(36).substring(7)}@briefbuilder.app
DTSTAMP:${timestamp}
DTSTART:${startDateString}
DTEND:${endDateString}
SUMMARY:${projectName}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:${data.shootStatus === 'Confirmed' ? 'CONFIRMED' : 'TENTATIVE'}
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Photography shoot tomorrow
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return ical;
}

export function downloadICalendar(data: FormData): void {
  const icalContent = generateICalendar(data);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(data.projectName || 'shoot').toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateGoogleCalendarUrl(data: FormData): string {
  const projectName = encodeURIComponent(data.projectName || 'Photography Shoot');
  const location = encodeURIComponent(data.location || '');
  
  let description = '';
  if (data.overview) description += data.overview + '\n\n';
  if (data.shootStatus) description += `Status: ${data.shootStatus}\n\n`;
  
  const details = encodeURIComponent(description);
  
  // Parse date (simplified - assumes ISO format or creates today's date)
  const shootDate = data.shootDates ? new Date(data.shootDates) : new Date();
  const dateString = shootDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(shootDate.getTime() + 4 * 60 * 60 * 1000);
  const endString = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${projectName}&dates=${dateString}/${endString}&details=${details}&location=${location}`;
}
