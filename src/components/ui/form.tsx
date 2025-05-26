'use client';

import { FormHTMLAttributes, forwardRef } from 'react';

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  action: (formData: FormData) => Promise<void>;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ action, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          await action(formData);
        }}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form'; 