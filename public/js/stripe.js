import axios from 'axios';

import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    // 1. Adding stripe to frontend
    const stripe = Stripe(
      'pk_test_51NeVpTSCMD6YFv2K1svb0A7jusdCBT0f7qkMUtULcijePnzqhYwwQCvFmd2EFik0KCJIusfXSc0viRrdPuF40F9q00RJiStjV4'
    );

    // 2. Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 3. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
  }
};
