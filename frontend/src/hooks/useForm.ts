import { useState, useCallback } from 'react';

type ValidationRules<T> = {
  [K in keyof T]: {
    required?: boolean;
    pattern?: {
      value: RegExp;
      message: string;
    };
    minLength?: {
      value: number;
      message: string;
    };
    maxLength?: {
      value: number;
      message: string;
    };
    validate?: (value: T[keyof T]) => string | undefined;
  };
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | undefined => {
      if (!validationRules || !validationRules[name]) return undefined;

      const rules = validationRules[name];
      let error: string | undefined;

      if (rules.required && !value) {
        error = 'This field is required';
      } else if (rules.pattern && value && !rules.pattern.value.test(String(value))) {
        error = rules.pattern.message;
      } else if (rules.minLength && String(value).length < rules.minLength.value) {
        error = rules.minLength.message;
      } else if (rules.maxLength && String(value).length > rules.maxLength.value) {
        error = rules.maxLength.message;
      } else if (rules.validate) {
        error = rules.validate(value);
      }

      return error;
    },
    [validationRules]
  );

  const validateForm = useCallback((): boolean => {
    if (!validationRules) return true;

    const newErrors: FormErrors<T> = {};
    let isValid = true;

    (Object.keys(validationRules) as Array<keyof T>).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);
      setErrors({});

      if (validationRules) {
        const isValid = validateForm();
        if (!isValid) {
          setIsSubmitting(false);
          return false;
        }
      }

      try {
        await onSubmit(values);
        return true;
      } catch (error: unknown) {
        console.error('Form submission error:', error);
        // Handle API validation errors here if needed
        if (error && typeof error === 'object' && 'response' in error && 
            error.response && typeof error.response === 'object' && 
            'data' in error.response && error.response.data && 
            typeof error.response.data === 'object' && 'errors' in error.response.data) {
          setErrors((error.response.data as { errors: FormErrors<T> }).errors);
        } else {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
          setErrors({
            form: errorMessage,
          } as FormErrors<T>);
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationRules, validateForm]
  );

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
    setErrors,
    setValues,
  };
};

export default useForm;
