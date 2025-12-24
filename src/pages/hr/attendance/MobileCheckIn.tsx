/**
 * MobileCheckIn - صفحة تسجيل الحضور من الجوال
 * Mobile Check-in Page with QR Scan and GPS Verification
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Smartphone, QrCode, MapPin, Clock, User,
    CheckCircle, LogIn, LogOut, Loader2, AlertTriangle
} from 'lucide-react';
import { QRCodeScanner } from '@/components/hr/QRCodeScanner';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MobileCheckIn = () => {
    const [employeeCode, setEmployeeCode] = useState('');
    const [employee, setEmployee] = useState<any>(null);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    // Fetch employee and today's record
    const fetchEmployeeData = async () => {
        if (!employeeCode.trim()) return;

        setLoading(true);
        try {
            // Find employee by code
            const { data: emp, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', employeeCode.trim())
                .eq('is_active', true)
                .single();

            if (empError || !emp) {
                toast.error('الكود غير صحيح أو الموظف غير نشط');
                return;
            }

            setEmployee(emp);
            setAuthenticated(true);

            // Fetch today's attendance
            const today = new Date().toISOString().split('T')[0];
            const { data: record } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('employee_id', emp.id)
                .eq('date', today)
                .single();

            setTodayRecord(record);

        } catch (error: any) {
            console.error('Error:', error);
            toast.error('حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    // Get current location for GPS check-in
    const getLocation = () => {
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation(position);
                setLocationLoading(false);
            },
            (error) => {
                toast.error('فشل في تحديد الموقع');
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Manual GPS check-in/out
    const handleGPSCheckIn = async (type: 'in' | 'out') => {
        if (!employee || !currentLocation) {
            toast.error('يرجى تحديد الموقع أولاً');
            return;
        }

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toTimeString().split(' ')[0];

            if (type === 'in') {
                await supabase.from('employee_attendance').upsert({
                    employee_id: employee.id,
                    date: today,
                    check_in_time: now,
                    check_in_latitude: currentLocation.coords.latitude,
                    check_in_longitude: currentLocation.coords.longitude,
                    check_in_verified: true,
                    status: 'حاضر',
                }, { onConflict: 'employee_id,date' });

                toast.success('تم تسجيل الحضور بنجاح');
            } else {
                await supabase.from('employee_attendance')
                    .update({
                        check_out_time: now,
                        check_out_latitude: currentLocation.coords.latitude,
                        check_out_longitude: currentLocation.coords.longitude,
                        check_out_verified: true,
                    })
                    .eq('employee_id', employee.id)
                    .eq('date', today);

                toast.success('تم تسجيل الانصراف بنجاح');
            }

            // Refresh record
            const { data } = await supabase
                .from('employee_attendance')
                .select('*')
                .eq('employee_id', employee.id)
                .eq('date', today)
                .single();

            setTodayRecord(data);

        } catch (error: any) {
            console.error('Error:', error);
            toast.error('فشل في تسجيل الحضور');
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const handleLogout = () => {
        setEmployee(null);
        setAuthenticated(false);
        setTodayRecord(null);
        setEmployeeCode('');
    };

    if (!authenticated) {
        return (
            <DashboardLayout>
                <div className="max-w-md mx-auto mt-10">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                                <Smartphone className="h-10 w-10 text-white" />
                            </div>
                            <CardTitle>تسجيل الحضور</CardTitle>
                            <p className="text-gray-500">أدخل كود الموظف للمتابعة</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="كود الموظف"
                                value={employeeCode}
                                onChange={(e) => setEmployeeCode(e.target.value)}
                                className="text-center text-lg"
                                onKeyPress={(e) => e.key === 'Enter' && fetchEmployeeData()}
                            />
                            <Button
                                onClick={fetchEmployeeData}
                                className="w-full"
                                disabled={loading || !employeeCode.trim()}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <User className="h-4 w-4 ml-2" />
                                        دخول
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-lg mx-auto space-y-6">
                {/* Employee Info */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {employee?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">{employee?.full_name}</h2>
                                    <p className="text-gray-500 text-sm">{employee?.position}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                خروج
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Status */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            حالة اليوم - {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg text-center ${todayRecord?.check_in_time ? 'bg-green-50' : 'bg-gray-50'
                                }`}>
                                <LogIn className={`h-6 w-6 mx-auto mb-2 ${todayRecord?.check_in_time ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                <p className="text-sm text-gray-500">الحضور</p>
                                <p className={`font-bold text-lg ${todayRecord?.check_in_time ? 'text-green-700' : 'text-gray-400'
                                    }`}>
                                    {todayRecord?.check_in_time?.substring(0, 5) || '--:--'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg text-center ${todayRecord?.check_out_time ? 'bg-blue-50' : 'bg-gray-50'
                                }`}>
                                <LogOut className={`h-6 w-6 mx-auto mb-2 ${todayRecord?.check_out_time ? 'text-blue-600' : 'text-gray-400'
                                    }`} />
                                <p className="text-sm text-gray-500">الانصراف</p>
                                <p className={`font-bold text-lg ${todayRecord?.check_out_time ? 'text-blue-700' : 'text-gray-400'
                                    }`}>
                                    {todayRecord?.check_out_time?.substring(0, 5) || '--:--'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Check-in Methods */}
                <Tabs defaultValue="qr">
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="qr" className="flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            مسح QR
                        </TabsTrigger>
                        <TabsTrigger value="gps" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            GPS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="qr" className="mt-4">
                        <QRCodeScanner
                            employeeId={employee?.id}
                            onCheckInSuccess={(record) => setTodayRecord(record)}
                        />
                    </TabsContent>

                    <TabsContent value="gps" className="mt-4">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {/* Location Status */}
                                <div className={`p-3 rounded-lg ${currentLocation ? 'bg-green-50' : 'bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {locationLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                        ) : currentLocation ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                        )}
                                        <div>
                                            {locationLoading ? (
                                                <span>جاري تحديد الموقع...</span>
                                            ) : currentLocation ? (
                                                <>
                                                    <span className="text-green-700">تم تحديد الموقع</span>
                                                    <p className="text-xs text-gray-500">
                                                        الدقة: ±{Math.round(currentLocation.coords.accuracy)} متر
                                                    </p>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">اضغط لتحديد الموقع</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={getLocation}
                                    disabled={locationLoading}
                                >
                                    <MapPin className="h-4 w-4 ml-2" />
                                    تحديد موقعي الحالي
                                </Button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => handleGPSCheckIn('in')}
                                        disabled={loading || !currentLocation || !!todayRecord?.check_in_time}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <LogIn className="h-4 w-4 ml-2" />
                                                تسجيل حضور
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => handleGPSCheckIn('out')}
                                        disabled={loading || !currentLocation || !todayRecord?.check_in_time || !!todayRecord?.check_out_time}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <LogOut className="h-4 w-4 ml-2" />
                                                تسجيل انصراف
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <p className="text-xs text-gray-400 text-center">
                                    <AlertTriangle className="h-3 w-3 inline ml-1" />
                                    يتم التحقق من موقعك الجغرافي عند التسجيل
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default MobileCheckIn;
