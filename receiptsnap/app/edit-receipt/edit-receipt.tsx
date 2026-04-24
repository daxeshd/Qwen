import React from 'react';
import EditReceiptScreen from '../../src/screens/EditReceiptScreen';

export default function EditReceiptPage() {
  return (
    <EditReceiptScreen
      ocrResult={undefined}
      imageUri={undefined}
      onSaved={() => {}}
    />
  );
}
