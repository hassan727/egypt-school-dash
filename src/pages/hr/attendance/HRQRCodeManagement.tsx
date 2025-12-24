/**
 * HRQRCodeManagement - صفحة إدارة رموز QR للحضور
 * QR Code Management Page for Attendance
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import {
    QrCode, MapPin, Plus, Printer, Download, Trash2, Copy,
    Check, AlertCircle, Building, Clock, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Location {
    id: string;
    location_name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    is_active: boolean;
}

interface QRCodeItem {
    id: string;
    location_id: string;
    qr_code_data: string;
    qr_type: 'check_in' | 'check_out';
    is_active: boolean;
    created_at: string;
    location?: Location;
}

const HRQRCodeManagement = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [qrCodes, setQRCodes] = useState<QRCodeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);

    // Add Location Dialog
    const [addLocationOpen, setAddLocationOpen] = useState(false);
    const [newLocation, setNewLocation] = useState({
        location_name: '',
        latitude: '',
        longitude: '',
        radius_meters: '100',
    });

    // Generate QR Dialog
    const [generateQROpen, setGenerateQROpen] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [selectedQRType, setSelectedQRType] = useState<'check_in' | 'check_out'>('check_in');

    // Print Preview Dialog
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
    const [printQR, setPrintQR] = useState<QRCodeItem | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch locations
            const { data: locs, error: locErr } = await supabase
                .from('attendance_locations')
                .select('*')
                .eq('is_active', true)
                .order('location_name');

            if (locErr) throw locErr;
            setLocations(locs || []);

            // Fetch QR codes with locations
            const { data: qrs, error: qrErr } = await supabase
                .from('attendance_qr_codes')
                .select('*, location:attendance_locations(*)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (qrErr) throw qrErr;
            setQRCodes(qrs || []);

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Add new location
    const handleAddLocation = async () => {
        if (!newLocation.location_name.trim()) {
            toast.error('يرجى إدخال اسم الموقع');
            return;
        }

        try {
            const { error } = await supabase.from('attendance_locations').insert({
                location_name: newLocation.location_name,
                latitude: parseFloat(newLocation.latitude) || 30.0444, // Default Cairo
                longitude: parseFloat(newLocation.longitude) || 31.2357,
                radius_meters: parseInt(newLocation.radius_meters) || 100,
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

    // Generate QR code
    const handleGenerateQR = async () => {
        if (!selectedLocationId) {
            toast.error('يرجى اختيار الموقع');
            return;
        }

        try {
            // Create unique QR code data
            const qrData = `ATT-${selectedLocationId.substring(0, 8)}-${selectedQRType}-${Date.now()}`;

            const { error } = await supabase.from('attendance_qr_codes').insert({
                location_id: selectedLocationId,
                qr_code_data: qrData,
                qr_type: selectedQRType,
                is_active: true,
            });

            if (error) throw error;

            toast.success('تم إنشاء رمز QR بنجاح');
            setGenerateQROpen(false);
            setSelectedLocationId('');
            fetchData();
        } catch (error: any) {
            console.error('Error generating QR:', error);
            toast.error('فشل في إنشاء رمز QR');
        }
    };

    // Delete QR code
    const handleDeleteQR = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الرمز؟')) return;

        try {
            const { error } = await supabase
                .from('attendance_qr_codes')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            toast.success('تم حذف رمز QR');
            fetchData();
        } catch (error) {
            toast.error('فشل في حذف رمز QR');
        }
    };

    // Copy QR code data
    const handleCopy = (data: string) => {
        navigator.clipboard.writeText(data);
        setCopied(data);
        setTimeout(() => setCopied(null), 2000);
        toast.success('تم نسخ الرمز');
    };

    // Download QR as image
    const handleDownload = (qr: QRCodeItem) => {
        const svg = document.getElementById(`qr-${qr.id}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 400;
            canvas.height = 400;
            ctx!.fillStyle = 'white';
            ctx!.fillRect(0, 0, 400, 400);
            ctx!.drawImage(img, 50, 50, 300, 300);

            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `qr-${qr.location?.location_name || 'attendance'}-${qr.qr_type}.png`;
            link.href = pngUrl;
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Print QR code
    const handlePrint = (qr: QRCodeItem) => {
        setPrintQR(qr);
        setPrintPreviewOpen(true);
    };

    const executePrint = () => {
        if (!printQR) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svg = document.getElementById(`print-qr-${printQR.id}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);

        printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>رمز QR - ${printQR.location?.location_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 40px;
            background: #f5f5f5;
          }
          .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          .logo { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
          .location { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .type {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-bottom: 30px;
          }
          .type.check_in { background: #dcfce7; color: #16a34a; }
          .type.check_out { background: #dbeafe; color: #2563eb; }
          .qr-container {
            background: white;
            padding: 20px;
            border: 3px dashed #e5e7eb;
            border-radius: 16px;
            display: inline-block;
          }
          .instructions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.8;
          }
          @media print {
            body { background: white; }
            .card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">مدرسة مصر</div>
          <div class="subtitle">نظام تسجيل الحضور الإلكتروني</div>
          <div class="location">${printQR.location?.location_name || 'الموقع'}</div>
          <div class="type ${printQR.qr_type}">
            ${printQR.qr_type === 'check_in' ? '📥 تسجيل الحضور' : '📤 تسجيل الانصراف'}
          </div>
          <div class="qr-container">
            ${svgData}
          </div>
          <div class="instructions">
            <strong>تعليمات الاستخدام:</strong><br>
            1. افتح رابط تسجيل الحضور على هاتفك<br>
            2. أدخل كود الموظف الخاص بك<br>
            3. اختر "مسح QR" ووجه الكاميرا نحو هذا الرمز
          </div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `);
        printWindow.document.close();
        setPrintPreviewOpen(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <QrCode className="h-8 w-8 text-purple-600" />
                            إدارة رموز QR للحضور
                        </h1>
                        <p className="text-gray-500 mt-1">
                            إنشاء وطباعة رموز QR لتسجيل حضور وانصراف الموظفين
                        </p>
                    </div>
                </div>

                {/* Workflow Steps */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-900">📋 خطوات تفعيل نظام QR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                                <div>
                                    <p className="font-medium">أضف موقع</p>
                                    <p className="text-sm text-gray-500">حدد اسم المكان مثل "البوابة الرئيسية"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                                <div>
                                    <p className="font-medium">أنشئ QR</p>
                                    <p className="text-sm text-gray-500">اختر الموقع ونوع التسجيل (حضور/انصراف)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                                <div>
                                    <p className="font-medium">اطبع الورقة</p>
                                    <p className="text-sm text-gray-500">اطبع وعلّقها على الحائط عند المدخل</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">✓</span>
                                <div>
                                    <p className="font-medium">جاهز!</p>
                                    <p className="text-sm text-gray-500">الموظف يمسح QR بهاتفه</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button onClick={() => setAddLocationOpen(true)}>
                        <MapPin className="h-4 w-4 ml-2" />
                        إضافة موقع جديد
                    </Button>
                    <Button onClick={() => setGenerateQROpen(true)} variant="outline" disabled={locations.length === 0}>
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء رمز QR
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Tabs defaultValue="qrcodes">
                        <TabsList>
                            <TabsTrigger value="qrcodes" className="flex items-center gap-2">
                                <QrCode className="h-4 w-4" />
                                رموز QR ({qrCodes.length})
                            </TabsTrigger>
                            <TabsTrigger value="locations" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                المواقع ({locations.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* QR Codes Tab */}
                        <TabsContent value="qrcodes" className="mt-4">
                            {qrCodes.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <QrCode className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-lg text-gray-500">لم يتم إنشاء أي رموز QR بعد</p>
                                    <p className="text-sm text-gray-400 mb-4">ابدأ بإضافة موقع ثم أنشئ رمز QR</p>
                                    <Button onClick={() => setAddLocationOpen(true)}>
                                        <Plus className="h-4 w-4 ml-2" />
                                        إضافة موقع
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {qrCodes.map((qr) => (
                                        <Card key={qr.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                            <CardHeader className="pb-2 bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-gray-500" />
                                                            {qr.location?.location_name || 'موقع محذوف'}
                                                        </CardTitle>
                                                        <div className="mt-1">
                                                            <Badge className={
                                                                qr.qr_type === 'check_in'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }>
                                                                {qr.qr_type === 'check_in' ? 'تسجيل حضور' : 'تسجيل انصراف'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-4 flex flex-col items-center">
                                                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                                                    <QRCodeSVG
                                                        id={`qr-${qr.id}`}
                                                        value={qr.qr_code_data}
                                                        size={160}
                                                        level="H"
                                                        includeMargin
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-4 w-full">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleCopy(qr.qr_code_data)}
                                                    >
                                                        {copied === qr.qr_code_data ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleDownload(qr)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handlePrint(qr)}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteQR(qr.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Locations Tab */}
                        <TabsContent value="locations" className="mt-4">
                            {locations.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-lg text-gray-500">لم يتم إضافة أي مواقع بعد</p>
                                    <Button onClick={() => setAddLocationOpen(true)} className="mt-4">
                                        <Plus className="h-4 w-4 ml-2" />
                                        إضافة موقع
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {locations.map((loc) => (
                                        <Card key={loc.id} className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-3 bg-purple-100 rounded-lg">
                                                    <Building className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold">{loc.location_name}</h3>
                                                    <p className="text-sm text-gray-500">نصف القطر: {loc.radius_meters} متر</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-mono">
                                                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Add Location Dialog */}
                <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                إضافة موقع جديد
                            </DialogTitle>
                            <DialogDescription>
                                أضف موقع تسجيل الحضور (مثل البوابة الرئيسية، مدخل الموظفين)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">اسم الموقع *</label>
                                <Input
                                    value={newLocation.location_name}
                                    onChange={(e) => setNewLocation({ ...newLocation, location_name: e.target.value })}
                                    placeholder="مثال: البوابة الرئيسية"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">خط العرض (اختياري)</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={newLocation.latitude}
                                        onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                                        placeholder="30.0444"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">خط الطول (اختياري)</label>
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
                            <DialogDescription>
                                حدد الموقع ونوع التسجيل لإنشاء رمز QR
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">الموقع *</label>
                                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
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
                                <label className="text-sm font-medium">نوع التسجيل *</label>
                                <Select value={selectedQRType} onValueChange={(v: 'check_in' | 'check_out') => setSelectedQRType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="check_in">📥 تسجيل حضور (Check In)</SelectItem>
                                        <SelectItem value="check_out">📤 تسجيل انصراف (Check Out)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    أنشئ رمز واحد للحضور وآخر للانصراف
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setGenerateQROpen(false)}>إلغاء</Button>
                            <Button onClick={handleGenerateQR} disabled={!selectedLocationId}>إنشاء الرمز</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Print Preview Dialog */}
                <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>معاينة الطباعة</DialogTitle>
                        </DialogHeader>
                        {printQR && (
                            <div className="text-center py-6">
                                <div className="inline-block p-6 bg-white border-2 border-dashed rounded-xl">
                                    <QRCodeSVG
                                        id={`print-qr-${printQR.id}`}
                                        value={printQR.qr_code_data}
                                        size={200}
                                        level="H"
                                        includeMargin
                                    />
                                </div>
                                <p className="mt-4 font-bold text-lg">{printQR.location?.location_name}</p>
                                <Badge className={
                                    printQR.qr_type === 'check_in'
                                        ? 'bg-green-100 text-green-700 mt-2'
                                        : 'bg-blue-100 text-blue-700 mt-2'
                                }>
                                    {printQR.qr_type === 'check_in' ? 'تسجيل حضور' : 'تسجيل انصراف'}
                                </Badge>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPrintPreviewOpen(false)}>إلغاء</Button>
                            <Button onClick={executePrint}>
                                <Printer className="h-4 w-4 ml-2" />
                                طباعة
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default HRQRCodeManagement;
