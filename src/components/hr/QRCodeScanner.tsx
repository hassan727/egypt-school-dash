/**
 * QRCodeScanner - مكون مسح رموز QR للحضور
 * QR Code Scanner for Attendance Check-in/Check-out
 */
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Camera, CameraOff, MapPin, Clock, CheckCircle, XCircle,
    Loader2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface QRScannerProps {
    employeeId: string;
    onCheckInSuccess?: (record: any) => void;
}

interface GeolocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export function QRCodeScanner({ employeeId, onCheckInSuccess }: QRScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationData | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-scanner-container';

    // Get current location
    const getCurrentLocation = (): Promise<GeolocationData> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('المتصفح لا يدعم خدمة تحديد الموقع'));
                return;
            }

            setGettingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGettingLocation(false);
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    };
                    setLocation(loc);
                    setLocationError(null);
                    resolve(loc);
                },
                (err) => {
                    setGettingLocation(false);
                    let message = 'فشل في تحديد الموقع';
                    if (err.code === 1) message = 'تم رفض إذن الموقع';
                    if (err.code === 2) message = 'الموقع غير متاح';
                    if (err.code === 3) message = 'انتهت مهلة تحديد الموقع';
                    setLocationError(message);
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    // Start QR scanner
    const startScanner = async () => {
        try {
            setError(null);
            setSuccess(null);

            // Try to get location but don't block scanner if it fails
            try {
                await getCurrentLocation();
            } catch (locErr) {
                // Location failed but continue anyway - location verification is optional
                console.warn('Location not available:', locErr);
            }

            // Initialize scanner
            scannerRef.current = new Html5Qrcode(scannerContainerId);

            await scannerRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                handleScanSuccess,
                handleScanError
            );

            setScanning(true);
        } catch (err: any) {
            console.error('Error starting scanner:', err);
            setError(err.message || 'فشل في تشغيل الكاميرا');
        }
    };

    // Stop QR scanner
    const stopScanner = async () => {
        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
                scannerRef.current = null;
            }
            setScanning(false);
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    };

    // Handle successful scan
    const handleScanSuccess = async (decodedText: string) => {
        // Stop scanner after successful scan
        await stopScanner();

        setLoading(true);
        setError(null);

        try {
            // Verify QR code exists in database
            const { data: qrCode, error: qrError } = await supabase
                .from('attendance_qr_codes')
                .select(`*, location:attendance_locations(*)`)
                .eq('qr_code_data', decodedText)
                .eq('is_active', true)
                .single();

            if (qrError || !qrCode) {
                throw new Error('رمز QR غير صالح أو غير موجود');
            }

            // Try to get fresh location (optional)
            let currentLocation = location;
            let locationVerified = false;

            try {
                currentLocation = await getCurrentLocation();

                // Verify location is within allowed radius (if location available)
                if (currentLocation && qrCode.location) {
                    const distance = calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        qrCode.location.latitude,
                        qrCode.location.longitude
                    );

                    if (distance > qrCode.location.radius_meters) {
                        // Show warning but don't block - for flexibility
                        console.warn(`Distance exceeds limit: ${distance}m vs ${qrCode.location.radius_meters}m`);
                        toast.warning(`تنبيه: المسافة ${Math.round(distance)} متر (المسموح: ${qrCode.location.radius_meters} متر)`);
                    } else {
                        locationVerified = true;
                    }
                }
            } catch (locErr) {
                // Location not available - continue without verification
                console.warn('Could not verify location:', locErr);
            }

            // Record attendance
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0];

            if (qrCode.qr_type === 'check_in') {
                // Check-in
                const { data, error: insertError } = await supabase
                    .from('employee_attendance')
                    .upsert({
                        employee_id: employeeId,
                        date: today,
                        check_in_time: currentTime,
                        check_in_latitude: currentLocation?.latitude || null,
                        check_in_longitude: currentLocation?.longitude || null,
                        check_in_verified: locationVerified,
                        status: 'حاضر', // Will be recalculated by trigger/function
                    }, { onConflict: 'employee_id,date' })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setSuccess(`تم تسجيل الحضور بنجاح في ${currentTime.substring(0, 5)}`);
                toast.success('تم تسجيل الحضور بنجاح!');
                onCheckInSuccess?.(data);

            } else {
                // Check-out
                const { data, error: updateError } = await supabase
                    .from('employee_attendance')
                    .update({
                        check_out_time: currentTime,
                        check_out_latitude: currentLocation?.latitude || null,
                        check_out_longitude: currentLocation?.longitude || null,
                        check_out_verified: locationVerified,
                    })
                    .eq('employee_id', employeeId)
                    .eq('date', today)
                    .select()
                    .single();

                if (updateError) throw updateError;

                setSuccess(`تم تسجيل الانصراف بنجاح في ${currentTime.substring(0, 5)}`);
                toast.success('تم تسجيل الانصراف بنجاح!');
                onCheckInSuccess?.(data);
            }

        } catch (err: any) {
            console.error('Error processing QR:', err);
            setError(err.message || 'فشل في تسجيل الحضور');
            toast.error(err.message || 'فشل في تسجيل الحضور');
        } finally {
            setLoading(false);
        }
    };

    // Handle scan errors (not failures - just no QR detected)
    const handleScanError = (err: any) => {
        // Don't show error for normal scanning without QR
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    تسجيل الحضور بمسح QR
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Location Status */}
                <div className={`p-3 rounded-lg flex items-center gap-3 ${locationError ? 'bg-red-50' :
                    location ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                    {gettingLocation ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span>جاري تحديد الموقع...</span>
                        </>
                    ) : locationError ? (
                        <>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700">{locationError}</span>
                        </>
                    ) : location ? (
                        <>
                            <MapPin className="h-5 w-5 text-green-600" />
                            <div>
                                <span className="text-green-700">تم تحديد الموقع</span>
                                <p className="text-xs text-gray-500">
                                    الدقة: ±{Math.round(location.accuracy)} متر
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-500">لم يتم تحديد الموقع بعد</span>
                        </>
                    )}
                </div>

                {/* Scanner Container */}
                <div
                    id={scannerContainerId}
                    className="w-full aspect-square bg-black rounded-lg overflow-hidden"
                    style={{ display: scanning ? 'block' : 'none' }}
                />

                {/* Placeholder when not scanning */}
                {!scanning && !success && !loading && (
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <Camera className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">اضغط لتشغيل الكاميرا ومسح الرمز</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="w-full aspect-square bg-blue-50 rounded-lg flex flex-col items-center justify-center">
                        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                        <p className="text-blue-600">جاري تسجيل الحضور...</p>
                    </div>
                )}

                {/* Success State */}
                {success && (
                    <div className="w-full aspect-square bg-green-50 rounded-lg flex flex-col items-center justify-center">
                        <CheckCircle className="h-20 w-20 text-green-600 mb-4" />
                        <p className="text-green-700 font-bold text-lg">{success}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                                setSuccess(null);
                                startScanner();
                            }}
                        >
                            <RefreshCw className="h-4 w-4 ml-2" />
                            مسح آخر
                        </Button>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Action Buttons */}
                {!success && (
                    <div className="flex gap-3">
                        {!scanning ? (
                            <Button onClick={startScanner} className="flex-1" disabled={loading}>
                                <Camera className="h-4 w-4 ml-2" />
                                تشغيل الكاميرا
                            </Button>
                        ) : (
                            <Button onClick={stopScanner} variant="destructive" className="flex-1">
                                <CameraOff className="h-4 w-4 ml-2" />
                                إيقاف الكاميرا
                            </Button>
                        )}
                    </div>
                )}

                {/* Current Time */}
                <div className="text-center text-gray-500 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleTimeString('ar-EG')}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default QRCodeScanner;
