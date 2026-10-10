export interface Top3Prediction {
  disease: string;
  disease_kn?: string;
  confidence: number;
}

export interface ScanRecord {
  id: string;
  timestamp: number; // Unix timestamp in ms
  disease: string;
  disease_kn?: string;
  plantPart: 'leaf' | 'bud' | 'nut' | 'stem' | 'root';
  confidence: number;
  top3?: Top3Prediction[];
  imageThumb: string; // Base64 or URL
  gradcam?: string; // Base64 or URL
  severity?: 'Healthy' | 'Low' | 'Moderate' | 'Critical';
  pathogen?: string;
  plot?: string;
  notes?: string;
  language?: string;
}

const STORAGE_KEY = 'areca_scan_history_v2';

// Seed sample data for first-time visitors if completely empty
const DEFAULT_SEEDS: ScanRecord[] = [
  {
    id: 'scan-seed-1',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    disease: 'Koleroga (Fruit Rot / Mahali)',
    disease_kn: 'ಕೊಳೆರೋಗ (ಮಹಾಲಿ)',
    plantPart: 'nut',
    confidence: 96.4,
    severity: 'Critical',
    pathogen: 'Phytophthora meadii McRae',
    plot: 'Plot A - North Ridge',
    top3: [
      { disease: 'Koleroga (Fruit Rot / Mahali)', disease_kn: 'ಕೊಳೆರೋಗ (ಮಹಾಲಿ)', confidence: 96.4 },
      { disease: 'Bud Rot', disease_kn: 'ಸುಳಿ ಕೊಳೆ', confidence: 2.5 },
      { disease: 'Healthy Arecanut Frond', disease_kn: 'ಆರೋಗ್ಯಕರ ಅಡಿಕೆ', confidence: 1.1 }
    ],
    imageThumb: '/static/images/sample_koleroga.jpg',
    language: 'en'
  },
  {
    id: 'scan-seed-2',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    disease: 'Yellow Leaf Disease',
    disease_kn: 'ಹಳದಿ ಎಲೆ ರೋಗ',
    plantPart: 'leaf',
    confidence: 91.8,
    severity: 'Moderate',
    pathogen: 'Phytoplasma organism',
    plot: 'Plot B - Riverbank Block',
    top3: [
      { disease: 'Yellow Leaf Disease', disease_kn: 'ಹಳದಿ ಎಲೆ ರೋಗ', confidence: 91.8 },
      { disease: 'Leaf Spot', disease_kn: 'ಎಲೆ ಚುಕ್ಕೆ ರೋಗ', confidence: 5.7 },
      { disease: 'Healthy Arecanut Frond', disease_kn: 'ಆರೋಗ್ಯಕರ ಅಡಿಕೆ', confidence: 2.5 }
    ],
    imageThumb: '/static/images/sample_yellow_leaf.jpg',
    language: 'en'
  },
  {
    id: 'scan-seed-3',
    timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
    disease: 'Healthy Arecanut Frond',
    disease_kn: 'ಆರೋಗ್ಯಕರ ಅಡಿಕೆ ಗಿಡ',
    plantPart: 'leaf',
    confidence: 99.2,
    severity: 'Healthy',
    pathogen: 'None (Healthy foliage)',
    plot: 'Plot C - Young Palms',
    top3: [
      { disease: 'Healthy Arecanut Frond', disease_kn: 'ಆರೋಗ್ಯಕರ ಅಡಿಕೆ ಗಿಡ', confidence: 99.2 },
      { disease: 'Leaf Spot', disease_kn: 'ಎಲೆ ಚುಕ್ಕೆ ರೋಗ', confidence: 0.6 },
      { disease: 'Yellow Leaf Disease', disease_kn: 'ಹಳದಿ ಎಲೆ ರೋಗ', confidence: 0.2 }
    ],
    imageThumb: '/static/images/sample_healthy.jpg',
    language: 'en'
  }
];

class ScansService {
  private subscribers: Array<() => void> = [];

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  public subscribe(fn: () => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  public getScans(): ScanRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS));
        return DEFAULT_SEEDS;
      }
      return JSON.parse(data) as ScanRecord[];
    } catch (e) {
      console.warn('Failed to parse scan history from storage:', e);
      return DEFAULT_SEEDS;
    }
  }

  public addScan(record: Omit<ScanRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): ScanRecord {
    const scans = this.getScans();
    const newRecord: ScanRecord = {
      ...record,
      id: record.id || `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: record.timestamp || Date.now()
    };
    const updated = [newRecord, ...scans];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage quota exceeded, removing oldest scans:', e);
      // Remove oldest 3 items and retry
      const pruned = updated.slice(0, Math.max(10, updated.length - 3));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }
    this.notify();
    return newRecord;
  }

  public deleteScan(id: string): boolean {
    const scans = this.getScans();
    const filtered = scans.filter((s) => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to delete scan:', e);
      return false;
    }
  }

  public clearAllScans(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      this.notify();
    } catch (e) {
      console.error('Failed to clear scans:', e);
    }
  }

  public exportCSV(): string {
    const scans = this.getScans();
    const headers = ['ID', 'Date_Time', 'Disease_En', 'Disease_Kn', 'Plant_Part', 'Confidence_%', 'Severity', 'Plot'];
    const rows = scans.map((s) => [
      `"${s.id}"`,
      `"${new Date(s.timestamp).toISOString()}"`,
      `"${s.disease.replace(/"/g, '""')}"`,
      `"${(s.disease_kn || '').replace(/"/g, '""')}"`,
      `"${s.plantPart}"`,
      s.confidence.toFixed(1),
      `"${s.severity || 'Unknown'}"`,
      `"${(s.plot || 'Main Orchard').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}

export const scansService = new ScansService();
