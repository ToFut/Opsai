export interface UIComponent {
    id: string;
    type: string;
    props: Record<string, any>;
    children?: UIComponent[];
    style?: CSSProperties;
    className?: string;
}
export interface CSSProperties {
    [key: string]: string | number | undefined;
}
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
    required: boolean;
    placeholder?: string;
    options?: SelectOption[];
    validation?: ValidationRule[];
    defaultValue?: any;
}
export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}
export interface ValidationRule {
    type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
}
export interface DataTableConfig {
    columns: DataTableColumn[];
    dataSource: string;
    pagination?: PaginationConfig;
    sorting?: SortingConfig;
    filtering?: FilteringConfig;
    actions?: TableAction[];
}
export interface DataTableColumn {
    field: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'action';
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
    formatter?: string;
}
export interface PaginationConfig {
    pageSize: number;
    pageSizeOptions: number[];
    showSizeChanger: boolean;
    showQuickJumper: boolean;
}
export interface SortingConfig {
    defaultSortField?: string;
    defaultSortOrder?: 'asc' | 'desc';
    multiSort: boolean;
}
export interface FilteringConfig {
    globalSearch: boolean;
    columnFilters: boolean;
    dateRangeFilter?: boolean;
}
export interface TableAction {
    label: string;
    type: 'button' | 'link' | 'dropdown';
    action: string;
    target?: string;
    icon?: string;
    disabled?: boolean;
    confirm?: string;
}
export interface ChartConfig {
    type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
    dataSource: string;
    xAxis?: AxisConfig;
    yAxis?: AxisConfig;
    series?: SeriesConfig[];
    options?: ChartOptions;
}
export interface AxisConfig {
    field: string;
    label: string;
    type: 'category' | 'time' | 'linear';
    format?: string;
}
export interface SeriesConfig {
    name: string;
    dataField: string;
    color?: string;
    type?: string;
}
export interface ChartOptions {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins?: Record<string, any>;
    scales?: Record<string, any>;
}
export interface Theme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        success: string;
        warning: string;
        error: string;
        info: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
    };
    typography: {
        fontFamily: string;
        fontSize: {
            xs: string;
            sm: string;
            base: string;
            lg: string;
            xl: string;
            '2xl': string;
            '3xl': string;
        };
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        full: string;
    };
}
//# sourceMappingURL=ui.d.ts.map