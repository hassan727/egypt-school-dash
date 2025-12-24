import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, CheckCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DocumentCategoryManager } from "@/components/hr/documents/DocumentCategoryManager";

export interface PendingDocument {
    id: string;
    file: File;
    type: string;
    name: string;
    categoryId?: string;
}

interface DocumentsSectionProps {
    data: PendingDocument[];
    onSave: (docs: PendingDocument[]) => void;
    isReadOnly?: boolean;
}

export const DocumentsSection = ({ data, onSave, isReadOnly = false }: DocumentsSectionProps) => {
    const [activeFiles, setActiveFiles] = useState<PendingDocument[]>(data);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    // Sync external data changes if any (though usually one-way from here to parent)
    // useEffect(() => { setActiveFiles(data); }, [data]); 
    // ^ Avoiding loop if parent updates reference. We rely on internal state and push up.

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (!selectedCategory) {
                toast.error("يرجى اختيار تصنيف أولاً");
                return;
            }

            const newDoc: PendingDocument = {
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                type: 'uploaded',
                name: file.name,
                categoryId: selectedCategory.id
            };

            const updated = [...activeFiles, newDoc];
            setActiveFiles(updated);
            onSave(updated); // Propagate change immediately

            toast.success(`تم إضافة ${file.name}`);
            e.target.value = ""; // Reset input
        }
    };

    const removeFile = (id: string) => {
        const updated = activeFiles.filter(d => d.id !== id);
        setActiveFiles(updated);
        onSave(updated);
    };

    return (
        <Card className="border-orange-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500" />
            <CardHeader className="bg-orange-50/30 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-orange-800">
                    <span className="flex items-center gap-2">📂 مستندات التعيين</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6 h-[500px]">

                    {/* Left: Category Manager */}
                    <div className="w-full md:w-1/3 border rounded-lg bg-gray-50/50 p-4 overflow-hidden flex flex-col">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">اختر التصنيف</h4>
                        <div className="flex-1 overflow-auto">
                            <DocumentCategoryManager
                                onCategorySelect={setSelectedCategory}
                                selectedCategoryId={selectedCategory?.id}
                            />
                        </div>
                    </div>

                    {/* Right: Upload Area & List */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border rounded-lg p-6 flex-1 flex flex-col">

                            {/* Upload Zone */}
                            {selectedCategory ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <span className="text-orange-500">📂</span>
                                            رفع ملف في: <span className="text-blue-600">{selectedCategory.name}</span>
                                        </h4>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-orange-50/30 hover:border-orange-200 transition relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileSelect}
                                            disabled={isReadOnly}
                                            accept=".pdf,.jpg,.png,.doc,.docx"
                                        />
                                        <div className="space-y-2 pointer-events-none">
                                            <div className="mx-auto w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <span className="font-semibold text-orange-600">اضغط للرفع</span> أو اسحب الملف هنا
                                            </div>
                                            <p className="text-xs text-gray-400">PDF, Images up to 5MB</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-3xl">👈</span>
                                    </div>
                                    <p>يرجى اختيار تصنيف من القائمة اليمنى للبدء</p>
                                </div>
                            )}

                            {/* File List */}
                            {activeFiles.length > 0 && (
                                <div className="mt-6 border-t pt-4 flex-1 overflow-auto">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">الملفات الجاهزة للرفع ({activeFiles.length})</h5>
                                    <div className="space-y-2">
                                        {activeFiles.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate">{doc.name}</span>
                                                        <span className="text-[10px] text-gray-500">جاهز للرفع</span>
                                                    </div>
                                                </div>
                                                {!isReadOnly && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeFile(doc.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Status Footer */}
                <div className="flex justify-end border-t pt-4 mt-6">
                    {activeFiles.length > 0 ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>تم تحديد {activeFiles.length} ملفات</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">لم يتم تحديد ملفات بعد</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
