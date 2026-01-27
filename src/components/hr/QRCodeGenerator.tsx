/**
 * QRCodeGenerator - مكون إنشاء رموز QR للحضور
 * QR Code Generator for Attendance Locations
 */
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    QrCode, Download, Plus, MapPin, Printer, Copy, Check, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useSystemSchoolId } from '@/context/SystemContext';

interface QRLocation {
    id: string;
    location_name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    is_active: boolean;
}

interface QRCodeData {
    id: string;
    location_id: string;
    qr_code_data: string;
    qr_type: 'check_in' | 'check_out';
    is_active: boolean;
    location?: QRLocation;
}

export function QRCodeGenerator() {
    const schoolId = useSystemSchoolId();
    const [locations, setLocations] = useState<QRLocation[]>([]);
    const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [addLocationOpen, setAddLocationOpen] = useState(false);
    const [generateQROpen, setGenerateQROpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const [newLocation, setNewLocation] = useState({
        location_name: '',
        latitude: '',
        longitude: '',
        radius_meters: '100',
    });

    const [newQR, setNewQR] = useState({
        location_id: '',
        qr_type: 'check_in' as 'check_in' | 'check_out',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch locations
            const { data: locData, error: locError } = await supabase
                .from('attendance_locations')
                .select('*')
                .order('location_name');

            if (locError) throw locError;
            setLocations(locData || []);

            // Fetch QR codes
            const { data: qrData, error: qrError } = await supabase
                .from('attendance_qr_codes')
                .select(`*, location:attendance_locations(*)`)
                .order('created_at', { ascending: false });

            if (qrError) throw qrError;
            setQRCodes(qrData || []);

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = async () => {
        if (!schoolId) {
            toast.error('لم يتم تحديد ID المدرسة. يرجى تسجيل الدخول مرة أخرى.');
            return;
        }

        try {
            const { error } = await supabase.from('attendance_locations').insert({
                school_id: schoolId,
                location_name: newLocation.location_name,
                latitude: parseFloat(newLocation.latitude),
                longitude: parseFloat(newLocation.longitude),
                radius_meters: parseInt(newLocation.radius_meters),
                is_active: true,
            });

            if (error) throw error;

            toast.success('تم إضافة الموقع بنجاح');
            setAddLocationOpen(false);
            setNewLocation({ location_name: '', latitude: '', longitude: '', radius_meters: '100' });
            fetchData();
        } catch (error: any) {
            console.error('Error adding location:', error);
            toast.error('فشل في إضافة الموقع');
        }
    };

    const handleGenerateQR = async () => {
        try {
            // Generate unique QR code data
            const qrCodeData = `ATT-${newQR.location_id.substring(0, 8)}-${newQR.qr_type}-${Date.now()}`;

            const { error } = await supabase.from('attendance_qr_codes').insert({
                location_id: newQR.location_id,
                qr_code_data: qrCodeData,
                qr_type: newQR.qr_type,
                is_active: true,
                school_id: schoolId,
            });

            if (error) throw error;

            toast.success('تم إنشاء رمز QR بنجاح');
            setGenerateQROpen(false);
            setNewQR({ location_id: '', qr_type: 'check_in' });
            fetchData();
        } catch (error: any) {
            console.error('Error generating QR:', error);
            toast.error('فشل في إنشاء رمز QR');
        }
    };

    const handleDeleteQR = async (id: string) => {
        try {
            const { error } = await supabase
                .from('attendance_qr_codes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('تم حذف رمز QR');
            fetchData();
        } catch (error) {
            toast.error('فشل في حذف رمز QR');
        }
    };

    const handleCopyQR = (data: string) => {
        navigator.clipboard.writeText(data);
        setCopied(data);
        setTimeout(() => setCopied(null), 2000);
        toast.success('تم نسخ الرمز');
    };

    const handleDownloadQR = (qrCode: QRCodeData) => {
        const svg = document.getElementById(`qr-${qrCode.id}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 300;
            canvas.height = 300;
            ctx?.drawImage(img, 0, 0, 300, 300);
            const pngUrl = canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.download = `qr-${qrCode.location?.location_name}-${qrCode.qr_type}.png`;
            link.href = pngUrl;
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handlePrintQR = (qrCode: QRCodeData) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svg = document.getElementById(`qr-${qrCode.id}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);

        printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>طباعة رمز QR - ${qrCode.location?.location_name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .qr-container { text-align: center; }
          .location-name { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .qr-type { 
            font-size: 18px; 
            color: ${qrCode.qr_type === 'check_in' ? 'green' : 'blue'}; 
            margin-bottom: 30px;
          }
          .instructions { font-size: 14px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="location-name">${qrCode.location?.location_name}</div>
          <div class="qr-type">${qrCode.qr_type === 'check_in' ? 'تسجيل الحضور' : 'تسجيل الانصراف'}</div>
          ${svgData}
          <div class="instructions">
            قم بفتح تطبيق الحضور على هاتفك<br/>
            ووجه الكاميرا نحو هذا الرمز
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <QrCode className="h-6 w-6 text-purple-600" />
                        إدارة رموز QR للحضور
                    </h2>
                    <p className="text-gray-500 text-sm">إنشاء وإدارة رموز QR لمواقع تسجيل الحضور</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAddLocationOpen(true)}>
                        <MapPin className="h-4 w-4 ml-2" />
                        إضافة موقع
                    </Button>
                    <Button onClick={() => setGenerateQROpen(true)}>
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء رمز QR
                    </Button>
                </div>
            </div>

            {/* QR Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrCodes.map((qr) => (
                    <Card key={qr.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {qr.location?.location_name}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${qr.qr_type === 'check_in'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {qr.qr_type === 'check_in' ? 'حضور' : 'انصراف'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-200">
                                <QRCodeSVG
                                    id={`qr-${qr.id}`}
                                    value={qr.qr_code_data}
                                    size={150}
                                    level="H"
                                    includeMargin
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-mono truncate max-w-full">
                                {qr.qr_code_data}
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyQR(qr.qr_code_data)}
                                >
                                    {copied === qr.qr_code_data ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadQR(qr)}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePrintQR(qr)}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteQR(qr.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {qrCodes.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>لم يتم إنشاء أي رموز QR بعد</p>
                    <p className="text-sm">أضف موقعاً أولاً ثم أنشئ رمز QR</p>
                </div>
            )}

            {/* Add Location Dialog */}
            <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            إضافة موقع جديد
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">اسم الموقع</label>
                            <Input
                                value={newLocation.location_name}
                                onChange={(e) => setNewLocation({ ...newLocation, location_name: e.target.value })}
                                placeholder="مثال: المدخل الرئيسي"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">خط العرض (Latitude)</label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={newLocation.latitude}
                                    onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                                    placeholder="30.0444"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">خط الطول (Longitude)</label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={newLocation.longitude}
                                    onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                                    placeholder="31.2357"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">نصف القطر المسموح (بالمتر)</label>
                            <Input
                                type="number"
                                value={newLocation.radius_meters}
                                onChange={(e) => setNewLocation({ ...newLocation, radius_meters: e.target.value })}
                                placeholder="100"
                            />
                            <p className="text-xs text-gray-500 mt-1">المسافة القصوى المسموح بها لتسجيل الحضور</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddLocationOpen(false)}>إلغاء</Button>
                        <Button onClick={handleAddLocation}>إضافة الموقع</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Generate QR Dialog */}
            <Dialog open={generateQROpen} onOpenChange={setGenerateQROpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            إنشاء رمز QR جديد
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">الموقع</label>
                            <Select
                                value={newQR.location_id}
                                onValueChange={(v) => setNewQR({ ...newQR, location_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الموقع" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.location_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">نوع التسجيل</label>
                            <Select
                                value={newQR.qr_type}
                                onValueChange={(v: 'check_in' | 'check_out') => setNewQR({ ...newQR, qr_type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="check_in">تسجيل حضور</SelectItem>
                                    <SelectItem value="check_out">تسجيل انصراف</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenerateQROpen(false)}>إلغاء</Button>
                        <Button onClick={handleGenerateQR} disabled={!newQR.location_id}>
                            إنشاء الرمز
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default QRCodeGenerator;
