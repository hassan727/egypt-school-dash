import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Trash2, Plus, ArrowRight, Loader2, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { DocumentCategoryManager } from '@/components/hr/documents/DocumentCategoryManager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Document {
    id: string;
    file_name: string;
    category_id: string;
    uploaded_at: string;
    tags: string[];
    expiry_date: string | null;
    notes: string;
    category?: {
        name: string;
    }
}

const EmployeeDocumentsPage = () => {
    const { employeeId } = useParams();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);

    // Upload Form
    const [newDoc, setNewDoc] = useState({
        file: null as File | null,
        tags: '',
        expiry_date: '',
        notes: ''
    });

    useEffect(() => {
        if (employeeId) {
            fetchDocuments();
        }
    }, [employeeId, selectedCategory]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('employee_documents')
                .select('*, category:document_categories(name)')
                .eq('employee_id', employeeId)
                .order('uploaded_at', { ascending: false });

            // Filter by category if one is selected (and its children usually, but let's stick to direct match 
            // or we'd need a recursive query which is complex in client-side Supabase without function. 
            // To be technically correct for UX, clicking a folder should probably show items inside it.
            // For now, let's filter by exact category or show all if nothing selected)
            if (selectedCategory) {
                query = query.eq('category_id', selectedCategory.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!newDoc.file || !selectedCategory) {
            toast.error('يرجى اختيار التصنيف والملف');
            return;
        }

        setUploading(true);
        try {
            const fileExt = newDoc.file.name.split('.').pop();
            const fileName = `${employeeId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Parsing tags
            const tagsArray = newDoc.tags.split(',').map(t => t.trim()).filter(t => t !== '');

            const { error: insertError } = await supabase
                .from('employee_documents')
                .insert([{
                    employee_id: employeeId,
                    category_id: selectedCategory.id,
                    file_name: newDoc.file.name,
                    file_path: filePath,
                    file_size: newDoc.file.size,
                    file_type: newDoc.file.type,
                    tags: tagsArray,
                    expiry_date: newDoc.expiry_date || null,
                    notes: newDoc.notes
                }]);

            if (insertError) throw insertError;

            toast.success('تم رفع المستند بنجاح');
            setOpenUploadDialog(false);
            setNewDoc({ file: null, tags: '', expiry_date: '', notes: '' });
            fetchDocuments();
        } catch (error: any) {
            console.error('Error uploading document:', error);
            toast.error('حدث خطأ أثناء رفع المستند');
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

        try {
            const { error } = await supabase
                .from('employee_documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('تم حذف المستند');
            fetchDocuments();
        } catch (error) {
            toast.error('فشل في حذف المستند');
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Link to={`/hr/employees/${employeeId}`}>
                            <Button variant="default" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowRight className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">إدارة المستندات</h1>
                            <p className="text-gray-500">نظام أرشفة إلكتروني مرن</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Sidebar: Category Tree */}
                    <Card className="w-1/3 md:w-1/4 flex flex-col">
                        <CardContent className="p-4 flex-1 overflow-hidden">
                            <DocumentCategoryManager
                                onCategorySelect={setSelectedCategory}
                                selectedCategoryId={selectedCategory?.id}
                            />
                        </CardContent>
                    </Card>

                    {/* Main Content: Document List */}
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {selectedCategory ? (
                                    <>
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        {selectedCategory.name}
                                    </>
                                ) : (
                                    'جميع المستندات'
                                )}
                            </CardTitle>
                            <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
                                <DialogTrigger asChild>
                                    <Button disabled={!selectedCategory}>
                                        <Plus className="h-4 w-4 ml-2" /> إضافة مستند
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>رفع مستند في: {selectedCategory?.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>الملف</Label>
                                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                                <Input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                                                />
                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                    {newDoc.file ? (
                                                        <>
                                                            <FileText className="h-8 w-8 text-blue-500" />
                                                            <span className="text-sm font-medium text-blue-700">{newDoc.file.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="h-8 w-8 rotate-180" />
                                                            <span>اضغط أو اسحب الملف هنا</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>تاريخ الانتهاء</Label>
                                                <Input
                                                    type="date"
                                                    value={newDoc.expiry_date}
                                                    onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>العلامات (Tags)</Label>
                                                <Input
                                                    placeholder="هام, 2024, موثق..."
                                                    value={newDoc.tags}
                                                    onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>ملاحظات</Label>
                                            <Input
                                                value={newDoc.notes}
                                                onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                                            />
                                        </div>

                                        <Button className="w-full" onClick={handleFileUpload} disabled={uploading}>
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                                            رفع المستند
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="font-medium">لا توجد مستندات</p>
                                    <p className="text-sm">{selectedCategory ? 'في هذا التصنيف' : 'قم باختيار تصنيف لإضافة مستندات'}</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>اسم الملف</TableHead>
                                            {!selectedCategory && <TableHead>التصنيف</TableHead>}
                                            <TableHead>تاريخ الرفع</TableHead>
                                            <TableHead>الصلاحية</TableHead>
                                            <TableHead>العلامات</TableHead>
                                            <TableHead className="text-left">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documents.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    {doc.file_name}
                                                </TableCell>
                                                {!selectedCategory && <TableCell><Badge variant="outline">{doc.category?.name}</Badge></TableCell>}
                                                <TableCell>{format(new Date(doc.uploaded_at), 'yyyy/MM/dd')}</TableCell>
                                                <TableCell>
                                                    {doc.expiry_date ? (
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-sm",
                                                            new Date(doc.expiry_date) < new Date() ? "text-red-600 font-bold" : "text-gray-600"
                                                        )}>
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {format(new Date(doc.expiry_date), 'yyyy/MM/dd')}
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.tags?.map((tag, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs px-1 py-0">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" title="تحميل">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDocument(doc.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDocumentsPage;
