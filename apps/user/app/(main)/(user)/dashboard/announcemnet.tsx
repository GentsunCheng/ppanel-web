'use client';

import { Empty } from '@/components/empty';
import { queryAnnouncement } from '@/services/user/announcement';
import { Icon } from '@iconify/react';
import { Markdown } from '@repo/ui/markdown';
import { Card } from '@shadcn/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

export default function Announcement() {
  const t = useTranslations('dashboard');

  const { data } = useQuery({
    queryKey: ['queryAnnouncement', 1],
    queryFn: async () => {
      const { data } = await queryAnnouncement({
        page: 1,
        size: 1,
      });
      return (data.data?.announcements?.[0] as API.Announcement) || {};
    },
  });

  return (
    <>
      <h2 className='flex items-center gap-1.5 font-semibold'>
        <Icon icon='uil:bell' className='size-5' />
        {t('latestAnnouncement')}
      </h2>
      <Card className='p-6'>
        {data?.content ? <Markdown>{data?.content}</Markdown> : <Empty />}
      </Card>
    </>
  );
}
