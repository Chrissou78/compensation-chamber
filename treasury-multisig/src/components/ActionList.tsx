'use client';

import { useActions } from '@/hooks/useActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export function ActionList() {
  const { getAllActions, getActionsByCategory } = useActions();

  const categories = ['governance', 'voting', 'emergency', 'treasury'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Actions</h1>
        <p className="text-gray-500">Select an action to execute</p>
      </div>

      <Tabs defaultValue="governance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getActionsByCategory(category).map((action) => (
                <Card key={action.id} className={
                  category === 'emergency' ? 'border-red-500 bg-red-50' : ''
                }>
                  <CardHeader>
                    <CardTitle>{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{action.icon}</span>
                      <Link href={`/actions/${action.id}`}>
                        <Button size="sm">Execute</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
