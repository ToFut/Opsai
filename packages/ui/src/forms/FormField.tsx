import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Textarea } from '../components/Textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/Select';
import { FormFieldConfig } from './FormGenerator';
import { cn } from '../utils/cn';

interface FormFieldProps {
  field: FormFieldConfig;
  disabled?: boolean;
}

export function FormField({ field, disabled = false }: FormFieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name];

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Textarea
                {...formField}
                placeholder={field.placeholder}
                disabled={disabled}
                className={cn(error && 'border-destructive')}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Select
                value={formField.value}
                onValueChange={formField.onChange}
                disabled={disabled}
              >
                <SelectTrigger className={cn(error && 'border-destructive')}>
                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={field.name}
                  checked={formField.value || false}
                  onChange={formField.onChange}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={field.name} className="text-sm font-normal">
                  {field.label}
                </Label>
              </div>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${field.name}-${option.value}`}
                      value={option.value}
                      checked={formField.value === option.value}
                      onChange={() => formField.onChange(option.value)}
                      disabled={disabled}
                      className="h-4 w-4"
                    />
                    <Label 
                      htmlFor={`${field.name}-${option.value}`}
                      className="text-sm font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                type="date"
                {...formField}
                value={formField.value ? new Date(formField.value).toISOString().split('T')[0] : ''}
                onChange={(e) => formField.onChange(e.target.value ? new Date(e.target.value) : null)}
                disabled={disabled}
                className={cn(error && 'border-destructive')}
              />
            )}
          />
        );

      case 'file':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  formField.onChange(field.multiple ? files : files?.[0]);
                }}
                multiple={field.multiple}
                disabled={disabled}
                className={cn(error && 'border-destructive')}
              />
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                type="number"
                {...formField}
                value={formField.value || ''}
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : '')}
                placeholder={field.placeholder}
                disabled={disabled}
                min={field.validation?.min}
                max={field.validation?.max}
                className={cn(error && 'border-destructive')}
              />
            )}
          />
        );

      default:
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                type={field.type}
                {...formField}
                placeholder={field.placeholder}
                disabled={disabled}
                className={cn(error && 'border-destructive')}
              />
            )}
          />
        );
    }
  };

  // Don't render label for checkbox as it's rendered inline
  if (field.type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderInput()}
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">
            {error.message as string}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {renderInput()}
      
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
    </div>
  );
}