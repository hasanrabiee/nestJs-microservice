import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { NOTIFICATION_SERVICE, CreateChargeDto } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentsCreateChargeDto } from './dto/payments-create-charge.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(
    this.configService.get('STRIPE_SECRET_KEY'),
    {
      apiVersion: '2024-12-18.acacia',
    },
  );

  constructor(
    private readonly configService: ConfigService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: ClientProxy,
  ) {}

  async createCharge({ amount, email }: PaymentsCreateChargeDto) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        payment_method: 'pm_card_visa',
        amount: amount * 100,
        confirm: true,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      this.notificationService.emit('notify_email', {
        email,
        text: `Your Payment of $${amount} has completed successfully`,
      });

      return paymentIntent;
    } catch (e) {
      console.log(e);
      return {
        msg: 'error',
      };
    }
  }
}
