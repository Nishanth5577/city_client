import { QrCode, Download } from 'lucide-react';

export default function QRCodeViewer({ qrData, projectName = 'Project' }) {
  if (!qrData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-surface-400">
        <QrCode className="w-12 h-12 mb-2 opacity-30" />
        <p className="text-sm">No QR code available</p>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `${projectName.replace(/\s+/g, '_')}_QR.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="p-4 bg-white rounded-2xl shadow-lg">
        <img src={qrData} alt={`QR Code for ${projectName}`} className="w-48 h-48" />
      </div>
      <p className="text-sm text-surface-500 text-center">Scan to view project progress publicly</p>
      <button onClick={handleDownload} className="btn-secondary flex items-center gap-2 text-sm">
        <Download className="w-4 h-4" /> Download QR Code
      </button>
    </div>
  );
}
