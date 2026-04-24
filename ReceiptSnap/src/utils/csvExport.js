import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportToCSV = async (expenses) => {
  try {
    // Create CSV content
    const headers = ['Date', 'Merchant', 'Amount'];
    const rows = expenses.map(expense => 
      `"${expense.date}","${expense.merchant}","${expense.amount}"`
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Generate filename with current date
    const date = new Date();
    const filename = `receiptsnap_expenses_${date.toISOString().split('T')[0]}.csv`;
    
    // Write to file system
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    
    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      console.log('Sharing not available, file saved to:', fileUri);
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

export default { exportToCSV };
