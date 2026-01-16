import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { AppState, WeekRecord } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const generateLedgerStyle = (state: AppState): string => {
  const startYear = state.startDate ? new Date(state.startDate).getFullYear() : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  
  let content = '';
  content += '═══════════════════════════════════════════════════════════\n';
  content += '                    ETHICA\n';
  content += '            Character Formation Record\n';
  content += '═══════════════════════════════════════════════════════════\n\n';
  
  content += 'Based on Benjamin Franklin\'s method of moral perfection.\n\n';
  content += '───────────────────────────────────────────────────────────\n\n';
  
  if (state.startDate) {
    content += `Practicing since: ${formatDate(state.startDate)}\n`;
  }
  content += `Total weeks practiced: ${state.weekRecords.length}\n\n`;
  
  content += '═══════════════════════════════════════════════════════════\n';
  content += '                  VIRTUE LEDGER\n';
  content += '═══════════════════════════════════════════════════════════\n\n';
  
  const virtueMap = new Map<string, WeekRecord[]>();
  state.weekRecords.forEach(record => {
    if (!virtueMap.has(record.virtueId)) {
      virtueMap.set(record.virtueId, []);
    }
    virtueMap.get(record.virtueId)?.push(record);
  });
  
  VIRTUES.forEach(virtue => {
    const records = virtueMap.get(virtue.id) || [];
    if (records.length === 0) return;
    
    content += `${virtue.name.toUpperCase()}\n`;
    content += `"${virtue.description}"\n\n`;
    
    records.forEach((record, index) => {
      const faults = record.observations.filter(o => o.hasFault).length;
      const startDate = formatDate(record.startDate);
      const endDate = formatDate(record.endDate);
      
      content += `  Week ${index + 1}: ${startDate} — ${endDate}\n`;
      content += `  Faults observed: ${faults}\n`;
      
      const notesWithFaults = record.observations.filter(o => o.hasFault && o.note);
      if (notesWithFaults.length > 0) {
        content += '  Notes:\n';
        notesWithFaults.forEach(obs => {
          const date = new Date(obs.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          content += `    • ${date}: ${obs.note}\n`;
        });
      }
      content += '\n';
    });
    
    content += '───────────────────────────────────────────────────────────\n\n';
  });
  
  if (currentYear > startYear) {
    content += '═══════════════════════════════════════════════════════════\n';
    content += `              ${currentYear} SUMMARY\n`;
    content += '═══════════════════════════════════════════════════════════\n\n';
    
    const yearRecords = state.weekRecords.filter(r => 
      new Date(r.startDate).getFullYear() === currentYear
    );
    
    content += `Weeks practiced this year: ${yearRecords.length}\n\n`;
    
    VIRTUES.forEach(virtue => {
      const virtueRecords = yearRecords.filter(r => r.virtueId === virtue.id);
      if (virtueRecords.length > 0) {
        const totalFaults = virtueRecords.reduce((sum, r) => 
          sum + r.observations.filter(o => o.hasFault).length, 0
        );
        content += `${virtue.name}: ${virtueRecords.length} ${virtueRecords.length === 1 ? 'week' : 'weeks'} (${totalFaults} ${totalFaults === 1 ? 'fault' : 'faults'})\n`;
      }
    });
    
    content += '\n───────────────────────────────────────────────────────────\n\n';
  }
  
  content += '═══════════════════════════════════════════════════════════\n\n';
  content += '"I did not aim for perfection, but for fewer faults."\n';
  content += '                              — Benjamin Franklin\n\n';
  content += '═══════════════════════════════════════════════════════════\n';
  
  return content;
};

export const exportCharacterRecord = async (state: AppState): Promise<void> => {
  const content = generateLedgerStyle(state);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `ethica-record-${timestamp}.txt`;
  
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    try {
      const file = new File(Paths.cache, filename);
      await file.create();
      await file.write(content);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Character Record',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
};
