import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Save, X, ChevronRight, ChevronDown, Layers, School } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Class {
    id: string;
    name: string;
    stage_id: string;
    student_count?: number;
}

interface Stage {
    id: string;
    name: string;
    classes: Class[];
}

export default function StagesClasses() {
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    // Dialog States
    const [isAddStageOpen, setIsAddStageOpen] = useState(false);
    const [newStageName, setNewStageName] = useState('');

    const [isAddClassOpen, setIsAddClassOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
    const [newClassName, setNewClassName] = useState('');

    const [editingStage, setEditingStage] = useState<{ id: string, name: string } | null>(null);
    const [editingClass, setEditingClass] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Stages
            const { data: stagesData, error: stagesError } = await supabase
                .from('stages')
                .select('*')
                .order('created_at', { ascending: true });

            if (stagesError) throw stagesError;

            // Fetch Classes
            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('*, students(count)') // Get student count if possible, or just count later
                .order('name', { ascending: true });

            if (classesError) throw classesError;

            // Organize data
            const organizedStages = stagesData.map(stage => ({
                ...stage,
                classes: classesData.filter(c => c.stage_id === stage.id)
            }));

            setStages(organizedStages);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل البيانات",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleStage = (stageId: string) => {
        const newExpanded = new Set(expandedStages);
        if (newExpanded.has(stageId)) {
            newExpanded.delete(stageId);
        } else {
            newExpanded.add(stageId);
        }
        setExpandedStages(newExpanded);
    };

    // --- Stage Actions ---

    const handleAddStage = async () => {
        if (!newStageName.trim()) return;

        try {
            const { error } = await supabase
                .from('stages')
                .insert([{ name: newStageName }]);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم إضافة المرحلة بنجاح" });
            setNewStageName('');
            setIsAddStageOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل إضافة المرحلة", variant: "destructive" });
        }
    };

    const handleUpdateStage = async () => {
        if (!editingStage || !editingStage.name.trim()) return;

        try {
            const { error } = await supabase
                .from('stages')
                .update({ name: editingStage.name })
                .eq('id', editingStage.id);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم تحديث اسم المرحلة" });
            setEditingStage(null);
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل تحديث المرحلة", variant: "destructive" });
        }
    };

    const handleDeleteStage = async (stageId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه المرحلة؟ سيتم حذف جميع الفصول المرتبطة بها!")) return;

        try {
            const { error } = await supabase
                .from('stages')
                .delete()
                .eq('id', stageId);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم حذف المرحلة" });
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "لا يمكن حذف المرحلة لوجود بيانات مرتبطة بها", variant: "destructive" });
        }
    };

    // --- Class Actions ---

    const handleAddClass = async () => {
        if (!newClassName.trim() || !selectedStageId) return;

        try {
            const { error } = await supabase
                .from('classes')
                .insert([{ name: newClassName, stage_id: selectedStageId }]);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم إضافة الفصل بنجاح" });
            setNewClassName('');
            setIsAddClassOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل إضافة الفصل", variant: "destructive" });
        }
    };

    const handleUpdateClass = async () => {
        if (!editingClass || !editingClass.name.trim()) return;

        try {
            const { error } = await supabase
                .from('classes')
                .update({ name: editingClass.name })
                .eq('id', editingClass.id);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم تحديث اسم الفصل" });
            setEditingClass(null);
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل تحديث الفصل", variant: "destructive" });
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الفصل؟")) return;

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

            if (error) throw error;

            toast({ title: "تم بنجاح", description: "تم حذف الفصل" });
            fetchData();
        } catch (error) {
            toast({ title: "خطأ", description: "لا يمكن حذف الفصل لوجود طلاب مرتبطين به", variant: "destructive" });
        }
    };

    return (
        <DashboardLayout>
            <PageLayout title="إدارة المراحل والفصول" description="إضافة وتعديل المراحل الدراسية والفصول">
                <div className="space-y-6">

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">الهيكل التعليمي</h2>
                        <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 ml-2" />
                                    إضافة مرحلة جديدة
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة مرحلة دراسية جديدة</DialogTitle>
                                    <DialogDescription>
                                        أدخل اسم المرحلة الجديدة (مثال: الصف الأول الابتدائي)
                                    </DialogDescription>
                                </DialogHeader>
                                <Input
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    placeholder="اسم المرحلة"
                                />
                                <DialogFooter>
                                    <Button onClick={handleAddStage}>حفظ</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <p>جاري التحميل...</p>
                        ) : stages.length === 0 ? (
                            <p className="text-center text-gray-500">لا توجد مراحل مضافة</p>
                        ) : (
                            stages.map((stage) => (
                                <Card key={stage.id} className="overflow-hidden border-l-4 border-l-blue-500">
                                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleStage(stage.id)}>
                                            {expandedStages.has(stage.id) ? (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-gray-500" />
                                            )}

                                            {editingStage?.id === stage.id ? (
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        value={editingStage.name}
                                                        onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                                                        className="h-8 w-64"
                                                    />
                                                    <Button size="sm" variant="ghost" onClick={handleUpdateStage}><Save className="h-4 w-4 text-green-600" /></Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingStage(null)}><X className="h-4 w-4 text-red-600" /></Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Layers className="h-5 w-5 text-blue-600" />
                                                    <h3 className="font-bold text-lg">{stage.name}</h3>
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        {stage.classes.length} فصول
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingStage({ id: stage.id, name: stage.name })}>
                                                <Edit2 className="h-4 w-4 text-gray-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteStage(stage.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mr-2"
                                                onClick={() => {
                                                    setSelectedStageId(stage.id);
                                                    setIsAddClassOpen(true);
                                                }}
                                            >
                                                <Plus className="h-4 w-4 ml-1" />
                                                إضافة فصل
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedStages.has(stage.id) && (
                                        <CardContent className="p-4 bg-white">
                                            {stage.classes.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">لا توجد فصول في هذه المرحلة</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {stage.classes.map((cls) => (
                                                        <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors group">
                                                            {editingClass?.id === cls.id ? (
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <Input
                                                                        value={editingClass.name}
                                                                        onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                                                                        className="h-8"
                                                                    />
                                                                    <Button size="sm" variant="ghost" onClick={handleUpdateClass}><Save className="h-4 w-4 text-green-600" /></Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditingClass(null)}><X className="h-4 w-4 text-red-600" /></Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <School className="h-4 w-4 text-gray-400" />
                                                                        <span className="font-medium">{cls.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingClass({ id: cls.id, name: cls.name })}>
                                                                            <Edit2 className="h-3 w-3 text-gray-500" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClass(cls.id)}>
                                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Add Class Dialog */}
                    <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة فصل جديد</DialogTitle>
                                <DialogDescription>
                                    أدخل اسم الفصل (مثال: 1/1 أو A)
                                </DialogDescription>
                            </DialogHeader>
                            <Input
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="اسم الفصل"
                            />
                            <DialogFooter>
                                <Button onClick={handleAddClass}>حفظ</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </PageLayout>
        </DashboardLayout>
    );
}
