import React from 'react';
import { Newspaper } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { NewsSection } from '../components/news/NewsSection';

export const NewsPage: React.FC = () => (
  <div className="space-y-4">
    <PageHeader
      icon={Newspaper}
      eyebrow="Research / News"
      title="Market News Wire"
      subtitle="Breaking financial headlines across equities, macro, crypto and commodities"
    />
    <NewsSection limit={30} />
  </div>
);
