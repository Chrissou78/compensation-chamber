'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useActions } from '@/hooks/useActions';
import { ActionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Contract form logic Here based on action type } from './ExecuteAction';

interface ActionFormProps {
  actionId: ActionType;
}

export function ActionForm({ actionId }: ActionFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { getAction } = useActions();
  const action = getAction(actionId);

  const form = useForm({
    defaultValues: Object.fromEntries(action?.fields.map(f => [f.name, '']) || []),
  });

  if (!action) {
    return <div>Action not found</div>;
  }

  const handleSubmit = async (data: any) => {
    // Execute action based on actionId
    // Dispatch to correct contract function
    console.log('Executing action:', actionId, data);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">{action.title}</h1>
        <p className="text-gray-500">{action.description}</p>
        {action.requiresApproval && (
          <p className="text-sm text-blue-600 mt-2">
            ✓ This action requires governance approval
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Action</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {action.fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: fieldProps }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        {field.type === 'textarea' ? (
                          <Textarea placeholder={field.placeholder} {...fieldProps} />
                        ) : field.type === 'select' ? (
                          <Select onValueChange={fieldProps.onChange} defaultValue={fieldProps.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input type={field.type} placeholder={field.placeholder} {...fieldProps} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="flex gap-2">
                <Button type="submit" size="lg">
                  {action.requiresApproval ? 'Create Proposal' : 'Execute'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
