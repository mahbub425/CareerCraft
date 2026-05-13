import { ID, Permission, Query, Role, type Models } from 'appwrite';
import { account, assetsBucketId, collections, databaseId, databases, paymentProofsBucketId, storage } from '../lib/appwrite';
import type { TemplateDoc } from './cvService';

export type PlanDoc = Models.Document & {
  name: string;
  price_bdt: number;
  duration_days: number;
  ai_credits: number;
  download_limit: number;
  premium_templates: boolean;
  priority_support: boolean;
  status: 'Active' | 'Inactive';
  sort_order: number;
  features?: string;
};

export type SubscriptionDoc = Models.Document & {
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  starts_at: string;
  expires_at: string;
  ai_credits_used: number;
  downloads_used: number;
};

export type PaymentRequestDoc = Models.Document & {
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  plan_name: string;
  amount_bdt: number;
  bkash_number: string;
  sender_number: string;
  transaction_id: string;
  screenshot_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  submitted_at: string;
  reviewed_at?: string;
};

export type BillingSettingsDoc = Models.Document & {
  key: string;
  free_ai_credits: number;
  free_download_limit: number;
  bkash_number: string;
  payment_instruction: string;
  updated_at?: string;
};

export type Entitlement = {
  planName: string;
  planId: string;
  isPaid: boolean;
  premiumTemplates: boolean;
  aiCredits: number;
  aiUsed: number;
  aiRemaining: number;
  downloadLimit: number;
  downloadsUsed: number;
  downloadsRemaining: number;
  expiresAt?: string;
  subscription?: SubscriptionDoc | null;
  settings: BillingSettingsDoc;
};

const now = () => new Date().toISOString();
const usagePeriod = () => new Date().toISOString().slice(0, 7);
const planSlug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';

export const defaultPlans: Array<Omit<PlanDoc, keyof Models.Document>> = [
  {
    name: 'Free',
    price_bdt: 0,
    duration_days: 30,
    ai_credits: 10,
    download_limit: 2,
    premium_templates: false,
    priority_support: false,
    status: 'Active',
    sort_order: 0,
    features: '10 AI credits/month\n2 free-template downloads/month\nPremium template preview',
  },
  {
    name: 'Starter',
    price_bdt: 99,
    duration_days: 30,
    ai_credits: 80,
    download_limit: 20,
    premium_templates: true,
    priority_support: false,
    status: 'Active',
    sort_order: 1,
    features: '80 AI credits/month\n20 downloads/month\nPremium template downloads',
  },
  {
    name: 'Pro',
    price_bdt: 199,
    duration_days: 30,
    ai_credits: 250,
    download_limit: -1,
    premium_templates: true,
    priority_support: false,
    status: 'Active',
    sort_order: 2,
    features: '250 AI credits/month\nUnlimited downloads\nPremium template downloads',
  },
  {
    name: 'Career Plus',
    price_bdt: 299,
    duration_days: 30,
    ai_credits: 600,
    download_limit: -1,
    premium_templates: true,
    priority_support: true,
    status: 'Active',
    sort_order: 3,
    features: '600 AI credits/month\nUnlimited downloads\nPremium templates\nPriority support',
  },
];

export const getPlanKey = (plan: Pick<PlanDoc, '$id' | 'name'>) => plan.$id || planSlug(plan.name);

const defaultPlanDocuments = () => defaultPlans.map((plan, index) => ({
  ...plan,
  $id: planSlug(plan.name),
  $sequence: String(index + 1),
  $collectionId: collections.plans,
  $databaseId: databaseId,
  $createdAt: now(),
  $updatedAt: now(),
  $permissions: [],
} as unknown as PlanDoc));

export const defaultBillingSettings: Omit<BillingSettingsDoc, keyof Models.Document> = {
  key: 'billing',
  free_ai_credits: 10,
  free_download_limit: 2,
  bkash_number: '01XXXXXXXXX',
  payment_instruction: 'Send money to the bKash number, then submit your transaction ID, sender number, and screenshot.',
  updated_at: now(),
};

const userPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
  Permission.read(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const paymentPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.read(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
];

const isMissingCollection = (error: unknown) => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('collection') && message.includes('not');
};

const isMissingBucket = (error: unknown) => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('bucket') && (message.includes('not found') || message.includes('could not be found'));
};

const sortPlans = (plans: PlanDoc[]) => [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.price_bdt - b.price_bdt);
const PREMIUM_TEMPLATE_UPGRADE_MESSAGE = 'Premium template. Please upgrade your plan to download this CV.';

export const isPremiumTemplate = (template?: TemplateDoc | null) => {
  if (!template) return false;
  const accessType = String(template.access_type || '').toLowerCase();
  const isFree = template.is_free;
  return accessType === 'premium' || isFree === false || String(isFree).toLowerCase() === 'false';
};

export const revenueService = {
  listPlans: async (activeOnly = true) => {
    try {
      const queries = [Query.orderAsc('sort_order'), Query.limit(100)];
      if (activeOnly) queries.unshift(Query.equal('status', 'Active'));
      const result = await databases.listDocuments<PlanDoc>(databaseId, collections.plans, queries);
      return { ...result, documents: sortPlans(result.documents) };
    } catch (error) {
      if (isMissingCollection(error)) {
        const documents = defaultPlanDocuments();
        return { documents, total: documents.length } as Models.DocumentList<PlanDoc>;
      }
      throw error;
    }
  },

  savePlan: async (planId: string | null, data: Partial<PlanDoc>) => {
    const payload = {
      name: data.name || 'Untitled Plan',
      price_bdt: Number(data.price_bdt ?? 0),
      duration_days: Number(data.duration_days ?? 30),
      ai_credits: Number(data.ai_credits ?? 0),
      download_limit: Number(data.download_limit ?? 0),
      premium_templates: Boolean(data.premium_templates),
      priority_support: Boolean(data.priority_support),
      status: data.status || 'Active',
      sort_order: Number(data.sort_order ?? 0),
      features: data.features || '',
    };

    if (planId) return databases.updateDocument<PlanDoc>(databaseId, collections.plans, planId, payload);
    return databases.createDocument<PlanDoc>(databaseId, collections.plans, ID.unique(), payload);
  },

  getBillingSettings: async () => {
    try {
      return await databases.getDocument<BillingSettingsDoc>(databaseId, collections.billingSettings, 'billing');
    } catch {
      return defaultBillingSettings as BillingSettingsDoc;
    }
  },

  saveBillingSettings: async (data: Partial<BillingSettingsDoc>) => {
    return databases.upsertDocument<BillingSettingsDoc>(databaseId, collections.billingSettings, 'billing', {
      key: 'billing',
      free_ai_credits: Number(data.free_ai_credits ?? defaultBillingSettings.free_ai_credits),
      free_download_limit: Number(data.free_download_limit ?? defaultBillingSettings.free_download_limit),
      bkash_number: data.bkash_number || defaultBillingSettings.bkash_number,
      payment_instruction: data.payment_instruction || defaultBillingSettings.payment_instruction,
      updated_at: now(),
    });
  },

  getActiveSubscription: async (userId: string) => {
    try {
      const result = await databases.listDocuments<SubscriptionDoc>(databaseId, collections.subscriptions, [
        Query.equal('user_id', userId),
        Query.equal('status', 'Active'),
        Query.orderDesc('expires_at'),
        Query.limit(20),
      ]);
      const activeDocs = result.documents.filter((item) => new Date(item.expires_at).getTime() >= Date.now());
      const subscription = activeDocs.find((item) => item.plan_id !== 'free') || activeDocs[0] || null;
      if (!subscription) return null;
      await Promise.all(result.documents
        .filter((item) => new Date(item.expires_at).getTime() < Date.now())
        .map((item) => databases.updateDocument(databaseId, collections.subscriptions, item.$id, { status: 'Expired' }).catch(() => undefined)));
      return subscription;
    } catch (error) {
      if (isMissingCollection(error)) return null;
      throw error;
    }
  },

  getLatestPaidSubscription: async (userId: string) => {
    try {
      const result = await databases.listDocuments<SubscriptionDoc>(databaseId, collections.subscriptions, [
        Query.equal('user_id', userId),
        Query.orderDesc('expires_at'),
        Query.limit(50),
      ]);
      return result.documents.find((item) => item.plan_id !== 'free') || null;
    } catch (error) {
      if (isMissingCollection(error)) return null;
      throw error;
    }
  },

  getOrCreateFreeSubscription: async (userId: string) => {
    try {
      const result = await databases.listDocuments<SubscriptionDoc>(databaseId, collections.subscriptions, [
        Query.equal('user_id', userId),
        Query.equal('plan_id', 'free'),
        Query.equal('status', 'Active'),
        Query.orderDesc('expires_at'),
        Query.limit(1),
      ]);
      const existing = result.documents[0];
      if (existing && new Date(existing.expires_at).getTime() >= Date.now()) return existing;

      const starts = new Date();
      const expires = new Date(starts);
      expires.setDate(expires.getDate() + 30);
      return await databases.createDocument<SubscriptionDoc>(
        databaseId,
        collections.subscriptions,
        ID.unique(),
        {
          user_id: userId,
          plan_id: 'free',
          plan_name: 'Free',
          status: 'Active',
          starts_at: starts.toISOString(),
          expires_at: expires.toISOString(),
          ai_credits_used: 0,
          downloads_used: 0,
        },
        userPermissions(userId),
      );
    } catch (error) {
      if (isMissingCollection(error)) return null;
      throw error;
    }
  },

  getEntitlement: async (userId: string): Promise<Entitlement> => {
    const [settings, subscription] = await Promise.all([
      revenueService.getBillingSettings(),
      revenueService.getActiveSubscription(userId),
    ]);

    if (subscription) {
      const plans = await revenueService.listPlans(false);
      const plan = plans.documents.find((item) => getPlanKey(item) === subscription.plan_id || item.$id === subscription.plan_id || item.name === subscription.plan_name);
      const isPaid = subscription.plan_id !== 'free' && (plan?.price_bdt ?? 0) > 0;
      const aiCredits = isPaid ? plan?.ai_credits ?? 0 : settings.free_ai_credits;
      const downloadLimit = isPaid ? plan?.download_limit ?? 0 : settings.free_download_limit;
      return {
        planName: plan?.name || subscription.plan_name,
        planId: plan ? getPlanKey(plan) : subscription.plan_id,
        isPaid,
        premiumTemplates: isPaid && Boolean(plan?.premium_templates ?? true),
        aiCredits,
        aiUsed: subscription.ai_credits_used || 0,
        aiRemaining: Math.max(0, aiCredits - (subscription.ai_credits_used || 0)),
        downloadLimit,
        downloadsUsed: subscription.downloads_used || 0,
        downloadsRemaining: downloadLimit < 0 ? Number.POSITIVE_INFINITY : Math.max(0, downloadLimit - (subscription.downloads_used || 0)),
        expiresAt: subscription.expires_at,
        subscription,
        settings,
      };
    }

    const freeSubscription = await revenueService.getOrCreateFreeSubscription(userId);
    if (freeSubscription) {
      return {
        planName: 'Free',
        planId: 'free',
        isPaid: false,
        premiumTemplates: false,
        aiCredits: settings.free_ai_credits,
        aiUsed: freeSubscription.ai_credits_used || 0,
        aiRemaining: Math.max(0, settings.free_ai_credits - (freeSubscription.ai_credits_used || 0)),
        downloadLimit: settings.free_download_limit,
        downloadsUsed: freeSubscription.downloads_used || 0,
        downloadsRemaining: Math.max(0, settings.free_download_limit - (freeSubscription.downloads_used || 0)),
        expiresAt: freeSubscription.expires_at,
        subscription: freeSubscription,
        settings,
      };
    }

    return {
      planName: 'Free',
      planId: 'free',
      isPaid: false,
      premiumTemplates: false,
      aiCredits: settings.free_ai_credits,
      aiUsed: Number(localStorage.getItem(`free_ai_used_${usagePeriod()}_${userId}`) || '0'),
      aiRemaining: Math.max(0, settings.free_ai_credits - Number(localStorage.getItem(`free_ai_used_${usagePeriod()}_${userId}`) || '0')),
      downloadLimit: settings.free_download_limit,
      downloadsUsed: Number(localStorage.getItem(`free_downloads_used_${usagePeriod()}_${userId}`) || '0'),
      downloadsRemaining: Math.max(0, settings.free_download_limit - Number(localStorage.getItem(`free_downloads_used_${usagePeriod()}_${userId}`) || '0')),
      subscription: null,
      settings,
    };
  },

  assertCanUseAi: async (userId: string) => {
    const entitlement = await revenueService.getEntitlement(userId);
    if (entitlement.aiRemaining <= 0) {
      throw new Error('AI credit limit reached. Please upgrade your package to continue using AI suggestions.');
    }
    return entitlement;
  },

  incrementAiUsage: async (userId: string) => {
    const entitlement = await revenueService.getEntitlement(userId);
    if (entitlement.subscription) {
      await databases.updateDocument(databaseId, collections.subscriptions, entitlement.subscription.$id, {
        ai_credits_used: (entitlement.subscription.ai_credits_used || 0) + 1,
      });
      return;
    }
    localStorage.setItem(`free_ai_used_${usagePeriod()}_${userId}`, String((entitlement.aiUsed || 0) + 1));
  },

  assertCanDownload: async (userId: string, template?: TemplateDoc | null) => {
    const entitlement = await revenueService.getEntitlement(userId);
    if (isPremiumTemplate(template) && !entitlement.premiumTemplates) {
      throw new Error(PREMIUM_TEMPLATE_UPGRADE_MESSAGE);
    }
    if (entitlement.downloadsRemaining <= 0) {
      throw new Error('Download limit reached. Please upgrade your package to download more CVs.');
    }
    return entitlement;
  },

  incrementDownloadUsage: async (userId: string) => {
    const entitlement = await revenueService.getEntitlement(userId);
    if (entitlement.subscription) {
      await databases.updateDocument(databaseId, collections.subscriptions, entitlement.subscription.$id, {
        downloads_used: (entitlement.subscription.downloads_used || 0) + 1,
      });
      return;
    }
    localStorage.setItem(`free_downloads_used_${usagePeriod()}_${userId}`, String((entitlement.downloadsUsed || 0) + 1));
  },

  uploadPaymentProof: async (file: File, userId: string) => {
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.delete(Role.user(userId)),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];

    const uploadToBucket = async (bucketId: string) => {
      const uploaded = await storage.createFile(bucketId, ID.unique(), file, permissions);
      return storage.getFileView(bucketId, uploaded.$id).toString();
    };

    try {
      return await uploadToBucket(paymentProofsBucketId);
    } catch (error) {
      if (!isMissingBucket(error) || paymentProofsBucketId === assetsBucketId) throw error;
      return uploadToBucket(assetsBucketId);
    }
  },

  submitPayment: async (plan: PlanDoc, data: { senderNumber: string; transactionId: string; screenshotUrl?: string }) => {
    const user = await account.get();
    const settings = await revenueService.getBillingSettings();
    const existing = await databases.listDocuments<PaymentRequestDoc>(databaseId, collections.paymentRequests, [
      Query.equal('transaction_id', data.transactionId),
      Query.limit(1),
    ]).catch((error) => {
      if (isMissingCollection(error)) {
        throw new Error('Payment system is not ready yet. Please run Appwrite setup to create the payment_requests collection.');
      }
      throw error;
    });
    if (existing.documents.length) throw new Error('This transaction ID has already been submitted.');

    const payment = await databases.createDocument<PaymentRequestDoc>(
      databaseId,
      collections.paymentRequests,
      ID.unique(),
      {
        user_id: user.$id,
        user_email: user.email,
        user_name: user.name,
        plan_id: getPlanKey(plan),
        plan_name: plan.name,
        amount_bdt: plan.price_bdt,
        bkash_number: settings.bkash_number,
        sender_number: data.senderNumber,
        transaction_id: data.transactionId,
        screenshot_url: data.screenshotUrl || '',
        status: 'pending',
        admin_note: '',
        submitted_at: now(),
      },
      paymentPermissions(user.$id),
    );

    await revenueService.sendPaymentEmail('submitted', payment).catch(() => undefined);
    return payment;
  },

  listMyPayments: async (userId: string) => {
    try {
      return await databases.listDocuments<PaymentRequestDoc>(databaseId, collections.paymentRequests, [
        Query.equal('user_id', userId),
        Query.orderDesc('submitted_at'),
        Query.limit(20),
      ]);
    } catch (error) {
      if (isMissingCollection(error)) return { documents: [], total: 0 } as Models.DocumentList<PaymentRequestDoc>;
      throw error;
    }
  },

  listPayments: async () => {
    return databases.listDocuments<PaymentRequestDoc>(databaseId, collections.paymentRequests, [
      Query.orderDesc('submitted_at'),
      Query.limit(100),
    ]);
  },

  listSubscriptions: async () => {
    return databases.listDocuments<SubscriptionDoc>(databaseId, collections.subscriptions, [
      Query.orderDesc('expires_at'),
      Query.limit(100),
    ]);
  },

  approvePayment: async (payment: PaymentRequestDoc, note = '') => {
    const plans = await revenueService.listPlans(false);
    const plan = plans.documents.find((item) => getPlanKey(item) === payment.plan_id || item.$id === payment.plan_id || item.name === payment.plan_name);
    if (!plan) throw new Error('Selected plan was not found.');

    const current = await revenueService.getActiveSubscription(payment.user_id);
    const start = new Date();
    const base = current && new Date(current.expires_at).getTime() > start.getTime() ? new Date(current.expires_at) : start;
    const expires = new Date(base);
    expires.setDate(expires.getDate() + plan.duration_days);

    const payload = {
      user_id: payment.user_id,
      plan_id: getPlanKey(plan),
      plan_name: plan.name,
      status: 'Active',
      starts_at: current?.starts_at || start.toISOString(),
      expires_at: expires.toISOString(),
      ai_credits_used: current?.ai_credits_used || 0,
      downloads_used: current?.downloads_used || 0,
    };

    if (current) await databases.updateDocument(databaseId, collections.subscriptions, current.$id, payload);
    else {
      await databases.createDocument(databaseId, collections.subscriptions, ID.unique(), payload, userPermissions(payment.user_id));
    }

    const updated = await databases.updateDocument<PaymentRequestDoc>(databaseId, collections.paymentRequests, payment.$id, {
      status: 'approved',
      admin_note: note,
      reviewed_at: now(),
    });

    await revenueService.sendPaymentEmail('approved', updated, expires.toISOString()).catch(() => undefined);
    return updated;
  },

  rejectPayment: async (payment: PaymentRequestDoc, note = '') => {
    const updated = await databases.updateDocument<PaymentRequestDoc>(databaseId, collections.paymentRequests, payment.$id, {
      status: 'rejected',
      admin_note: note,
      reviewed_at: now(),
    });
    await revenueService.sendPaymentEmail('rejected', updated).catch(() => undefined);
    return updated;
  },

  sendPaymentEmail: async (type: 'submitted' | 'approved' | 'rejected', payment: PaymentRequestDoc, expiresAt?: string) => {
    await fetch('/api/email/payment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payment, expiresAt }),
    });
  },
};
