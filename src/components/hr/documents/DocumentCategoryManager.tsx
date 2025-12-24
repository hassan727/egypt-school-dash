import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, FolderOpen, Plus, Trash2, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Category {
    id: string;
    name: string;
    parent_id: string | null;
    is_system: boolean;
    is_required: boolean;
    children?: Category[];
}

interface DocumentCategoryManagerProps {
    onCategorySelect: (category: Category) => void;
    selectedCategoryId?: string;
}

export const DocumentCategoryManager = ({ onCategorySelect, selectedCategoryId }: DocumentCategoryManagerProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [targetParentId, setTargetParentId] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('document_categories').select('*').order('name');
            if (error) throw error;
            const tree = buildTree(data);
            setCategories(tree);
            // Default expand roots
            const initialExpanded: Record<string, boolean> = {};
            tree.forEach(c => initialExpanded[c.id] = true);
            setExpanded(initialExpanded);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('فشل في تحميل التصنيفات');
        } finally {
            setLoading(false);
        }
    };

    const buildTree = (cats: any[]): Category[] => {
        const map: Record<string, Category> = {};
        const roots: Category[] = [];

        cats.forEach(c => {
            map[c.id] = { ...c, children: [] };
        });

        cats.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].children?.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });

        return roots;
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            const { error } = await supabase.from('document_categories').insert([{
                name: newCategoryName,
                parent_id: targetParentId,
                is_system: false,
                is_required: false
            }]);

            if (error) throw error;
            toast.success('تم إضافة التصنيف');
            setIsAddOpen(false);
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            toast.error('فشل في إضافة التصنيف');
        }
    };

    const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

        try {
            const { error } = await supabase.from('document_categories').delete().eq('id', id);
            if (error) throw error;
            toast.success('تم حذف التصنيف');
            fetchCategories();
        } catch (error) {
            toast.error('لا يمكن حذف هذا التصنيف (قد يحتوي على مستندات أو تصنيفات فرعية)');
        }
    };

    const renderTree = (nodes: Category[], level = 0) => {
        return (
            <div className={cn("space-y-1", level > 0 && "mr-4 border-r pr-2 border-gray-100")}>
                {nodes.map(node => (
                    <div key={node.id}>
                        <div
                            className={cn(
                                "flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer group transition-colors",
                                selectedCategoryId === node.id && "bg-blue-50 text-blue-700 border border-blue-100"
                            )}
                            onClick={() => onCategorySelect(node)}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div onClick={(e) => toggleExpand(node.id, e)} className="p-0.5 hover:bg-gray-200 rounded">
                                    {(node.children && node.children.length > 0) ? (
                                        expanded[node.id] ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />
                                    ) : <div className="w-4" />}
                                </div>

                                {expanded[node.id] ? <FolderOpen className="h-4 w-4 text-yellow-500" /> : <Folder className="h-4 w-4 text-yellow-500" />}

                                <span className="truncate text-sm font-medium">{node.name}</span>
                                {node.is_system && <span title="تصنيف نظامي"><Lock className="h-3 w-3 text-gray-300 ml-1" /></span>}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    title="إضافة فرعي"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTargetParentId(node.id);
                                        setIsAddOpen(true);
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                                {!node.is_system && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-600"
                                        onClick={(e) => handleDeleteCategory(node.id, e)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Recursive Children */}
                        {expanded[node.id] && node.children && node.children.length > 0 && (
                            <div className="mt-1">
                                {renderTree(node.children, level + 1)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-lg">التصنيفات</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setTargetParentId(null)}>
                            <Plus className="h-4 w-4 ml-1" /> رئيسي
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {targetParentId ? 'إضافة تصنيف فرعي' : 'إضافة تصنيف رئيسي'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>اسم التصنيف</Label>
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="أدخل اسم التصنيف..."
                                />
                            </div>
                            <Button className="w-full" onClick={handleAddCategory}>إضافة</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 pr-2">
                {renderTree(categories)}
            </ScrollArea>
        </div>
    );
};
