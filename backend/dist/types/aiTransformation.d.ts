export interface AIServiceRawResponse {
    success?: boolean;
    metadata?: {
        [key: string]: any;
    };
    extraction_info?: {
        text_length?: number;
        pages_processed?: number;
        confidence_score?: number;
        total_doors_found?: number;
        total_items_found?: number;
    };
    raw_extracted_data?: {
        tables?: Array<{
            rows?: Array<{
                [key: string]: string | undefined;
            }>;
            headers?: string[];
            row_count?: number;
            table_name?: string;
            data_quality?: string;
            table_location?: string;
            extraction_notes?: string;
        }>;
        document_type?: string;
        extraction_method?: string;
        total_tables_found?: number;
        total_rows_extracted?: number;
    };
    original_columns_preserved?: boolean;
    schema_transformations_applied?: boolean;
    errors?: Array<{
        message: string;
        type?: string;
    }>;
    data?: any;
}
export interface DoorScheduleRawRow {
    'NO.'?: string;
    'TYPE'?: string;
    'WIDTH'?: string;
    'HEIGHT'?: string;
    'THICKNESS'?: string;
    'MATERIAL'?: string;
    'FINISH'?: string;
    'MATERIAL TYPE'?: string;
    'H/J'?: string;
    'THRESHOLD'?: string;
    'HDWR SET'?: string;
    'RATING'?: string;
    'COMMENTS'?: string;
    'REV'?: string;
    [key: string]: string | undefined;
}
export interface HardwareDataRawRow {
    'ITEM'?: string;
    'DESCRIPTION'?: string;
    'QUANTITY'?: string;
    'UNIT'?: string;
    'UNIT_COST'?: string;
    'TOTAL_COST'?: string;
    'CATEGORY'?: string;
    'MANUFACTURER'?: string;
    'MODEL'?: string;
    'SPECIFICATION'?: string;
    [key: string]: string | undefined;
}
export interface TransformedDoorScheduleData {
    doorSchedule: {
        summary: {
            totalDoors: number;
            uniqueTypes: number;
            totalCost: number;
        };
    };
    metadata: {
        provider: string;
        processingTime: string;
        confidence: number;
        documentType: string;
        insights: string[];
    };
    rawData?: AIServiceRawResponse;
}
export interface TransformedHardwareData {
    hardwareData: {
        summary: {
            totalItems: number;
            categories: string[];
            totalValue: number;
        };
    };
    metadata: {
        provider: string;
        processingTime: string;
        confidence: number;
        documentType: string;
        insights: string[];
    };
    rawData?: AIServiceRawResponse;
}
export type TransformedAIResponse = TransformedDoorScheduleData | TransformedHardwareData;
export interface TransformationConfig {
    preserveRawData: boolean;
    defaultProvider: string;
    estimationRules: {
        doorCostPerUnit: number;
        hardwareCostMultiplier: number;
    };
    confidenceThreshold: number;
}
export interface TransformationError {
    message: string;
    code: string;
    originalData?: any;
    context?: {
        taskType?: string;
        stage?: string;
    };
}
//# sourceMappingURL=aiTransformation.d.ts.map