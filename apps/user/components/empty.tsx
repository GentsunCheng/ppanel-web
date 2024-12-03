'use client';

import { default as _Empty } from '@repo/ui/empty';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function Empty() {
  const t = useTranslations('common');

  const [description, setDescription] = useState('');

  useEffect(() => {
    const random = Math.floor(Math.random() * 10);
    setDescription(t(`empty.${random}`));
  }, []);

  return <_Empty description={description} />;
}
