/**
 * PostgreSQL enums. Values are stored in the database and referenced by code: never rename or
 * remove a value, only add new ones (in a migration).
 */
import { pgEnum } from 'drizzle-orm/pg-core';

// --- Identity -----------------------------------------------------------------------------
export const userStatus = pgEnum('user_status', ['active', 'restricted', 'closed']);
export const devicePlatform = pgEnum('device_platform', ['ios', 'android']);
export const loginMethod = pgEnum('login_method', ['sms', 'whatsapp', 'email', 'passkey']);
export const consentType = pgEnum('consent_type', [
  'terms',
  'privacy',
  'risk',
  'marketing',
  'contacts_sync',
  'referral_terms',
]);
export const cloudBackup = pgEnum('cloud_backup', ['none', 'icloud', 'gdrive']);

// --- Chains & wallets ----------------------------------------------------------------------
export const networkKey = pgEnum('network_key', [
  'ethereum',
  'polygon',
  'bsc',
  'solana',
  'tron',
  'bitcoin',
]);
export const networkFamily = pgEnum('network_family', ['evm', 'solana', 'tron', 'bitcoin']);
export const walletKind = pgEnum('wallet_kind', ['embedded_eoa', 'eoa_7702']);

// --- Money movement ------------------------------------------------------------------------
export const txDirection = pgEnum('tx_direction', ['in', 'out', 'self']);
export const txKind = pgEnum('tx_kind', [
  'send',
  'receive',
  'swap_leg',
  'stake',
  'unstake',
  'reward',
  'approval',
  'escrow_deposit',
  'escrow_claim',
  'escrow_refund',
  'escrow_cancel',
  'ramp_in',
  'ramp_out',
  'consolidate',
  'fee',
  'referral_reward',
]);
export const txStatus = pgEnum('tx_status', ['pending', 'confirmed', 'failed', 'replaced']);
export const txSource = pgEnum('tx_source', ['app', 'indexer']);
export const counterpartyKind = pgEnum('counterparty_kind', [
  'jokko_user',
  'external_address',
  'provider',
]);
export const inviteStatus = pgEnum('invite_status', [
  'pending',
  'claimed',
  'cancelled',
  'refunded',
  'failed',
]);
export const quoteKind = pgEnum('quote_kind', ['ramp', 'swap', 'stake', 'send', 'phone_send']);
export const rampDirection = pgEnum('ramp_direction', ['on', 'off']);
export const rampStatus = pgEnum('ramp_status', [
  'created',
  'awaiting_payment',
  'payment_received',
  'processing',
  'completed',
  'failed',
  'expired',
  'cancelled',
  'refunded',
]);
export const swapStatus = pgEnum('swap_status', [
  'quoted',
  'submitted',
  'pending',
  'completed',
  'failed',
  'refunded',
]);
export const stakingStatus = pgEnum('staking_status', [
  'activating',
  'active',
  'unstaking',
  'withdrawable',
  'closed',
]);
export const stakingEventKind = pgEnum('staking_event_kind', [
  'stake',
  'unstake',
  'withdraw',
  'reward',
  'claim',
]);
export const loanStatus = pgEnum('loan_status', ['active', 'repaid', 'liquidated', 'closed']);
export const cashCodeStatus = pgEnum('cash_code_status', [
  'pending',
  'confirmed',
  'expired',
  'redeemed',
]);

// --- Compliance ----------------------------------------------------------------------------
export const kycStatus = pgEnum('kyc_status', ['none', 'pending', 'approved', 'rejected']);
export const screeningDecision = pgEnum('screening_decision', ['allow', 'flag', 'block']);
export const riskSeverity = pgEnum('risk_severity', ['low', 'medium', 'high', 'critical']);
export const riskAlertStatus = pgEnum('risk_alert_status', ['open', 'reviewing', 'closed']);

// --- Integrations --------------------------------------------------------------------------
export const webhookStatus = pgEnum('webhook_status', [
  'received',
  'processed',
  'ignored',
  'failed',
]);
export const jobStatus = pgEnum('job_status', [
  'pending',
  'running',
  'succeeded',
  'failed',
  'dead',
]);

// --- Engagement ----------------------------------------------------------------------------
export const notificationChannel = pgEnum('notification_channel', [
  'push',
  'email',
  'sms',
  'whatsapp',
  'inapp',
]);
export const notificationStatus = pgEnum('notification_status', [
  'queued',
  'sent',
  'delivered',
  'failed',
  'read',
]);
export const priceAlertDirection = pgEnum('price_alert_direction', ['above', 'below']);
export const referralStatus = pgEnum('referral_status', [
  'signed_up',
  'qualifying',
  'on_hold',
  'eligible',
  'paid',
  'rejected',
]);
export const rewardStatus = pgEnum('reward_status', ['scheduled', 'sent', 'confirmed', 'failed']);
export const waitlistProduct = pgEnum('waitlist_product', ['card', 'business']);

// --- Fees & company wallets ------------------------------------------------------------------
export const feeProduct = pgEnum('fee_product', [
  'topup',
  'withdraw',
  'send',
  'phone_send',
  'swap',
  'consolidate',
  'stake',
  'borrow',
  'card',
  'cash_topup',
]);
export const feeScheduleStatus = pgEnum('fee_schedule_status', [
  'draft',
  'pending_approval',
  'active',
  'retired',
]);
export const feeCollectionMethod = pgEnum('fee_collection_method', [
  'onchain_transfer',
  'provider_partner_fee',
  'lifi_integrator_fee',
  'everstake_revenue_share',
  'escrow_claim',
]);
export const feeCollectionStatus = pgEnum('fee_collection_status', [
  'expected',
  'collected',
  'reconciled',
  'disputed',
]);
export const companyWalletPurpose = pgEnum('company_wallet_purpose', [
  'fee_treasury',
  'rewards',
  'escrow_keeper',
  'kora_fee_payer',
]);
export const custodyKind = pgEnum('custody_kind', ['multisig', 'kms']);

// --- Admin & audit ---------------------------------------------------------------------------
export const actorType = pgEnum('actor_type', ['user', 'admin', 'system']);
export const adminRole = pgEnum('admin_role', [
  'support',
  'compliance',
  'marketing',
  'finance',
  'admin',
]);
export const approvalStatus = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'expired',
  'executed',
]);
export const flagSegmentKind = pgEnum('flag_segment_kind', [
  'all',
  'country',
  'platform',
  'min_app_version',
  'user_list',
  'percentage',
]);
