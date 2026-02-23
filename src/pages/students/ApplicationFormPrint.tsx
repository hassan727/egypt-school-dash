import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface StudentData {
    student_id: string; full_name_ar: string; national_id: string; date_of_birth: string;
    place_of_birth: string; nationality: string; gender: string; religion: string; special_needs: string;
    stage: string; class: string; academic_year: string; enrollment_type: string; enrollment_date: string;
    admission_date: string; previous_school: string; transfer_reason: string; previous_level: string;
    second_language: string; curriculum_type: string; has_repeated: boolean; order_among_siblings: number; is_regular: boolean;
    guardian_full_name: string; guardian_relationship: string; guardian_national_id: string; guardian_nationality: string;
    guardian_job: string; guardian_workplace: string; guardian_education_level: string; guardian_phone: string;
    guardian_whatsapp: string; guardian_email: string; guardian_address: string; guardian_marital_status: string;
    mother_full_name: string; mother_national_id: string; mother_nationality: string; mother_job: string;
    mother_workplace: string; mother_phone: string; mother_whatsapp: string; mother_email: string;
    mother_education_level: string; mother_address: string; mother_relationship: string;
}

interface EmergencyContact { contact_name: string; phone: string; relationship: string; address: string; }

export default function ApplicationFormPrint() {
    const { studentId } = useParams<{ studentId: string }>();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") as "filled" | "empty" || "filled";
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentData | null>(null);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;
            try {
                const { data: studentData, error } = await supabase.from("students").select("*").eq("student_id", studentId).single();
                if (error) throw error;
                const { data: contactsData } = await supabase.from("emergency_contacts").select("*").eq("student_id", studentId);
                setStudent(studentData);
                setEmergencyContacts(contactsData || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [studentId]);

    useEffect(() => { if (!loading && student) setTimeout(() => window.print(), 1000); }, [loading, student]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><span className="mr-2">جاري التجهيز...</span></div>;
    if (!student && mode === 'filled') return <div className="p-8 text-center text-red-500">لم يتم العثور على الطالب</div>;

    const v = (val: any, fb = '................'): string => mode === 'empty' || !val ? fb : String(val);
    const fmtDate = (d: string | null): string => { if (mode === 'empty' || !d) return '../../....'; try { return format(new Date(d), 'yyyy/MM/dd'); } catch { return d; } };
    const bool = (b: boolean | null): string => mode === 'empty' ? '....' : (b ? 'نعم' : 'لا');
    const d = student || {} as StudentData;

    return (
        <>
            <style>{`
                @media print { @page { size: A4; margin: 8mm; } .page2 { page-break-before: always; } }
                .sec { border: 1.5px solid #333; border-radius: 4px; margin-bottom: 8px; }
                .sec-h { background: #e5e7eb; padding: 4px 10px; font-weight: bold; font-size: 13px; border-bottom: 1.5px solid #333; }
                .sec-b { padding: 8px 10px; }
                .row { display: flex; gap: 12px; margin-bottom: 6px; }
                .fld { display: flex; align-items: baseline; gap: 4px; flex: 1; }
                .fld label { font-weight: bold; white-space: nowrap; font-size: 12px; }
                .fld span { border-bottom: 1.5px dotted #666; flex: 1; font-size: 13px; }
            `}</style>

            <div style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '13px', direction: 'rtl' }}>

                {/* ===== الصفحة 1 ===== */}
                <div style={{ padding: '12px' }}>
                    {/* الترويسة */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>محافظة: ...................</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>إدارة: ............... التعليمية</div>
                            <div style={{ fontSize: '18px', fontWeight: 900, marginTop: '6px' }}>مدرسة جاد الله الخاصة</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <img src="/شعار المدرسة.jpg" alt="" style={{ height: '60px', width: '60px', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                            <div style={{ fontSize: '18px', fontWeight: 900, border: '2px solid black', padding: '4px 16px', marginTop: '4px' }}>طلب التحاق</div>
                        </div>
                        <div style={{ border: '1.5px solid black', width: '70px', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', textAlign: 'center' }}>صورة<br />4×6</div>
                    </div>

                    {/* شريط المعلومات */}
                    <div style={{ background: '#f3f4f6', border: '1.5px solid #999', borderRadius: '4px', padding: '6px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                        <span>الكود: <span style={{ color: '#1d4ed8' }}>{v(d.student_id)}</span></span>
                        <span>العام: <span style={{ color: '#1d4ed8' }}>{v(d.academic_year)}</span></span>
                        <span>التاريخ: {format(new Date(), 'yyyy/MM/dd')}</span>
                    </div>

                    {/* البيانات الشخصية */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#bfdbfe' }}>👤 البيانات الشخصية</div>
                        <div className="sec-b">
                            <div className="row"><Fld l="الاسم رباعي" v={v(d.full_name_ar)} f={3} /><Fld l="الرقم القومي" v={v(d.national_id)} f={2} /></div>
                            <div className="row"><Fld l="تاريخ الميلاد" v={fmtDate(d.date_of_birth)} /><Fld l="محل الميلاد" v={v(d.place_of_birth)} /><Fld l="الجنسية" v={v(d.nationality)} /><Fld l="النوع" v={v(d.gender)} /></div>
                            <div className="row"><Fld l="الديانة" v={v(d.religion)} /><Fld l="احتياجات خاصة" v={v(d.special_needs, 'لا يوجد')} f={3} /></div>
                        </div>
                    </div>

                    {/* بيانات القيد */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#bbf7d0' }}>📚 بيانات القيد الدراسي</div>
                        <div className="sec-b">
                            <div className="row"><Fld l="المرحلة" v={v(d.stage)} f={2} /><Fld l="الفصل" v={v(d.class)} /><Fld l="نوع القيد" v={v(d.enrollment_type)} /><Fld l="المنهج" v={v(d.curriculum_type)} /></div>
                            <div className="row"><Fld l="تاريخ الالتحاق" v={fmtDate(d.admission_date || d.enrollment_date)} /><Fld l="اللغة الثانية" v={v(d.second_language, 'لا يوجد')} /><Fld l="المستوى السابق" v={v(d.previous_level, '—')} /><Fld l="ترتيبه" v={v(d.order_among_siblings)} /></div>
                            <div className="row"><Fld l="منتظم" v={bool(d.is_regular)} /><Fld l="سبق الرسوب" v={bool(d.has_repeated)} /></div>
                        </div>
                    </div>

                    {/* بيانات ولي الأمر */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#e9d5ff' }}>👨‍👩‍👧 بيانات ولي الأمر</div>
                        <div className="sec-b">
                            <div className="row"><Fld l="الاسم الكامل" v={v(d.guardian_full_name)} f={3} /><Fld l="صلة القرابة" v={v(d.guardian_relationship)} /></div>
                            <div className="row"><Fld l="الرقم القومي" v={v(d.guardian_national_id)} /><Fld l="الجنسية" v={v(d.guardian_nationality)} /><Fld l="المؤهل" v={v(d.guardian_education_level)} /><Fld l="الحالة" v={v(d.guardian_marital_status)} /></div>
                            <div className="row"><Fld l="الوظيفة" v={v(d.guardian_job)} /><Fld l="جهة العمل" v={v(d.guardian_workplace)} f={2} /></div>
                            <div className="row"><Fld l="الهاتف" v={v(d.guardian_phone)} /><Fld l="الواتساب" v={v(d.guardian_whatsapp)} /><Fld l="البريد" v={v(d.guardian_email, '—')} /></div>
                            <div className="row"><Fld l="العنوان" v={v(d.guardian_address)} f={4} /></div>
                        </div>
                    </div>

                    {/* بيانات الأم */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#fbcfe8' }}>👩 بيانات الأم</div>
                        <div className="sec-b">
                            <div className="row"><Fld l="الاسم الكامل" v={v(d.mother_full_name)} f={3} /><Fld l="الرقم القومي" v={v(d.mother_national_id)} /></div>
                            <div className="row"><Fld l="الجنسية" v={v(d.mother_nationality)} /><Fld l="المؤهل" v={v(d.mother_education_level)} /><Fld l="الوظيفة" v={v(d.mother_job)} /><Fld l="جهة العمل" v={v(d.mother_workplace)} /></div>
                            <div className="row"><Fld l="الهاتف" v={v(d.mother_phone)} /><Fld l="الواتساب" v={v(d.mother_whatsapp)} /><Fld l="البريد" v={v(d.mother_email, '—')} /></div>
                            <div className="row"><Fld l="العنوان" v={v(d.mother_address)} f={4} /></div>
                        </div>
                    </div>
                </div>

                {/* ===== الصفحة 2 ===== */}
                <div className="page2" style={{ padding: '12px' }}>
                    {/* ترويسة مصغرة */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #333', paddingBottom: '6px', marginBottom: '12px', fontSize: '11px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>طلب التحاق - تابع</span>
                        <span><b>الطالب:</b> {v(d.full_name_ar)}</span>
                        <span><b>الكود:</b> {v(d.student_id)}</span>
                        <span style={{ fontWeight: 'bold' }}>صفحة 2/2</span>
                    </div>

                    {/* الوصاية القانونية */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#c7d2fe' }}>⚖️ الوصاية القانونية</div>
                        <div className="sec-b">
                            <div style={{ background: '#fef9c3', border: '1px solid #eab308', borderRadius: '4px', padding: '6px', marginBottom: '8px', fontSize: '11px' }}>
                                ⚠️ الوصي القانوني هو المخول باتخاذ القرارات التعليمية والمالية والطبية نيابة عن الطالب
                            </div>
                            <div className="row"><Fld l="الوصي القانوني" v={v(d.guardian_full_name)} f={2} /><Fld l="صلة القرابة" v={v(d.guardian_relationship)} /></div>
                            <div className="row"><Fld l="الهاتف" v={v(d.guardian_phone)} /><Fld l="الواتساب" v={v(d.guardian_whatsapp)} /><Fld l="البريد" v={v(d.guardian_email, '—')} /></div>
                        </div>
                    </div>

                    {/* جهات الطوارئ */}
                    <div className="sec">
                        <div className="sec-h" style={{ background: '#fed7aa' }}>🆘 جهات الاتصال للطوارئ</div>
                        <div className="sec-b">
                            {mode === 'filled' && emergencyContacts.length > 0 ? (
                                emergencyContacts.map((c, i) => (
                                    <div className="row" key={i}><Fld l={`جهة ${i + 1}`} v={c.contact_name} /><Fld l="القرابة" v={c.relationship} /><Fld l="الهاتف" v={c.phone} /><Fld l="العنوان" v={c.address} f={2} /></div>
                                ))
                            ) : (
                                <>
                                    <div className="row"><Fld l="جهة 1" v=".............." /><Fld l="القرابة" v="........" /><Fld l="الهاتف" v=".............." /><Fld l="العنوان" v=".............." /></div>
                                    <div className="row"><Fld l="جهة 2" v=".............." /><Fld l="القرابة" v="........" /><Fld l="الهاتف" v=".............." /><Fld l="العنوان" v=".............." /></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* الإقرار والتعهد */}
                    <div style={{ borderTop: '2px solid black', paddingTop: '12px', marginTop: '16px' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>📜 الإقرار والتعهد</h4>
                        <p style={{ textAlign: 'justify', lineHeight: 1.8, fontSize: '12px' }}>
                            أقر أنا ولي أمر الطالب المذكور أعلاه بأن جميع البيانات المدونة بهذا الطلب صحيحة وتحت مسئوليتي الشخصية،
                            وأتعهد بالالتزام بكافة اللوائح والقوانين المدرسية، وسداد المصروفات الدراسية في مواعيدها المقررة،
                            وأوافق على تلقي إشعارات الواتساب المتعلقة بالطالب على الرقم المسجل.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
                            <div><p style={{ fontWeight: 'bold', marginBottom: '30px' }}>التاريخ</p><p style={{ borderBottom: '1.5px solid black' }}>..../..../........ م</p></div>
                            <div><p style={{ fontWeight: 'bold', marginBottom: '30px' }}>توقيع ولي الأمر</p><p style={{ borderBottom: '1.5px solid black' }}>........................</p></div>
                            <div><p style={{ fontWeight: 'bold', marginBottom: '30px' }}>توقيع الطالب</p><p style={{ borderBottom: '1.5px solid black' }}>........................</p></div>
                        </div>
                    </div>

                    {/* خاص بشئون الطلبة */}
                    <div style={{ border: '2px dashed #666', borderRadius: '4px', padding: '12px', marginTop: '20px', background: '#f9fafb' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>📋 خاص بشئون الطلبة:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '14px', border: '1.5px solid black', display: 'inline-block' }}></span>مستوفي المستندات</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '14px', border: '1.5px solid black', display: 'inline-block' }}></span>تم مراجعة البيانات</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '14px', border: '1.5px solid black', display: 'inline-block' }}></span>تم السداد</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '14px', border: '1.5px solid black', display: 'inline-block' }}></span>تم القبول</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
                            <span>الموظف المختص: ......................</span>
                            <span>التوقيع: ......................</span>
                            <span>التاريخ: ..../..../........</span>
                        </div>
                    </div>

                    {/* تذييل */}
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', color: '#888', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
                        نظام إدارة المدرسة الذكي | {format(new Date(), 'yyyy/MM/dd HH:mm')}
                    </div>
                </div>
            </div>
        </>
    );
}

function Fld({ l, v, f = 1 }: { l: string; v: string; f?: number }) {
    return (
        <div className="fld" style={{ flex: f }}>
            <label>{l}:</label>
            <span>{v}</span>
        </div>
    );
}
