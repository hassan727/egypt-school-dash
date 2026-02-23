import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // تسجيل الخطأ في الكونسول
        console.error('خطأ في المكون:', error, errorInfo);

        this.setState(prevState => ({
            ...prevState,
            errorInfo,
        }));

        // يمكن إرسال الخطأ إلى خدمة تسجيل الأخطاء هنا
        // logErrorToService(error, errorInfo);
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError && error) {
            if (fallback) {
                return fallback(error, this.resetError);
            }

            return (
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-red-100">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                            حدث خطأ ما
                        </h1>

                        <p className="text-gray-600 text-center mb-4">
                            اعتذر، حدث خطأ غير متوقع. يرجى محاولة إعادة تحميل الصفحة.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32 font-mono">
                                <p className="font-semibold mb-1">تفاصيل الخطأ:</p>
                                <p>{error.toString()}</p>
                                {this.state.errorInfo && (
                                    <p className="mt-2 whitespace-pre-wrap text-gray-600">
                                        {this.state.errorInfo.componentStack}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={this.resetError}
                                className="flex-1 gap-2"
                                variant="default"
                            >
                                <RefreshCw className="h-4 w-4" />
                                إعادة محاولة
                            </Button>

                            <Button
                                onClick={() => window.location.href = '/'}
                                className="flex-1"
                                variant="outline"
                            >
                                العودة للرئيسية
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;