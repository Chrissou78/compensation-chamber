'use client';

import { use } from 'react';
import { ActionForm } from '@/components/ActionForm';

export default function ActionPage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = use(params);
  return <ActionForm actionId={actionId as any} />;
}
