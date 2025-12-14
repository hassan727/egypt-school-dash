import { createContext, useContext } from "react";

export interface BatchContextType {
    classId: string | null;
    className: string | null;
    stageId: string | null;
    stageName: string | null;
    academicYear: string | null;
    isLoading: boolean;
    refreshContext: () => void;
    setAcademicYear: (year: string) => void;
}

export const BatchContext = createContext<BatchContextType | undefined>(undefined);

export const useBatchContext = () => {
    const context = useContext(BatchContext);
    if (!context) {
        throw new Error("useBatchContext must be used within a BatchOperationsLayout");
    }
    return context;
};
