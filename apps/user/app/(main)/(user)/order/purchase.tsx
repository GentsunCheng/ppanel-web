'use client';

import useGlobalStore from '@/config/use-global';
import { checkoutOrder, preCreateOrder, purchase } from '@/services/user/order';
import { getAvailablePaymentMethods } from '@/services/user/payment';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Separator } from '@workspace/ui/components/separator';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/legacy/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { SubscribeBilling } from '../subscribe/billing';
import { SubscribeDetail } from '../subscribe/detail';

export default function Purchase({
  subscribe,
  setSubscribe,
}: {
  subscribe?: API.Subscribe;
  setSubscribe: (subscribe?: API.Subscribe) => void;
}) {
  const t = useTranslations('order');

  const { getUserInfo } = useGlobalStore();
  const router = useRouter();
  const [params, setParams] = useState<API.PurchaseOrderRequest>({
    quantity: 1,
    subscribe_id: subscribe?.id as number,
    payment: 'balance',
    coupon: '',
  });
  const [loading, startTransition] = useTransition();

  const { data: order } = useQuery({
    queryKey: ['preCreateOrder', params],
    queryFn: async () => {
      const { data } = await preCreateOrder({
        ...params,
        subscribe_id: subscribe?.id as number,
      });
      return data.data;
    },
    enabled: !!params?.subscribe_id,
  });
  const { data: paymentMethods } = useQuery({
    queryKey: ['getAvailablePaymentMethods'],
    queryFn: async () => {
      const { data } = await getAvailablePaymentMethods();
      return data.data?.list || [];
    },
  });

  useEffect(() => {
    if (subscribe) {
      setParams((prev) => ({
        ...prev,
        quantity: 1,
        subscribe_id: subscribe?.id,
      }));
    }
  }, [subscribe]);

  return (
    <Dialog
      open={!!subscribe?.id}
      onOpenChange={(open) => {
        if (!open) setSubscribe(undefined);
      }}
    >
      <DialogContent className='flex h-full max-w-screen-lg flex-col overflow-hidden border-none p-0 md:h-auto'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle>{t('buySubscription')}</DialogTitle>
        </DialogHeader>
        <div className='grid w-full flex-grow gap-3 overflow-auto p-6 pt-0 lg:grid-cols-2'>
          <Card className='border-transparent shadow-none md:border-inherit md:shadow'>
            <CardContent className='grid gap-3 p-0 text-sm md:p-6'>
              <SubscribeDetail
                subscribe={{
                  ...subscribe,
                  quantity: params.quantity,
                }}
              />
              <Separator />
              <SubscribeBilling
                order={{
                  ...order,
                  quantity: params.quantity,
                  unit_price: subscribe?.unit_price,
                }}
              />
            </CardContent>
          </Card>
          <div className='flex flex-col justify-between text-sm'>
            <div className='grid gap-3'>
              <div className='font-semibold'>{t('purchaseDuration')}</div>
              <RadioGroup
                value={String(params.quantity)}
                onValueChange={(value) => {
                  setParams({
                    ...params,
                    quantity: Number(value),
                  });
                }}
                className='flex flex-wrap gap-0.5 *:w-20 md:gap-2'
              >
                {subscribe?.unit_time !== 'Minute' && (
                  <div className='relative'>
                    <RadioGroupItem value='1' id='1' className='peer sr-only' />
                    <Label
                      htmlFor='1'
                      className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary relative flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-2'
                    >
                      1 / {t(subscribe?.unit_time || 'Month')}
                    </Label>
                  </div>
                )}
                {subscribe?.discount?.map((item) => (
                  <div key={item.quantity}>
                    <RadioGroupItem
                      value={String(item.quantity)}
                      id={String(item.quantity)}
                      className='peer sr-only'
                    />
                    <Label
                      htmlFor={String(item.quantity)}
                      className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary relative flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-2'
                    >
                      {item.quantity} / {t(subscribe?.unit_time || 'Month')}
                      {item.discount < 100 && (
                        <Badge variant='destructive'>-{100 - item.discount}%</Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className='flex'>
                <Input
                  placeholder={t('enterCoupon')}
                  value={params.coupon}
                  onChange={(e) => {
                    setParams({
                      ...params,
                      coupon: e.target.value.trim(),
                    });
                  }}
                />
              </div>
              <div className='font-semibold'>{t('paymentMethod')}</div>
              <RadioGroup
                className='mb-6 grid grid-cols-5 gap-2'
                value={params.payment}
                onValueChange={(value) => {
                  setParams({
                    ...params,
                    payment: value,
                  });
                }}
              >
                {paymentMethods?.map((item) => {
                  return (
                    <div key={item.mark}>
                      <RadioGroupItem value={item.mark} id={item.mark} className='peer sr-only' />
                      <Label
                        htmlFor={item.mark}
                        className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary flex flex-col items-center justify-between rounded-md border-2 py-2'
                      >
                        <div className='mb-3 size-12'>
                          <Image
                            src={item.icon || `/payment/${item.mark}.svg`}
                            width={48}
                            height={48}
                            alt={item.name!}
                          />
                        </div>
                        <span className='w-full overflow-hidden text-ellipsis whitespace-nowrap text-center'>
                          {item.name || t(`methods.${item.mark}`)}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
            <Button
              className='fixed bottom-0 left-0 w-full rounded-none md:relative md:mt-6'
              disabled={loading}
              onClick={async () => {
                startTransition(async () => {
                  try {
                    const response = await purchase(params);
                    const orderNo = response.data.data?.order_no;
                    if (orderNo) {
                      const { data } = await checkoutOrder({
                        orderNo,
                      });
                      const type = data.data?.type;
                      const checkout_url = data.data?.checkout_url;
                      if (type === 'link') {
                        const width = 600;
                        const height = 800;
                        const left = (screen.width - width) / 2;
                        const top = (screen.height - height) / 2;
                        window.open(
                          checkout_url,
                          'newWindow',
                          `width=${width},height=${height},top=${top},left=${left},menubar=0,scrollbars=1,resizable=1,status=1,titlebar=0,toolbar=0,location=1`,
                        );
                      }
                      getUserInfo();
                      router.push(`/payment?order_no=${orderNo}`);
                    }
                  } catch (error) {
                    console.log(error);
                  }
                });
              }}
            >
              {loading && <LoaderCircle className='mr-2 animate-spin' />}
              {t('buyNow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
