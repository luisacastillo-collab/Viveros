export function subscriptionGrantsAccess(subscription) {
  if (!subscription) return false;
  return subscription.status === "active" || subscription.status === "trialing";
}

export function subscriptionNeedsPaymentAttention(subscription) {
  return subscription?.status === "past_due";
}
