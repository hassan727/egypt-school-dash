import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Puzzle, Plus, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { fetchAllFeatures, updateFeature, createFeature } from '@/services/platformService';
import type { Feature } from '@/types/platform';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryLabels: Record<string, string> = {
    core: 'أساسي', academic: 'أكاديمي', management: 'إدارة', hardware: 'أجهزة',
    analytics: 'تحليلات', communication: 'تواصل', services: 'خدمات', general: 'عام',
};

const categoryColors: Record<string, string> = {
    core: 'bg-blue-100 text-blue-700', academic: 'bg-purple-100 text-purple-700',
    management: 'bg-emerald-100 text-emerald-700', hardware: 'bg-orange-100 text-orange-700',
    analytics: 'bg-cyan-100 text-cyan-700', communication: 'bg-pink-100 text-pink-700',
    services: 'bg-amber-100 text-amber-700', general: 'bg-gray-100 text-gray-700',
};

export default function PlatformFeatures() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<Feature>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [newFeature, setNewFeature] = useState({ feature_key: '', feature_name_ar: '', feature_name_en: '', category: 'general', icon: 'Puzzle', description_ar: '' });
    const { toast } = useToast();

    const reload = () => {
        setLoading(true);
        fetchAllFeatures().then(setFeatures).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []);

    const handleSave = async (id: string) => {
        try {
            await updateFeature(id, editValues);
            toast({ title: 'تم الحفظ' });
            setEditingId(null);
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const handleCreate = async () => {
        try {
            await createFeature({ ...newFeature, is_active: true, is_core: false, depends_on: [], sort_order: features.length + 1 });
            toast({ title: 'تم إنشاء الخاصية' });
            setShowCreate(false);
            setNewFeature({ feature_key: '', feature_name_ar: '', feature_name_en: '', category: 'general', icon: 'Puzzle', description_ar: '' });
            reload();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const grouped = features.reduce<Record<string, Feature[]>>((acc, f) => {
        const cat = f.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(f);
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">إدارة الخصائص</h1>
                        <p className="text-muted-foreground mt-1">{features.length} خاصية مسجلة في النظام</p>
                    </div>
                    <Dialog open={showCreate} onOpenChange={setShowCreate}>
                        <DialogTrigger asChild>
                            <Button className="gap-2"><Plus className="h-4 w-4" /> إضافة خاصية</Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                            <DialogHeader><DialogTitle>إضافة خاصية جديدة</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="المفتاح (feature_key) *" value={newFeature.feature_key} onChange={e => setNewFeature(p => ({ ...p, feature_key: e.target.value }))} />
                                    <Input placeholder="الاسم بالعربية *" value={newFeature.feature_name_ar} onChange={e => setNewFeature(p => ({ ...p, feature_name_ar: e.target.value }))} />
                                </div>
                                <Input placeholder="الاسم بالإنجليزية" value={newFeature.feature_name_en} onChange={e => setNewFeature(p => ({ ...p, feature_name_en: e.target.value }))} />
                                <Input placeholder="الوصف" value={newFeature.description_ar} onChange={e => setNewFeature(p => ({ ...p, description_ar: e.target.value }))} />
                                <Select value={newFeature.category} onValueChange={v => setNewFeature(p => ({ ...p, category: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button className="w-full" onClick={handleCreate} disabled={!newFeature.feature_key || !newFeature.feature_name_ar}>إنشاء الخاصية</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="space-y-3">{[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-14" /></Card>)}</div>
                ) : (
                    Object.entries(grouped).map(([category, feats]) => (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                                <Badge className={categoryColors[category]}>{categoryLabels[category] || category}</Badge>
                                <span className="text-muted-foreground text-xs">{feats.length} خصائص</span>
                            </div>
                            <div className="space-y-2">
                                {feats.map(feature => {
                                    const isEditing = editingId === feature.id;
                                    return (
                                        <Card key={feature.id} className={isEditing ? 'ring-2 ring-primary' : ''}>
                                            <div className="p-3 flex items-center gap-4">
                                                <div className="bg-indigo-50 p-2 rounded-lg">
                                                    <Puzzle className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isEditing ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <Input value={editValues.feature_name_ar} onChange={e => setEditValues(p => ({ ...p, feature_name_ar: e.target.value }))} className="h-8 text-sm" />
                                                            <Input value={editValues.feature_name_en} onChange={e => setEditValues(p => ({ ...p, feature_name_en: e.target.value }))} className="h-8 text-sm" />
                                                            <Input value={editValues.description_ar} onChange={e => setEditValues(p => ({ ...p, description_ar: e.target.value }))} className="h-8 text-sm" placeholder="الوصف" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-foreground font-medium text-sm">{feature.feature_name_ar}</span>
                                                            <span className="text-muted-foreground text-xs">{feature.feature_name_en}</span>
                                                            <code className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">{feature.feature_key}</code>
                                                            {feature.is_core && <Badge className="bg-blue-100 text-blue-700 text-[10px]">أساسي</Badge>}
                                                            {feature.depends_on?.length > 0 && (
                                                                <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                                                                    <AlertTriangle className="h-3 w-3" />يعتمد على: {feature.depends_on.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch checked={feature.is_active} onCheckedChange={async (v) => { await updateFeature(feature.id, { is_active: v }); reload(); }} className="scale-75" />
                                                    {isEditing ? (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSave(feature.id)}><Save className="h-3.5 w-3.5" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                                                        </>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => {
                                                            setEditingId(feature.id);
                                                            setEditValues({ feature_name_ar: feature.feature_name_ar, feature_name_en: feature.feature_name_en, description_ar: feature.description_ar });
                                                        }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
