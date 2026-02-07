import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PixPaymentData {
  pix_id: string;
  qr_code: string;
  qr_code_base64: string;
  amount: number;
  expires_at: string;
  status: string;
}

interface BillingData {
  billing_id: string;
  checkout_url: string;
  amount: number;
  status: string;
}

export function usePayment() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);

  const createPixPayment = async (planId: string): Promise<PixPaymentData | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('abacatepay-billing/pix', {
        body: {
          plan_id: planId,
          user_id: user.id,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setPixData(data);
      return data;
    } catch (error: any) {
      console.error('PIX creation error:', error);
      toast.error(error.message || 'Erro ao criar pagamento PIX');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCardPayment = async (planId: string): Promise<BillingData | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('abacatepay-billing/create', {
        body: {
          plan_id: planId,
          user_id: user.id,
          payment_method: 'CARD',
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setBillingData(data);
      return data;
    } catch (error: any) {
      console.error('Card billing error:', error);
      toast.error(error.message || 'Erro ao criar cobrança');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPixStatus = async (pixId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('abacatepay-billing/pix-status', {
        body: {},
        method: 'GET',
        headers: {},
      });

      // For GET requests with query params, we need to call differently
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/abacatepay-billing/pix-status?id=${pixId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const result = await response.json();
      return result.data?.status || null;
    } catch (error) {
      console.error('PIX status check error:', error);
      return null;
    }
  };

  const clearPaymentData = () => {
    setPixData(null);
    setBillingData(null);
  };

  return {
    isLoading,
    pixData,
    billingData,
    createPixPayment,
    createCardPayment,
    checkPixStatus,
    clearPaymentData,
  };
}
