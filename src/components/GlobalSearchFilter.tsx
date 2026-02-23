import { useState, useEffect, useMemo } from 'react';
import { STAGES_AND_CLASSES_DATA } from '@/hooks/useStagesAndClasses';
import { useNavigate } from 'react-router-dom';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { cn } from "@/lib/utils";

export const GlobalSearchFilter = () => {
    const navigate = useNavigate();
    const {
        selectedYear,
        setSelectedYear,
        selectedStage,
        setSelectedStage,
        selectedClass,
        setSelectedClass,
        academicYears,
        stagesClasses,
        loading: contextLoading
    } = useGlobalFilter();

    // Search State
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);



    // Derived Filter Options
    const uniqueStages = useMemo(() => {
        const stages = Array.from(new Set(stagesClasses.map(item => item.stage_name)));

        // Sort stages based on the defined order in STAGES_AND_CLASSES_DATA
        const stageOrder = Object.keys(STAGES_AND_CLASSES_DATA);

        return stages.sort((a, b) => {
            const indexA = stageOrder.indexOf(a);
            const indexB = stageOrder.indexOf(b);
            // If both are found in the order list, compare indices
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is found, it comes first
            if (indexA !== -1) return -1;
            // If only B is found, it comes first
            if (indexB !== -1) return 1;
            // Fallback to alphabetical sort for unknown stages
            return a.localeCompare(b, 'ar');
        });
    }, [stagesClasses]);

    const availableClasses = useMemo(() => {
        if (selectedStage === 'all') return [];
        return stagesClasses
            .filter(item => item.stage_name === selectedStage)
            .map(item => item.class_name);
    }, [stagesClasses, selectedStage]);

    // Search Effect
    useEffect(() => {
        const searchStudents = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('id, student_id, full_name_ar, stage, class')
                    .or(`full_name_ar.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%`)
                    .limit(10);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setSearching(false);
            }
        };

        const debounce = setTimeout(searchStudents, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleSelectStudent = (studentId: string) => {
        setOpen(false);
        navigate(`/students/${studentId}`);
    };

    if (contextLoading) {
        return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري التحميل...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full">
            {/* Filters Group */}
            <div className="flex flex-wrap gap-3 flex-1">
                {/* Academic Year */}
                <div className="w-40">
                    <label className="text-xs text-gray-500 mb-1 block">السنة الدراسية</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="السنة" />
                        </SelectTrigger>
                        <SelectContent>
                            {academicYears.map(year => (
                                <SelectItem key={year.id} value={year.year_code}>
                                    {year.year_code} {year.is_active && '(الحالية)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stage (Grade Level) */}
                <div className="w-40">
                    <label className="text-xs text-gray-500 mb-1 block">المرحلة (الصف)</label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {uniqueStages.map(stage => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Class (Section) */}
                <div className="w-40">
                    <label className="text-xs text-gray-500 mb-1 block">الفصل (المجموعة)</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={selectedStage === 'all'}>
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="الكل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            {availableClasses.map(cls => (
                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Smart Search */}
            <div className="w-full lg:w-96 relative">
                <label className="text-xs text-gray-500 mb-1 block">بحث سريع</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-9 bg-background text-muted-foreground font-normal"
                        >
                            <span className="flex items-center gap-2">
                                <Search className="h-4 w-4 opacity-50" />
                                {searchQuery ? searchQuery : "بحث عن طالب بالاسم أو الرقم..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder="اكتب اسم الطالب أو الرقم الأكاديمي..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="text-right"
                            />
                            <CommandList>
                                {searching && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin mb-2" />
                                        جاري البحث...
                                    </div>
                                )}

                                {!searching && searchResults.length === 0 && searchQuery && (
                                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                        لا توجد نتائج
                                    </CommandEmpty>
                                )}

                                {!searching && searchResults.length > 0 && (
                                    <CommandGroup heading="الطلاب المقترحين">
                                        {searchResults.map((student) => (
                                            <CommandItem
                                                key={student.id}
                                                value={student.student_id}
                                                onSelect={() => handleSelectStudent(student.student_id)}
                                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-medium">{student.full_name_ar}</span>
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                        {student.student_id}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {student.stage} - {student.class}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
