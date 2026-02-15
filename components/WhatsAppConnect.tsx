import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export const WhatsAppConnect: React.FC = () => {
    const [status, setStatus] = useState<{ connected: boolean; qr: string | null }>({
        connected: false,
        qr: null,
    });
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');

    const fetchStatus = async () => {
        try {
            const resp = await fetch('/api/whatsapp/status');
            if (resp.ok) {
                const data = await resp.json();
                setStatus(data.status);
            }
        } catch (e) {
            console.error("Failed to fetch WhatsApp status", e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        
        // Fetch phone from config
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data.config?.WHATSAPP_PHONE) {
                    setPhone(data.config.WHATSAPP_PHONE);
                }
            })
            .catch(console.error);

        return () => clearInterval(interval);
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        try {
            await fetch('/api/whatsapp/connect', { method: 'POST' });
            await fetchStatus();
        } catch (e) {
            alert("Failed to start WhatsApp connection");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePhone = async () => {
        try {
            const resp = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ WHATSAPP_PHONE: phone }),
            });
            if (resp.ok) {
                alert("Phone number saved!");
            }
        } catch (e) {
            alert("Failed to save phone number");
        }
    };

    return (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">WhatsApp Connection</h2>
            <p className="text-gray-500 mb-6">Connect to WhatsApp to receive notifications and trigger jobs remotely.</p>
            
            {!status.connected ? (
                <div className="space-y-4">
                    {!status.qr ? (
                        <Button onClick={handleConnect} disabled={loading}>
                            {loading ? "Starting..." : "Connect WhatsApp"}
                        </Button>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm text-gray-600">Scan this QR code with WhatsApp:</p>
                            <img 
                                src={`data:image/png;base64,${status.qr}`} 
                                alt="WhatsApp QR Code" 
                                className="w-64 h-64 border p-2 bg-white"
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                        <span>Connected ✅</span>
                    </div>
                    
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Notify this phone (e.g., 919876543210):
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone number with country code"
                                className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Button onClick={handleSavePhone}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
