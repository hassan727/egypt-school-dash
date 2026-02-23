export const SCHOOL_INFO = {
    name: 'مدرسة جاد الله',
    logo: '/شعار المدرسة.jpg',
    address: 'مصر',
} as const;

export const getCurrentAcademicYear = (): string => {
    return `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
};
