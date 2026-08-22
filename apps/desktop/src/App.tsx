import { useState } from 'react';
import {
  FileCode,
  UploadCloud,
  Layers,
  RefreshCw,
  HardDrive,
  CheckCircle,
  Key,
} from 'lucide-react';
import { storeRefreshToken, getRefreshToken } from './services/keychain';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload' | 'cache' | 'keychain'>(
    'catalog',
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('Ready');
  const [keychainStatus, setKeychainStatus] = useState<string>(
    'Token securely stored in OS Keychain',
  );

  const sampleProducts = [
    {
      id: 'SF-PROD-101',
      sku: 'APL-MBP-M3-14',
      title: 'Apple MacBook Pro 14" M3 Pro 18GB/512GB Space Black',
      price: '$1,999.00',
      category: 'Laptops & Computers',
      status: 'Synced',
      imagesCount: 6,
    },
    {
      id: 'SF-PROD-102',
      sku: 'SNY-WH1000XM5',
      title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
      price: '$399.99',
      category: 'Audio & Hi-Fi',
      status: 'Synced',
      imagesCount: 4,
    },
    {
      id: 'SF-PROD-103',
      sku: 'DJI-MINI-4PRO',
      title: 'DJI Mini 4 Pro Drone with RC 2 Controller 4K HDR',
      price: '$959.00',
      category: 'Cameras & Drones',
      status: 'Cached (SQLite)',
      imagesCount: 8,
    },
    {
      id: 'SF-PROD-104',
      sku: 'LOGI-MX-MST-3S',
      title: 'Logitech MX Master 3S Performance Wireless Mouse',
      price: '$99.99',
      category: 'Computer Accessories',
      status: 'Synced',
      imagesCount: 3,
    },
  ];

  const handleSimulatedUpload = async () => {
    setUploadStatus('Requesting S3 Presigned URL from NestJS backend...');
    setUploadProgress(10);

    setTimeout(() => {
      setUploadStatus('Uploading directly to MinIO / Cloudflare R2...');
      setUploadProgress(45);
    }, 600);

    setTimeout(() => {
      setUploadProgress(85);
    }, 1200);

    setTimeout(() => {
      setUploadProgress(100);
      setUploadStatus('Direct S3 upload completed! Image indexed in database.');
    }, 1800);
  };

  const handleTestKeychain = async () => {
    const testToken = 'sf_sample_refresh_token_' + Date.now();
    await storeRefreshToken(testToken);
    const retrieved = await getRefreshToken();
    setKeychainStatus(`Keychain Verified: Active token ${retrieved?.slice(0, 20)}...`);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between p-3">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-2.5 px-3 py-3 mb-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              SF
            </div>
            <div>
              <div className="font-bold text-xs tracking-tight text-white">SmartFeed Studio</div>
              <div className="text-[10px] text-slate-400 font-medium">Desktop Tauri v2</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              XML Catalog Viewer
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Direct S3 Uploader
            </button>

            <button
              onClick={() => setActiveTab('cache')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'cache'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              SQLite (SQLCipher)
            </button>

            <button
              onClick={() => setActiveTab('keychain')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'keychain'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Key className="w-4 h-4" />
              OS Keychain Security
            </button>
          </div>
        </div>

        {/* Engine status footer */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Rust Core
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Tauri v2</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Encrypted SQLite DB: <span className="text-emerald-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Workspace: catalog_ukraine_electronics_2026.xml</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
              4,820 Items
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulatedUpload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Sync to Cloud
            </button>
          </div>
        </div>

        {/* Dynamic Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Parsed XML Catalog Items</h2>
                  <p className="text-xs text-slate-400">
                    High-speed local parsing with SQLCipher local storage and instant search.
                  </p>
                </div>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700">
                  <RefreshCw className="w-3.5 h-3.5" /> Reload XML
                </button>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">SKU / ID</th>
                      <th className="py-2.5 px-4">Product Title</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Price</th>
                      <th className="py-2.5 px-4">Images</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sampleProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-blue-400">{p.sku}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{p.title}</td>
                        <td className="py-3 px-4 text-slate-400">{p.category}</td>
                        <td className="py-3 px-4 font-semibold text-white">{p.price}</td>
                        <td className="py-3 px-4 text-slate-400">{p.imagesCount} assets</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                              p.status === 'Synced'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" /> {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Direct S3 / MinIO Uploader</h2>
                <p className="text-xs text-slate-400">
                  Direct client-side PUT upload via Presigned URLs issued by NestJS CQRS CommandBus.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Status</div>
                  <div className="text-xs font-mono text-blue-400">{uploadStatus}</div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <button
                  onClick={handleSimulatedUpload}
                  className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Trigger Presigned Upload Test
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cache' && (
            <div className="max-w-xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Encrypted SQLite (SQLCipher)</h2>
                <p className="text-xs text-slate-400">
                  Local database engine stores 100,000+ catalog items with zero latency.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Cipher Algorithm</span>
                  <span className="font-mono text-emerald-400">AES-256-CBC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Local Table Rows</span>
                  <span className="font-mono text-slate-200">4,820 items</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Disk Footprint</span>
                  <span className="font-mono text-slate-200">3.8 MB</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keychain' && (
            <div className="max-w-xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">OS Keychain Integration</h2>
                <p className="text-xs text-slate-400">
                  Refresh tokens are saved securely using macOS Keychain / Windows Credential
                  Manager.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 text-xs space-y-3">
                <div className="text-slate-300 font-mono">{keychainStatus}</div>
                <button
                  onClick={handleTestKeychain}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
                >
                  Verify Keychain Write & Read
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
