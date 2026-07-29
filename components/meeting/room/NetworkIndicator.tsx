import { NetworkQuality } from '@/hooks/useWebRTC';

interface NetworkIndicatorProps {
  quality?: NetworkQuality;
}

export default function NetworkIndicator({ quality }: NetworkIndicatorProps) {
  if (!quality || quality === 'unknown') return null;

  return (
    <div className="flex items-end gap-[1.5px] h-3 ml-1.5" title={`Kualitas Jaringan: ${quality}`}>
      {/* Bar 1 */}
      <div 
        className={`w-1 rounded-[1px] ${
          quality === 'poor' ? 'h-[5px] bg-red-500' :
          quality === 'good' ? 'h-[5px] bg-yellow-400' :
          'h-[5px] bg-green-500'
        }`}
      />
      {/* Bar 2 */}
      <div 
        className={`w-1 rounded-[1px] ${
          quality === 'poor' ? 'h-2 bg-gray-500/50' :
          quality === 'good' ? 'h-2 bg-yellow-400' :
          'h-2 bg-green-500'
        }`}
      />
      {/* Bar 3 */}
      <div 
        className={`w-1 rounded-[1px] ${
          quality === 'poor' || quality === 'good' ? 'h-3 bg-gray-500/50' :
          'h-3 bg-green-500'
        }`}
      />
    </div>
  );
}
